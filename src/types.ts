/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  bio: string;
  whatsapp_no: string;
  portfolio_links: {
    linkedin?: string;
    github?: string;
    instagram?: string;
    other?: string;
  };
  image_url?: string;
  is_verified: boolean;
  created_at?: string;
}

export interface Course {
  id: string;
  mentor_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  type: 'online' | 'offline';
  location_city: string;
  image_url: string;
  is_active: boolean;
  mentor?: Profile;
  rating?: number;
  review_count?: number;
}

export interface Review {
  id: string;
  course_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}
