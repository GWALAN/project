import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useForm } from 'react-hook-form';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/lib/store';
import { User } from '@/types';

interface OnboardingFormValues {
  displayName: string;
  username: string;
  bio: string;
}

export function OnboardingPage() {
  const { session } = useSessionContext();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser, setIsCreator } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingFormValues>();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    if (!session?.user) {
      toast({
        title: 'Authentication error',
        description: 'You must be logged in to complete onboarding.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if username already exists using maybeSingle() instead of single()
      const { data: usernameCheck, error: usernameError } = await supabase
        .from('users')
        .select('username')
        .eq('username', data.username)
        .maybeSingle();
      
      if (usernameError) throw usernameError;
      
      if (usernameCheck) {
        toast({
          title: 'Username already taken',
          description: 'Please choose a different username.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      let profileImageUrl = '';
      
      // Upload profile image if provided
      if (profileImage) {
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, profileImage, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);
        
        profileImageUrl = urlData.publicUrl;
      }
      
      // Create user profile
      const newUser: Omit<User, 'id' | 'createdAt'> = {
        email: session.user.email || '',
        username: data.username,
        displayName: data.displayName,
        bio: data.bio,
        profileImage: profileImageUrl,
      };
      
      const { error: profileError } = await supabase
        .from('users')
        .insert([{ id: session.user.id, ...newUser }]);
      
      if (profileError) throw profileError;
      
      // Create default profile settings
      const { error: settingsError } = await supabase
        .from('profiles')
        .insert([{
          userid: session.user.id,
          layout: 'grid',
          theme: 'default',
          externallinks: []
        }]);
      
      if (settingsError) throw settingsError;
      
      toast({
        title: 'Profile created successfully',
        description: 'You can now start using LinkNest.',
      });
      
      setUser({
        id: session.user.id,
        ...newUser,
        createdAt: new Date().toISOString(),
      } as User);
      
      setIsCreator(true);
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Onboarding failed',
        description: error.message || 'An error occurred during onboarding.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 shadow rounded-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="text-sm text-gray-600 mt-2">
            Tell us a bit about yourself to set up your creator profile
          </p>
        </div>
        
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 mb-4">
              {profileImagePreview ? (
                <img 
                  src={profileImagePreview} 
                  alt="Profile preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400">
                  <Upload className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center">
              <Button type="button" variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  Upload Photo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </Button>
            </div>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <div className="mt-1">
              <Input
                id="displayName"
                {...register('displayName', { 
                  required: 'Display name is required',
                })}
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="mt-1">
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">linknest.com/u/</span>
                <Input
                  id="username"
                  {...register('username', { 
                    required: 'Username is required',
                    pattern: {
                      value: /^[a-z0-9_-]+$/i,
                      message: 'Username can only contain letters, numbers, underscores and hyphens',
                    },
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters long',
                    },
                  })}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              This will be your unique profile URL that you share with others.
            </p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <div className="mt-1">
              <Textarea
                id="bio"
                rows={3}
                placeholder="Tell people a bit about yourself..."
                {...register('bio', { 
                  required: 'Bio is required',
                  maxLength: {
                    value: 160,
                    message: 'Bio cannot exceed 160 characters',
                  },
                })}
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Creating profile...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}