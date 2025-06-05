import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MessageThread } from './MessageThread';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MessageButtonProps {
  orderId: string;
  buyer: { email: string };
  creator: { id: string; displayName: string };
  currentUserId: string;
}

export function MessageButton({ orderId, buyer, creator, currentUserId }: MessageButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <MessageCircle className="h-4 w-4 mr-2" />
        Message
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentUserId === creator.id
                ? `Message ${buyer.email}`
                : `Message ${creator.displayName}`}
            </DialogTitle>
          </DialogHeader>
          <MessageThread
            orderId={orderId}
            buyer={buyer}
            creator={creator}
            currentUserId={currentUserId}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}