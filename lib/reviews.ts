// Review management utility with real-time updates

import { dispatchEvent } from './events';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  clinicId?: string;
  doctorId?: string;
  rating: number;
  comment: string;
  date: string;
  createdAt: string;
}

const REVIEWS_STORAGE_KEY = 'randevudent_reviews';

// Get all reviews
export function getAllReviews(): Review[] {
  if (typeof window === 'undefined') return [];
  const reviewsJson = localStorage.getItem(REVIEWS_STORAGE_KEY);
  return reviewsJson ? JSON.parse(reviewsJson) : [];
}

// Get reviews for a clinic
export function getClinicReviews(clinicId: string): Review[] {
  const reviews = getAllReviews();
  return reviews.filter(r => r.clinicId === clinicId);
}

// Get reviews for a doctor
export function getDoctorReviews(doctorId: string): Review[] {
  const reviews = getAllReviews();
  return reviews.filter(r => r.doctorId === doctorId);
}

// Add a review
export function addReview(review: Omit<Review, 'id' | 'createdAt' | 'date'>): { success: boolean; error?: string } {
  const reviews = getAllReviews();
  
  // Check if user already reviewed this clinic/doctor
  const existingReview = reviews.find(
    r => r.userId === review.userId && 
    ((review.clinicId && r.clinicId === review.clinicId) || (review.doctorId && r.doctorId === review.doctorId))
  );
  
  if (existingReview) {
    return { success: false, error: 'Bu klinik/doktor için zaten bir yorumunuz var' };
  }
  
  const newReview: Review = {
    ...review,
    id: Date.now().toString() + Math.random().toString(36).substring(7),
    createdAt: new Date().toISOString(),
    date: new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }),
  };
  
  reviews.push(newReview);
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  
  // Dispatch event for real-time updates
  dispatchEvent('review:created', newReview);
  
  return { success: true };
}

// Update a review
export function updateReview(reviewId: string, updates: Partial<Review>): { success: boolean; error?: string } {
  const reviews = getAllReviews();
  const reviewIndex = reviews.findIndex(r => r.id === reviewId);
  
  if (reviewIndex === -1) {
    return { success: false, error: 'Yorum bulunamadı' };
  }
  
  reviews[reviewIndex] = { ...reviews[reviewIndex], ...updates };
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  
  // Dispatch event for real-time updates
  dispatchEvent('review:updated', reviews[reviewIndex]);
  
  return { success: true };
}

// Delete a review
export function deleteReview(reviewId: string): { success: boolean; error?: string } {
  const reviews = getAllReviews();
  const reviewIndex = reviews.findIndex(r => r.id === reviewId);
  
  if (reviewIndex === -1) {
    return { success: false, error: 'Yorum bulunamadı' };
  }
  
  const deletedReview = reviews[reviewIndex];
  const filteredReviews = reviews.filter(r => r.id !== reviewId);
  
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(filteredReviews));
  
  // Dispatch event for real-time updates
  dispatchEvent('review:deleted', { id: reviewId, review: deletedReview });
  
  return { success: true };
}

// Calculate average rating
export function calculateAverageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

