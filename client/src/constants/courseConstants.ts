export const CourseLevel = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
} as const;

export const CourseCategory = {
  WEB_DEVELOPMENT: 'Web Development',
  MOBILE_DEVELOPMENT: 'Mobile Development',
  DATA_SCIENCE: 'Data Science',
  MACHINE_LEARNING: 'Machine Learning',
  ARTIFICIAL_INTELLIGENCE: 'Artificial Intelligence',
  CYBERSECURITY: 'Cybersecurity',
  CLOUD_COMPUTING: 'Cloud Computing',
  DEVOPS: 'DevOps',
  DATABASE: 'Database',
  PROGRAMMING_LANGUAGES: 'Programming Languages',
  GAME_DEVELOPMENT: 'Game Development',
  UI_UX_DESIGN: 'UI/UX Design',
  BUSINESS: 'Business',
  MARKETING: 'Marketing',
  FINANCE: 'Finance',
  OTHER: 'Other'
} as const;

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published'
}

export enum ContentType {
  VIDEO = 'video',
  PDF = 'pdf',
  TEXT = 'text'
}

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
];

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/wmv'];
export const ALLOWED_PDF_TYPE = 'application/pdf';

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const UPLOAD_PATHS = {
  THUMBNAILS: '/uploads/thumbnails',
  VIDEOS: '/uploads/content/videos',
  PDFS: '/uploads/content/pdfs'
};

export const DEFAULT_THUMBNAIL_URL = 'http://localhost:5000/uploads/thumbnails/one.png'; 