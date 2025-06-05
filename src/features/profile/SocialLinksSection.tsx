import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SocialLinkForm } from '@/components/ui/social-link-form';
import * as Icons from 'lucide-react';

export interface SocialLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  buttonStyle: string;
}

interface Props {
  links: SocialLink[];
  onSave: (values: Partial<SocialLink>) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export function SocialLinksSection({ links, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openSheet = (link: SocialLink | null) => {
    setEditing(link);
    setSheetOpen(true);
  };

  const getIcon = (iconName: string) => {
    const Icon = Icons[iconName as keyof typeof Icons] || Icons.Link;
    return <Icon className="h-4 w-4 shrink-0" aria-hidden />;
  };

  return (
    <section className="relative space-y-4">
      {/* Collapsible list */}
      <Card className="overflow-y-auto max-h-[60vh]">
        <ScrollArea className="h-full">
          <ul>
            {links.map((link) => (
              <li
                key={link.id}
                onClick={() => openSheet(link)}
                className="flex items-center gap-3 h-12 px-4 cursor-pointer border-b last:border-none hover:bg-muted/50"
              >
                {getIcon(link.icon)}
                <span className="truncate leading-none text-sm font-medium">
                  {link.title}
                </span>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </Card>

      {/* Sticky footer */}
      <div className="sticky bottom-0 w-full bg-background pt-2 pb-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => openSheet(null)}
        >
          <Plus className="mr-2 h-4 w-4" /> Add social link
        </Button>
      </div>

      {/* Side‑sheet for add / edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[24rem] sm:w-[28rem] p-6">
          <SocialLinkForm
            initialValues={editing ?? undefined}
            onSubmit={async (values) => {
              await onSave(editing ? { ...values, id: editing.id } : values);
              setSheetOpen(false);
            }}
            onDelete={editing ? async () => {
              await onDelete(editing.id);
              setSheetOpen(false);
            } : undefined}
          />
        </SheetContent>
      </Sheet>
    </section>
  );
}