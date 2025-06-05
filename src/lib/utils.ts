import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// File size limits per content type
export const FILE_SIZE_LIMITS = {
  VIDEO: 2 * 1024 * 1024 * 1024, // 2GB
  AUDIO: 500 * 1024 * 1024, // 500MB
  DIGITAL_PRODUCT: 100 * 1024 * 1024, // 100MB
  IMAGE: 10 * 1024 * 1024, // 10MB
  BLOG: 5 * 1024 * 1024 // 5MB
} as const;

// Allowed file types per content type
export const ALLOWED_FILE_TYPES = {
  VIDEO: {
    types: ['video/mp4', 'video/webm'],
    extensions: ['.mp4', '.webm']
  },
  AUDIO: {
    types: ['audio/mpeg', 'audio/mp3', 'audio/wav'],
    extensions: ['.mp3', '.wav']
  },
  DIGITAL_PRODUCT: {
    types: ['application/pdf', 'application/zip'],
    extensions: ['.pdf', '.zip']
  },
  IMAGE: {
    types: ['image/jpeg', 'image/png'],
    extensions: ['.jpg', '.jpeg', '.png']
  },
  BLOG: {
    types: ['text/plain', 'text/markdown'],
    extensions: ['.txt', '.md']
  }
} as const;

// Blocked file extensions
export const BLOCKED_EXTENSIONS = [
  '.exe', '.zip', '.7z', '.rar', '.tar', '.gz', 
  '.bat', '.sh', '.cmd', '.msi', '.vbs', '.app'
];

// Banned keywords for content filtering
export const BANNED_KEYWORDS = [
  'porn', 'nude', 'xxx', 'sex', 'onlyfans', 'erotic',
  'adult', 'nsfw', 'explicit', 'mature'
];

// Generate a secure file path for uploads
export function generateSecureFilePath(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  const sanitizedName = sanitizeFileName(fileName);
  
  // Format: userId/timestamp-sanitizedName
  return `${userId}/${timestamp}-${sanitizedName}`;
}

// Sanitize file name to remove special characters
export function sanitizeFileName(fileName: string): string {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// File validation with proper type checking
export function validateFile(file: File, contentType: string): string | null {
  // Check if content type is valid
  const allowedTypes = ALLOWED_FILE_TYPES[contentType as keyof typeof ALLOWED_FILE_TYPES];
  if (!allowedTypes) {
    return 'Unsupported content type';
  }

  // Check file size
  const sizeLimit = FILE_SIZE_LIMITS[contentType as keyof typeof FILE_SIZE_LIMITS];
  if (!sizeLimit) {
    return 'Invalid content type';
  }

  if (file.size > sizeLimit) {
    return `File size must be less than ${formatFileSize(sizeLimit)}`;
  }

  // Check file extension
  const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return `File type not allowed: ${ext}`;
  }

  // Check if file type is allowed for content type
  if (!allowedTypes.types.includes(file.type)) {
    const extensions = allowedTypes.extensions.join(', ');
    return `Invalid file type. Allowed types: ${extensions}`;
  }

  return null;
}

// Content safety validation
export function validateContent(text: string): string | null {
  const containsBannedWord = BANNED_KEYWORDS.some(word => 
    text.toLowerCase().includes(word)
  );
  
  if (containsBannedWord) {
    return 'Content contains inappropriate language or themes';
  }

  return null;
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

// Format date
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}