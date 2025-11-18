// Favorites management utility

const FAVORITES_STORAGE_KEY = 'randevudent_favorites';

export interface Favorite {
  id: string;
  userId: string;
  clinicId?: string;
  doctorId?: string;
  type: 'clinic' | 'doctor';
  addedAt: string;
}

// Get all favorites for a user
export function getUserFavorites(userId: string): Favorite[] {
  if (typeof window === 'undefined') return [];
  const favoritesJson = localStorage.getItem(FAVORITES_STORAGE_KEY);
  const allFavorites: Favorite[] = favoritesJson ? JSON.parse(favoritesJson) : [];
  return allFavorites.filter(f => f.userId === userId);
}

// Check if clinic/doctor is favorited
export function isFavorited(userId: string, clinicId?: string, doctorId?: string): boolean {
  const favorites = getUserFavorites(userId);
  if (clinicId) {
    return favorites.some(f => f.clinicId === clinicId && f.type === 'clinic');
  }
  if (doctorId) {
    return favorites.some(f => f.doctorId === doctorId && f.type === 'doctor');
  }
  return false;
}

// Add to favorites
export function addToFavorites(userId: string, clinicId?: string, doctorId?: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Browser only' };
  
  const favoritesJson = localStorage.getItem(FAVORITES_STORAGE_KEY);
  const allFavorites: Favorite[] = favoritesJson ? JSON.parse(favoritesJson) : [];
  
  // Check if already favorited
  const existing = allFavorites.find(
    f => f.userId === userId && 
    ((clinicId && f.clinicId === clinicId) || (doctorId && f.doctorId === doctorId))
  );
  
  if (existing) {
    return { success: false, error: 'Zaten favorilerinizde' };
  }
  
  const newFavorite: Favorite = {
    id: Date.now().toString() + Math.random().toString(36).substring(7),
    userId,
    clinicId,
    doctorId,
    type: clinicId ? 'clinic' : 'doctor',
    addedAt: new Date().toISOString(),
  };
  
  allFavorites.push(newFavorite);
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(allFavorites));
  
  return { success: true };
}

// Remove from favorites
export function removeFromFavorites(userId: string, clinicId?: string, doctorId?: string): { success: boolean; error?: string } {
  if (typeof window === 'undefined') return { success: false, error: 'Browser only' };
  
  const favoritesJson = localStorage.getItem(FAVORITES_STORAGE_KEY);
  const allFavorites: Favorite[] = favoritesJson ? JSON.parse(favoritesJson) : [];
  
  const filtered = allFavorites.filter(
    f => !(f.userId === userId && 
    ((clinicId && f.clinicId === clinicId) || (doctorId && f.doctorId === doctorId)))
  );
  
  if (filtered.length === allFavorites.length) {
    return { success: false, error: 'Favorilerde bulunamadı' };
  }
  
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(filtered));
  
  return { success: true };
}

// Toggle favorite
export function toggleFavorite(userId: string, clinicId?: string, doctorId?: string): { success: boolean; isFavorited: boolean; error?: string } {
  const favorited = isFavorited(userId, clinicId, doctorId);
  
  if (favorited) {
    const result = removeFromFavorites(userId, clinicId, doctorId);
    return { ...result, isFavorited: false };
  } else {
    const result = addToFavorites(userId, clinicId, doctorId);
    return { ...result, isFavorited: true };
  }
}

