// LocalStorage-based authentication utility

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  tcNumber?: string;
  password: string; // In production, this should be hashed
  createdAt: string;
  emailVerified?: boolean;
}

const USERS_STORAGE_KEY = 'randevudent_users';
const CURRENT_USER_KEY = 'randevudent_current_user';

// Get all users from localStorage
export function getAllUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
}

// Save all users to localStorage
function saveAllUsers(users: User[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// Register a new user
export function registerUser(userData: {
  name: string;
  email: string;
  phone: string;
  password: string;
  tcNumber?: string;
}): { success: boolean; error?: string } {
  const users = getAllUsers();
  
  // Check if email already exists
  if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
    return { success: false, error: 'Bu e-posta adresi zaten kullanılıyor' };
  }
  
  // Create new user
  const newUser: User = {
    id: Date.now().toString() + Math.random().toString(36).substring(7),
    name: userData.name,
    email: userData.email.toLowerCase(),
    phone: userData.phone,
    password: userData.password, // In production, hash this
    tcNumber: userData.tcNumber,
    createdAt: new Date().toISOString(),
    emailVerified: false,
  };
  
  users.push(newUser);
  saveAllUsers(users);
  
  return { success: true };
}

// Login user
export function loginUser(email: string, password: string): { success: boolean; user?: User; error?: string } {
  const users = getAllUsers();
  const user = users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  
  if (!user) {
    return { success: false, error: 'E-posta veya şifre hatalı' };
  }
  
  // Save current user to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
  
  return { success: true, user };
}

// Get current logged in user
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

// Logout user
export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CURRENT_USER_KEY);
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// Update user email verification status
export function verifyUserEmail(email: string): void {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (userIndex !== -1) {
    users[userIndex].emailVerified = true;
    saveAllUsers(users);
    
    // Update current user if logged in
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
      currentUser.emailVerified = true;
      if (typeof window !== 'undefined') {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      }
    }
  }
}

// Update user password (for password reset)
export function updateUserPassword(email: string, newPassword: string): { success: boolean; error?: string } {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (userIndex === -1) {
    return { success: false, error: 'Kullanıcı bulunamadı' };
  }
  
  users[userIndex].password = newPassword; // In production, hash this
  saveAllUsers(users);
  
  // Update current user if logged in
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
    currentUser.password = newPassword;
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
    }
  }
  
  return { success: true };
}

// Check if email exists
export function emailExists(email: string): boolean {
  const users = getAllUsers();
  return users.some(u => u.email.toLowerCase() === email.toLowerCase());
}

