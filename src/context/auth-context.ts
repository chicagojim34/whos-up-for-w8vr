import { createContext } from 'react';
import type { User } from '../services/firebase';
import type { UserProfile, UserRole, RoleAssignment } from '../types';

export interface AuthContextType {
  user: UserProfile;
  firebaseUser: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  rolesMap: Record<string, UserRole>;
  roleAssignments: RoleAssignment[];
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithPassword: (email: string, pass: string) => Promise<void>;
  registerWithPassword: (email: string, pass: string, displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  assignRole: (targetUserId: string, targetUserName: string, role: UserRole) => Promise<void>;
  getRoleForUser: (userId: string) => UserRole;
  updateCurrentUserProfile: (patch: Partial<UserProfile>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
