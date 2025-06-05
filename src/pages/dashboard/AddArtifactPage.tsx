import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUserStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormValues {
  label: string;
  synopsis: string;
  category: "video" | "audio" | "article";
  price: number;
  blurSnapshot: boolean;
  isMature: boolean;
}

export function AddArtifactPage() {
  const supabase = useSupabaseClient();
  const navigate = useNavigate();
  const { user } = useUserStore();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      category: "video",
      blurSnapshot: false,
      isMature: false,
    }
  });

  const [vaultFile, setVaultFile] = useState<File | null>(null);
  const [snapshotFile, setSnapshotFile] = useState<File | null>(null);

  /**
   * Generate a secure file path with user ID and sanitized filename
   */
  const makePath = (uid: string, file: File) => {
    const sanitizedName = file.name.replace(/[^A-Za-z0-9.\-_]/g, "");
    return `${uid}/${Date.now()}_${sanitizedName}`;
  };

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to add an artifact.",
        variant: "destructive",
      });
      return;
    }

    if (!vaultFile || !snapshotFile) {
      toast({
        title: "Missing files",
        description: "Both snapshot and vault files are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Upload snapshot image
      const snapshotPath = makePath(user.id, snapshotFile);
      
      const { error: snapErr } = await supabase.storage
        .from("artifact-snapshots")
        .upload(snapshotPath, snapshotFile, {
          contentType: snapshotFile.type,
          upsert: false,
        });
      
      if (snapErr) throw snapErr;
      
      const { data: snapData } = supabase.storage
        .from("artifact-snapshots")
        .getPublicUrl(snapshotPath);
      
      const snapshotUrl = snapData.publicUrl;

      // 2. Upload vault file
      const vaultPath = makePath(user.id, vaultFile);
      
      const { error: vaultErr } = await supabase.storage
        .from("artifact-vault")
        .upload(vaultPath, vaultFile, {
          contentType: vaultFile.type,
          upsert: false,
        });
      
      if (vaultErr) throw vaultErr;
      
      // 3. Insert artifact record
      const { error: dbErr } = await supabase
        .from("artifacts")
        .insert({
          owner_id: user.id,
          label: data.label.trim(),
          synopsis: data.synopsis.trim(),
          price_cents: Math.round(data.price * 100), // Convert to cents
          category: data.category,
          vault_path: vaultPath,
          snapshot_url: snapshotUrl,
          blur_snapshot: data.blurSnapshot,
          is_mature: data.isMature
        });

      if (dbErr) throw dbErr;

      toast({
        title: "Artifact uploaded successfully",
        description: "Your artifact has been added to your profile.",
      });
      
      navigate("/dashboard/products");
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast({
        title: "Upload failed",
        description: err.message || "An error occurred during upload.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Artifact</h1>
          <p className="text-gray-600">
            Create a new digital artifact to sell on your profile
          </p>
        </div>
        
        <div className="content-section p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">
                Artifact Title *
              </label>
              <Input
                id="label"
                {...register("label", { 
                  required: "Title is required",
                  maxLength: {
                    value: 100,
                    message: "Title cannot exceed 100 characters",
                  },
                })}
              />
              {errors.label && (
                <p className="mt-1 text-sm text-red-600">{errors.label.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="synopsis" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <Textarea
                id="synopsis"
                rows={4}
                {...register("synopsis", { 
                  required: "Description is required",
                })}
              />
              {errors.synopsis && (
                <p className="mt-1 text-sm text-red-600">{errors.synopsis.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (USD) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0.50"
                  className="pl-7"
                  {...register("price", { 
                    required: "Price is required",
                    min: {
                      value: 0.5,
                      message: "Price must be at least $0.50",
                    },
                  })}
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Content Type *
              </label>
              <select
                id="category"
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                {...register("category", { required: "Content type is required" })}
              >
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="article">Article</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Snapshot Image (Thumbnail) *
                </label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSnapshotFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {snapshotFile && (
                  <p className="mt-1 text-xs text-gray-500">
                    Selected: {snapshotFile.name} ({(snapshotFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vault File (Content) *
                </label>
                <Input
                  type="file"
                  accept="video/*,audio/*,application/pdf"
                  onChange={(e) => setVaultFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {vaultFile && (
                  <p className="mt-1 text-xs text-gray-500">
                    Selected: {vaultFile.name} ({(vaultFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="blurSnapshot"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...register("blurSnapshot")}
                />
                <label htmlFor="blurSnapshot" className="ml-2 block text-sm text-gray-700">
                  Blur preview until purchase
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="isMature"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...register("isMature")}
                />
                <label htmlFor="isMature" className="ml-2 block text-sm text-gray-700">
                  This artifact contains mature content (18+)
                </label>
              </div>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="mr-3"
                onClick={() => navigate("/dashboard/products")}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !snapshotFile || !vaultFile}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Artifact
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddArtifactPage;