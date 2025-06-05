import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Button } from './button';
import { SocialLinkForm } from './social-link-form';
import { SocialLinkButton } from './social-link-button';

interface SocialLink {
  title: string;
  url: string;
  icon: string;
  buttonStyle: string;
}

interface SocialLinkManagerProps {
  links: SocialLink[];
  onUpdate: (links: SocialLink[]) => void;
  isLoading?: boolean;
}

export function SocialLinkManager({ links = [], onUpdate, isLoading = false }: SocialLinkManagerProps) {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddLink = async (data: SocialLink) => {
    setIsSubmitting(true);
    try {
      const newLinks = [...links, data];
      await onUpdate(newLinks);
      setIsAddingLink(false);
    } catch (error) {
      console.error('Error adding link:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLink = async (data: SocialLink) => {
    if (editingIndex === null) return;

    setIsSubmitting(true);
    try {
      const newLinks = [...links];
      newLinks[editingIndex] = data;
      await onUpdate(newLinks);
      setEditingIndex(null);
    } catch (error) {
      console.error('Error updating link:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveLink = async (index: number) => {
    setIsSubmitting(true);
    try {
      const newLinks = links.filter((_, i) => i !== index);
      await onUpdate(newLinks);
    } catch (error) {
      console.error('Error removing link:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing Links */}
      <div className="grid gap-3">
        {links.map((link, index) => (
          <div
            key={index}
            className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:border-primary/20 hover:shadow-md transition-all duration-200"
          >
            {editingIndex === index ? (
              <SocialLinkForm
                initialValues={link}
                onSubmit={handleEditLink}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <SocialLinkButton {...link} />
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingIndex(index)}
                    disabled={isSubmitting}
                    className="hover:bg-gray-100"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveLink(index)}
                    disabled={isSubmitting}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add New Link */}
      {isAddingLink ? (
        <div className="bg-white rounded-lg p-6 shadow-md border border-primary/20">
          <SocialLinkForm
            onSubmit={handleAddLink}
            onCancel={() => setIsAddingLink(false)}
          />
        </div>
      ) : (
        <Button
          variant="default"
          size="lg"
          onClick={() => setIsAddingLink(true)}
          disabled={isSubmitting}
          className="w-full shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-r from-primary to-primary/90"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Social Link
        </Button>
      )}
    </div>
  );
}