export type ReportStatus = 'Pending' | 'In Progress' | 'Resolved';

export type ReportCategory = 
  | 'Roads' 
  | 'Electricity' 
  | 'Health' 
  | 'Education' 
  | 'Social' 
  | 'Drainage'
  | 'Agriculture'
  | 'Security'
  | 'Other';

export type ServiceCategory = 
  | 'Education' 
  | 'Health' 
  | 'Medical' 
  | 'Employment' 
  | 'Agriculture' 
  | 'CitizenSeva' 
  | 'SocialWelfare'
  | 'Emergency';

export interface ServiceContent {
  id: string;
  category: ServiceCategory;
  title: string;
  description: string;
  details?: string;
  link?: string;
  contactPhone?: string;
  location?: string;
  icon?: string;
  isNew?: boolean;
}

export interface CitizenReport {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  location: string;
  ward?: string;
  isAnonymous: boolean;
  name?: string;
  phone?: string;
  nid?: string;
  imageUrl?: string;
  status: ReportStatus;
  createdAt: string;
  adminNotes?: string;
}

export interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  badge?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface CandidateProfile {
  name: string;
  designation: string;
  union: string;
  upazila: string;
  district: string;
  slogan: string;
  image: string;
  bannerImage?: string;
  bio: string;
  vision: string;
  manifestoPoints: {
    title: string;
    details: string;
    icon: string;
  }[];
  phone: string;
  email: string;
  officeAddress: string;
}

// Backward-compatible alias for existing code
export type MPPortfolio = CandidateProfile;

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  category?: string;
  isPinned?: boolean;
}

export interface EmergencyContact {
  id: string;
  title: string;
  category: 'Ambulance' | 'Hospital' | 'Police' | 'Fire' | 'Blood' | 'UP' | 'Electricity';
  phone: string;
  availableHours: string;
  location?: string;
}
