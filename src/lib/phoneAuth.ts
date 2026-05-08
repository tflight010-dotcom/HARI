/**
 * Phone + PIN Authentication Utility
 * Handles user registration and login with phone number and PIN
 */

import { db, auth } from './firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  query,
  collection,
  where,
  getDocs
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';

/**
 * Generate a unique email from phone number for Firebase Auth
 * Firebase requires email, so we use phone as basis for email
 */
export function generateEmailFromPhone(phone: string): string {
  // Remove any non-numeric characters and use as part of email
  const cleanPhone = phone.replace(/\D/g, '');
  return `${cleanPhone}@pesahari.local`;
}

/**
 * Register a new user with phone and PIN
 */
export async function registerWithPhonePin(
  phone: string,
  pin: string
): Promise<string> {
  try {
    // Check if phone already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phone));
    const existingUsers = await getDocs(q);
    
    if (!existingUsers.empty) {
      throw new Error('Phone number already registered');
    }

    // Create auth account using email derived from phone
    const email = generateEmailFromPhone(phone);
    const userCred = await createUserWithEmailAndPassword(auth, email, pin);
    
    // Update profile with phone number
    await updateProfile(userCred.user, {
      displayName: phone
    });

    // Store phone in Firestore for lookup
    await setDoc(doc(db, 'phoneAuth', userCred.user.uid), {
      phone: phone,
      userId: userCred.user.uid,
      createdAt: serverTimestamp()
    });

    return userCred.user.uid;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already in use')) {
        throw new Error('This phone number is already registered');
      }
    }
    throw error;
  }
}

/**
 * Login with phone and PIN
 */
export async function loginWithPhonePin(
  phone: string,
  pin: string
): Promise<string> {
  try {
    // Find user by phone
    const usersRef = collection(db, 'phoneAuth');
    const q = query(usersRef, where('phone', '==', phone));
    const results = await getDocs(q);

    if (results.empty) {
      throw new Error('Phone number not found. Please register first.');
    }

    const userId = results.docs[0].data().userId;
    const email = generateEmailFromPhone(phone);

    // Sign in with derived email and PIN
    const userCred = await signInWithEmailAndPassword(auth, email, pin);

    return userCred.user.uid;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('wrong-password')) {
        throw new Error('Incorrect PIN');
      } else if (error.message.includes('user-not-found')) {
        throw new Error('Phone number not registered');
      }
    }
    throw error;
  }
}

/**
 * Verify PIN (for simple verification without full auth state change)
 */
export async function verifyPin(pin: string): Promise<boolean> {
  try {
    // PIN must be 4 digits
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('PIN must be 4 digits');
    }
    return true;
  } catch (error) {
    throw error;
  }
}

/**
 * Check if phone is registered
 */
export async function isPhoneRegistered(phone: string): Promise<boolean> {
  try {
    const usersRef = collection(db, 'phoneAuth');
    const q = query(usersRef, where('phone', '==', phone));
    const results = await getDocs(q);
    return !results.empty;
  } catch (error) {
    console.error('Error checking phone:', error);
    return false;
  }
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
}
