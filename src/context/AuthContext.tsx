import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle as fbSignInWithGoogle,
  signInWithPassword as fbSignInWithPassword,
  registerWithPassword as fbRegisterWithPassword,
  sendPasswordReset as fbSendPasswordReset,
  logoutFirebase,
  type User,
} from '../services/firebase';
import type { UserProfile, UserRole, RoleAssignment } from '../types';
import { INITIAL_USER, INITIAL_USER_ROLES } from '../lib/seed';
import { loadSlice, saveSlice } from '../lib/storage';
import { AuthContext } from './auth-context';

const SLICE_USER_ROLES = 'user_roles';
const SLICE_ROLE_ASSIGNMENTS = 'role_assignments';
const SLICE_CURRENT_USER = 'auth_profile';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Persistent role state
  const [rolesMap, setRolesMap] = useState<Record<string, UserRole>>(() =>
    loadSlice<Record<string, UserRole>>(SLICE_USER_ROLES, INITIAL_USER_ROLES)
  );

  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>(() =>
    loadSlice<RoleAssignment[]>(SLICE_ROLE_ASSIGNMENTS, [
      {
        userId: 'u0',
        userName: 'Aneka Rao',
        role: 'admin',
        assignedBy: 'System',
        assignedAt: Date.now() - 7 * 86400000,
      },
      {
        userId: 'u1',
        userName: 'Jocelyn Park',
        role: 'moderator',
        assignedBy: 'Felix Vance',
        assignedAt: Date.now() - 2 * 86400000,
      },
    ])
  );

  // Persistent active user profile
  const [user, setUser] = useState<UserProfile>(() =>
    loadSlice<UserProfile>(SLICE_CURRENT_USER, INITIAL_USER)
  );

  // Sync with Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentFbUser => {
      setFirebaseUser(currentFbUser);
      if (currentFbUser) {
        setUser(prev => {
          const userRole = rolesMap[currentFbUser.uid] || prev.role || 'user';
          const updated: UserProfile = {
            ...prev,
            id: currentFbUser.uid,
            name: currentFbUser.displayName || prev.name || currentFbUser.email?.split('@')[0] || 'User',
            email: currentFbUser.email || prev.email,
            photoURL: currentFbUser.photoURL || prev.photoURL,
            role: userRole,
            authProvider: currentFbUser.providerData[0]?.providerId.includes('google')
              ? 'google'
              : 'password',
          };
          saveSlice(SLICE_CURRENT_USER, updated);
          return updated;
        });
      }
    });

    return () => unsubscribe();
  }, [rolesMap]);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const loginWithGoogle = useCallback(async () => {
    const cred = await fbSignInWithGoogle();
    if (cred.user) {
      const u = cred.user;
      const role = rolesMap[u.uid] || 'admin';
      const profile: UserProfile = {
        ...user,
        id: u.uid,
        name: u.displayName || 'Google User',
        email: u.email || 'user@gmail.com',
        photoURL: u.photoURL || undefined,
        role,
        authProvider: 'google',
      };
      setUser(profile);
      saveSlice(SLICE_CURRENT_USER, profile);
      closeAuthModal();
    }
  }, [user, rolesMap, closeAuthModal]);

  const loginWithPassword = useCallback(
    async (email: string, pass: string) => {
      const cred = await fbSignInWithPassword(email, pass);
      if (cred.user) {
        const u = cred.user;
        const role = rolesMap[u.uid] || user.role || 'admin';
        const profile: UserProfile = {
          ...user,
          id: u.uid,
          name: u.displayName || email.split('@')[0],
          email: u.email || email,
          photoURL: undefined,
          role,
          authProvider: 'password',
        };
        setUser(profile);
        saveSlice(SLICE_CURRENT_USER, profile);
        closeAuthModal();
      }
    },
    [user, rolesMap, closeAuthModal]
  );

  const registerWithPassword = useCallback(
    async (email: string, pass: string, displayName: string) => {
      const cred = await fbRegisterWithPassword(email, pass, displayName);
      if (cred.user) {
        const u = cred.user;
        const profile: UserProfile = {
          ...user,
          id: u.uid,
          name: displayName || email.split('@')[0],
          email: u.email || email,
          photoURL: undefined,
          role: 'user',
          authProvider: 'password',
        };
        setUser(profile);
        saveSlice(SLICE_CURRENT_USER, profile);
        closeAuthModal();
      }
    },
    [user, closeAuthModal]
  );

  const resetPassword = useCallback(async (email: string) => {
    await fbSendPasswordReset(email);
  }, []);

  const logout = useCallback(async () => {
    await logoutFirebase();
    setFirebaseUser(null);
    const guestUser: UserProfile = {
      ...INITIAL_USER,
      authProvider: 'demo',
    };
    setUser(guestUser);
    saveSlice(SLICE_CURRENT_USER, guestUser);
  }, []);

  const assignRole = useCallback(
    async (targetUserId: string, targetUserName: string, role: UserRole) => {
      setRolesMap(prev => {
        const next = { ...prev, [targetUserId]: role };
        saveSlice(SLICE_USER_ROLES, next);
        return next;
      });

      setRoleAssignments(prev => {
        const filtered = prev.filter(a => a.userId !== targetUserId);
        const record: RoleAssignment = {
          userId: targetUserId,
          userName: targetUserName,
          role,
          assignedBy: user.name,
          assignedAt: Date.now(),
        };
        const next = [record, ...filtered];
        saveSlice(SLICE_ROLE_ASSIGNMENTS, next);
        return next;
      });

      // If updating self
      if (targetUserId === user.id) {
        setUser(prev => {
          const updated = { ...prev, role };
          saveSlice(SLICE_CURRENT_USER, updated);
          return updated;
        });
      }
    },
    [user.id, user.name]
  );

  const getRoleForUser = useCallback(
    (userId: string): UserRole => {
      return rolesMap[userId] || 'user';
    },
    [rolesMap]
  );

  const updateCurrentUserProfile = useCallback((patch: Partial<UserProfile>) => {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      saveSlice(SLICE_CURRENT_USER, updated);
      return updated;
    });
  }, []);

  const isAdmin = user.role === 'admin';
  const isModerator = user.role === 'admin' || user.role === 'moderator';
  const isAuthenticated = Boolean(firebaseUser || user.authProvider !== 'demo');

  const value = useMemo(
    () => ({
      user,
      firebaseUser,
      isAuthenticated,
      isAdmin,
      isModerator,
      rolesMap,
      roleAssignments,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      loginWithGoogle,
      loginWithPassword,
      registerWithPassword,
      resetPassword,
      logout,
      assignRole,
      getRoleForUser,
      updateCurrentUserProfile,
    }),
    [
      user,
      firebaseUser,
      isAuthenticated,
      isAdmin,
      isModerator,
      rolesMap,
      roleAssignments,
      isAuthModalOpen,
      openAuthModal,
      closeAuthModal,
      loginWithGoogle,
      loginWithPassword,
      registerWithPassword,
      resetPassword,
      logout,
      assignRole,
      getRoleForUser,
      updateCurrentUserProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
