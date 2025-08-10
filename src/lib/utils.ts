import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Privacy utility functions
export function filterPrivateProfile(profile: any, isOwner: boolean = false) {
  if (!profile) return null;
  
  // If user is the owner or profile is public, return full profile
  if (isOwner || profile.is_profile_public) {
    return profile;
  }
  
  // For private profiles, only return basic information
  return {
    id: profile.id,
    username: profile.username,
    location: profile.location,
    is_profile_public: false, // Always indicate it's private
    avatar_url: null, // Hide avatar for privacy
    // Hide all other sensitive information
    full_name: null,
    bio: null,
    website: null,
    skills: null,
    resume_url: null,
    job_title: null,
    company: null,
    github_username: null,
    leetcode_username: null,
    experience_years: null,
    created_at: profile.created_at,
    updated_at: profile.updated_at
  };
}

export function getProfileDisplayName(profile: any) {
  if (!profile) return 'Unknown User';
  
  if (!profile.is_profile_public) {
    return profile.username || 'Private User';
  }
  
  return profile.full_name || profile.username || 'Unknown User';
}

export function isProfileAccessible(profile: any, currentUserId?: string) {
  if (!profile) return false;
  
  // Owner can always access their profile
  if (currentUserId && profile.id === currentUserId) {
    return true;
  }
  
  // Public profiles are accessible to everyone
  return profile.is_profile_public === true;
}

export function formatPrivacyStatus(isPublic: boolean) {
  return isPublic ? 'Public Profile' : 'Private Profile';
}
