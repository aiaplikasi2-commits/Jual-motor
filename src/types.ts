export interface MotorAd {
  id: string;
  createdAt: number;
  updatedAt: number;
  photos: string[]; // Base64 data URLs
  description: string;
}

export type ViewMode = 'list' | 'create' | 'edit' | 'detail';
