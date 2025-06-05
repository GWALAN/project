import { create } from 'zustand';
import { FileText, Video, Music, Image, MessageCircle, CalendarClock, Users, BookOpen } from 'lucide-react';

export type ContentType = 
  | 'video'
  | 'audio'
  | 'digital_product'
  | 'image'
  | 'blog'
  | 'chat'
  | 'booking'
  | 'membership';

export type PricingMode = 'one_time' | 'subscription';

export interface SubscriptionTier {
  id: string;
  userid: string;
  name: string;
  description: string;
  price: number;
  billing_interval: 'monthly' | 'yearly';
  createdat: string;
}

export interface Product {
  id: string;
  creatorid: string;
  title: string;
  description: string;
  price: number;
  contenttype: ContentType;
  fileurl: string | null;
  previewimageurl: string;
  hidden: boolean;
  createdat: string;
  pricing_mode: PricingMode;
  subscription_tier_id: string | null;
}

export interface Order {
  id: string;
  productid: string;
  buyeremail: string;
  status: 'pending' | 'paid' | 'failed';
  payoutstatus: 'pending' | 'completed' | 'failed';
  paypalorderid: string | null;
  platformfee: number;
  creatorpayout: number;
  createdat: string;
}

export interface Subscription {
  id: string;
  buyerid: string;
  tierid: string;
  status: 'active' | 'cancelled' | 'expired';
  startedat: string;
  endsat: string | null;
  paypalsubscriptionid: string;
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  video: 'Video',
  audio: 'Audio',
  digital_product: 'Digital Product (PDF / ZIP)',
  image: 'Image / Image Pack',
  blog: 'Blog Article',
  chat: 'Private Chat',
  booking: 'Bookable Session',
  membership: 'Membership Tier'
} as const;

export const CONTENT_TYPE_ICONS = {
  video: Video,
  audio: Music,
  digital_product: FileText,
  image: Image,
  blog: BookOpen,
  chat: MessageCircle,
  booking: CalendarClock,
  membership: Users
} as const;

export interface ThemeConfig {
  primary: string;
  background: string;
  text: string;
  buttonStyle: 'rounded' | 'pill' | 'square' | 'floating' | 'glass' | 'neon';
  buttonVariant: 'solid' | 'outline' | 'ghost';
}

export const DEFAULT_THEME: ThemeConfig = {
  primary: '#7C3AED',
  background: '#FFFFFF',
  text: '#18181B',
  buttonStyle: 'rounded',
  buttonVariant: 'solid'
};