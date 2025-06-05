import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUserStore } from '@/lib/store';
import { User, Profile, DEFAULT_THEME } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { SettingsSection } from '@/components/ui/settings-section';
import { SocialLinkManager } from '@/components/ui/social-link-manager';
import ProfileAvatarUploader from '@/components/ProfileAvatarUploader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeleteAccount } from '@/components/auth/DeleteAccount';

interface SettingsFormValues {
  displayName: string;
  username: string;
  bio: string;
  layout: 'list' | 'grid';
}

export function SettingsPage() {
  const { session } = useSessionContext();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { user, updateUser } = useUserStore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeSection, setActiveSection] = useState<'profile' | 'account'>('profile');
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<SettingsFormValues>();

  useEffect(() => {
    if (!user || !session) return;
    
    loadSettings();
  }, [user, session]);

  const loadSettings = async () => {
    if (!user || !session) return;
    
    try {
      setIsLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('userid', user.id)
        .maybeSingle();
      
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      // Get profile image URL if it exists
      if (user.profileImage) {
        try {
          // If it's a full URL, use it directly
          if (user.profileImage.startsWith('http')) {
            setProfileImageUrl(user.profileImage);
          } else {
            // Otherwise, get the public URL from Supabase
            const { data } = supabase.storage
              .from('profile-images')
              .getPublicUrl(user.profileImage);
              
            if (data?.publicUrl) {
              setProfileImageUrl(data.publicUrl);
            }
          }
        } catch (error) {
          console.error('Error loading profile image:', error);
        }
      }
      
      if (profileData) {
        setProfile(profileData);
        setLinks(profileData.externallinks || []);
      } else {
        // Create default profile if it doesn't exist
        const defaultProfile = {
          userid: user.id,
          layout: 'grid' as const,
          theme: 'default',
          themeconfig: DEFAULT_THEME,
          externallinks: []
        };
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([defaultProfile]);
        
        if (insertError) throw insertError;
        
        setProfile(defaultProfile);
        setLinks([]);
      }
      
      reset({
        displayName: user.displayName,
        username: user.username,
        bio: user.bio,
        layout: (profileData?.layout || 'grid') as 'list' | 'grid'
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error loading settings',
        description: 'There was a problem loading your settings.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLinks = async (newLinks: any[]) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ externallinks: newLinks })
        .eq('userid', user.id);
      
      if (error) throw error;
      
      setLinks(newLinks);
      
      toast({
        title: 'Links updated',
        description: 'Your social links have been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating links:', error);
      toast({
        title: 'Error updating links',
        description: 'There was a problem updating your links.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: SettingsFormValues) => {
    if (!user || !session?.user) {
      toast({
        title: 'Authentication error',
        description: 'You must be logged in to update your settings.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    setIsSubmitting(true);
    
    try {
      if (data.username !== user.username) {
        const { data: usernameCheck } = await supabase
          .from('users')
          .select('username')
          .eq('username', data.username)
          .not('id', 'eq', user.id)
          .maybeSingle();
        
        if (usernameCheck) {
          toast({
            title: 'Username already taken',
            description: 'Please choose a different username.',
            variant: 'destructive',
          });
          setIsSaving(false);
          setIsSubmitting(false);
          return;
        }
      }
      
      const { error: userError } = await supabase
        .from('users')
        .update({
          displayName: data.displayName,
          username: data.username,
          bio: data.bio,
        })
        .eq('id', user.id);
      
      if (userError) throw userError;
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          layout: data.layout,
          externallinks: links,
        })
        .eq('userid', user.id);
      
      if (profileError) throw profileError;
      
      updateUser({
        displayName: data.displayName,
        username: data.username,
        bio: data.bio,
      });
      
      toast({
        title: 'Settings updated',
        description: 'Your profile settings have been updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating settings',
        description: error.message || 'An error occurred while updating your settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">
            Manage your profile information and appearance
          </p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-4">
            <Button
              variant={activeSection === 'profile' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('profile')}
            >
              Profile
            </Button>
            <Button
              variant={activeSection === 'account' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('account')}
            >
              Account
            </Button>
          </div>
        </div>
        
        <div className="content-section p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            {activeSection === 'profile' && (
              <>
                {/* Profile Picture */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>
                  <ProfileAvatarUploader />
                </div>

                {/* Basic Info */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <Input placeholder="Your display name" {...register('displayName', { required: 'Display name is required' })} />
                    {errors.displayName && <p className="mt-1 text-sm text-red-600">{errors.displayName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        linknest.com/u/
                      </span>
                      <Input
                        {...register('username', {
                          required: 'Username is required',
                          pattern: { value: /^[a-z0-9_-]+$/i, message: 'Only letters, numbers, underscores and hyphens allowed' },
                          minLength: { value: 3, message: 'Minimum 3 characters' },
                        })}
                        className="rounded-l-none"
                        placeholder="yourname"
                      />
                    </div>
                    {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <Textarea
                      rows={3}
                      placeholder="Tell people a bit about yourself..."
                      {...register('bio', {
                        required: 'Bio is required',
                        maxLength: { value: 160, message: 'Max 160 characters' },
                      })}
                    />
                    {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
                  </div>
                </div>

                {/* Layout */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-2">
                  <h2 className="text-lg font-semibold text-gray-900">Profile Layout</h2>
                  <select
                    id="layout"
                    className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    {...register('layout')}
                  >
                    <option value="grid">Grid Layout</option>
                    <option value="list">List Layout</option>
                  </select>
                </div>

                {/* Social Links */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Social Links</h2>
                  <SocialLinkManager
                    links={links}
                    onUpdate={handleUpdateLinks}
                    isLoading={false}
                  />
                </div>
              </>
            )}

            {activeSection === 'account' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Management</h2>
                
                <div className="space-y-6">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <h3 className="text-md font-medium text-red-800 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            {activeSection === 'profile' && (
              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DeleteAccount onClose={() => setShowDeleteDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}