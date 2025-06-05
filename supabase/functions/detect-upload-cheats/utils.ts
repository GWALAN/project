// File size limits per content type
export const FILE_SIZE_LIMITS = {
  VIDEO: 2 * 1024 * 1024 * 1024, // 2GB
  AUDIO: 500 * 1024 * 1024, // 500MB
  PDF: 100 * 1024 * 1024, // 100MB
  IMAGE: 10 * 1024 * 1024, // 10MB
  TEXT: 5 * 1024 * 1024 // 5MB
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
  PDF: {
    types: ['application/pdf'],
    extensions: ['.pdf']
  },
  IMAGE: {
    types: ['image/jpeg', 'image/png'],
    extensions: ['.jpg', '.jpeg', '.png']
  },
  TEXT: {
    types: ['text/plain'],
    extensions: ['.txt']
  }
} as const;

// Blocked file extensions (security risk files)
export const BLOCKED_EXTENSIONS = [
  '.exe', '.dll', '.so', '.dylib', // Executables
  '.zip', '.7z', '.rar', '.tar', '.gz', // Archives that could hide malware
  '.bat', '.sh', '.cmd', '.ps1', '.vbs', // Scripts
  '.msi', '.app', '.dmg', // Installers
  '.php', '.asp', '.jsp', '.cgi', // Server scripts
  '.sys', '.bin', '.dat' // System files
];

// Banned keywords for content filtering
export const BANNED_KEYWORDS = [
  // Illegal content
  'cp', 'childp', 'jailbait', 'loli', 'underage',
  // Adult content
  'porn', 'xxx', 'adult', 'nsfw', 'onlyfans',
  // Violence
  'gore', 'death', 'murder', 'torture',
  // Hate speech
  'nazi', 'jihad', 'terrorist',
  // Drugs
  'cocaine', 'heroin', 'meth',
  // Fraud
  'hack', 'crack', 'stolen', 'leak'
];

// Detect content type from file type
export function detectType(fileType: string, fileName: string): string {
  const ext = `.${fileName.split('.').pop()?.toLowerCase()}`;
  const type = fileType.toLowerCase();

  // Check video types
  if (ALLOWED_FILE_TYPES.VIDEO.types.map(t => t.toLowerCase()).includes(type)) {
    return 'video';
  }
  
  // Check audio types
  if (ALLOWED_FILE_TYPES.AUDIO.types.map(t => t.toLowerCase()).includes(type)) {
    return 'audio';
  }
  
  // Check PDF type
  if (ALLOWED_FILE_TYPES.PDF.types.map(t => t.toLowerCase()).includes(type)) {
    return 'pdf';
  }
  
  // Check image types
  if (ALLOWED_FILE_TYPES.IMAGE.types.map(t => t.toLowerCase()).includes(type)) {
    return 'image';
  }
  
  // Check text types
  if (ALLOWED_FILE_TYPES.TEXT.types.map(t => t.toLowerCase()).includes(type)) {
    return 'text';
  }
  
  return 'other';
}

// Content safety validation
export function validateContent(text: string): string | null {
  // Convert to lowercase for case-insensitive matching
  const normalizedText = text.toLowerCase();

  // Check for banned keywords
  for (const keyword of BANNED_KEYWORDS) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      return 'Content contains inappropriate or illegal material';
    }
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\b(buy|sell|trade)\s+(fake|counterfeit|stolen)\b/i,
    /\b(hack|crack|leak|dump)\s+(account|password|data)\b/i,
    /\b(illegal|unlicensed)\s+(stream|download|copy)\b/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(normalizedText)) {
      return 'Content appears to promote illegal activities';
    }
  }

  return null;
}

// Validate file
export function validateFile(fileName: string, fileType: string, contentType: string): string | null {
  // Convert content type to uppercase
  const normalizedType = contentType.toUpperCase() as keyof typeof ALLOWED_FILE_TYPES;

  // Check if content type is supported
  if (!ALLOWED_FILE_TYPES[normalizedType]) {
    return 'Unsupported content type';
  }

  // Check file extension
  const ext = `.${fileName.split('.').pop()?.toLowerCase()}`;
  
  // Block dangerous file extensions
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return `File type not allowed: ${ext}`;
  }

  // Check for suspicious file names
  const suspiciousNameCheck = validateContent(fileName);
  if (suspiciousNameCheck) {
    return 'File name contains inappropriate content';
  }

  // Detect actual content type from file
  const detectedType = detectType(fileType, fileName).toLowerCase();
  const claimedType = contentType.toLowerCase();

  // Verify file type matches claimed type
  if (detectedType !== claimedType && detectedType !== 'other') {
    return `File type mismatch: claimed ${claimedType} but detected ${detectedType}`;
  }

  // Check if file type is allowed for content type
  const allowedTypes = ALLOWED_FILE_TYPES[normalizedType].types.map(t => t.toLowerCase());
  if (!allowedTypes.includes(fileType.toLowerCase())) {
    const extensions = ALLOWED_FILE_TYPES[normalizedType].extensions.join(', ');
    return `Invalid file type. Allowed types: ${extensions}`;
  }

  return null;
}

// Additional security checks for file uploads
export function performSecurityChecks(fileName: string, fileType: string): string | null {
  // Check for double extensions (e.g., file.jpg.exe)
  if (fileName.split('.').length > 2) {
    return 'Multiple file extensions not allowed';
  }

  // Check for null bytes (potential security exploit)
  if (fileName.includes('\0') || fileType.includes('\0')) {
    return 'Invalid characters in file name or type';
  }

  // Check for path traversal attempts
  if (fileName.includes('../') || fileName.includes('..\\')) {
    return 'Invalid file name';
  }

  // Check for special characters that could be used for injection
  const specialChars = /[<>:"|?*]/;
  if (specialChars.test(fileName)) {
    return 'File name contains invalid characters';
  }

  return null;
}