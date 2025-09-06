import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Profile utility functions
export function getProfileDisplayName(profile: any) {
  if (!profile) return 'Unknown User';
  
  return profile.full_name || profile.username || 'User';
}
