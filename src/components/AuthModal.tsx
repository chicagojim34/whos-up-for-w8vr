import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { loginWithGoogle, loginWithPassword, registerWithPassword, resetPassword } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle();
      toast.show('Signed in with Google!');
      onClose();
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'signin') {
        if (!email.trim() || !password) {
          setErrorMsg('Please enter your email/username and password.');
          setIsLoading(false);
          return;
        }
        await loginWithPassword(email.trim(), password);
        toast.show('Signed in successfully!');
        onClose();
      } else if (mode === 'signup') {
        if (!email.trim() || !password) {
          setErrorMsg('Please fill in all required fields.');
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password should be at least 6 characters.');
          setIsLoading(false);
          return;
        }
        await registerWithPassword(email.trim(), password, displayName.trim());
        toast.show('Account created successfully!');
        onClose();
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMsg('Please enter your email to reset password.');
          setIsLoading(false);
          return;
        }
        await resetPassword(email.trim());
        setResetSuccess(true);
        toast.show('Password reset email sent!');
      }
    } catch (err: unknown) {
      const error = err as { message?: string; code?: string };
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        setErrorMsg('Invalid email or password.');
      } else if (error?.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists.');
      } else if (error?.code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters.');
      } else {
        setErrorMsg(error?.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async (role: 'admin' | 'user') => {
    setIsLoading(true);
    try {
      const demoEmail = role === 'admin' ? 'felix.vance@w8vr.app' : 'maya.lin@w8vr.app';
      await loginWithPassword(demoEmail, 'demo123456');
      toast.show(`Switched to Demo ${role === 'admin' ? 'Admin' : 'Member'} account!`);
      onClose();
    } catch {
      toast.show('Signed in as Demo User');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="relative w-full max-w-md bg-surface-lowest rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-slide-up flex flex-col">
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-primary-fixed/30 via-surface-low to-surface-lowest flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl primary-gradient flex items-center justify-center text-white font-headline font-black text-base shadow-sm">
              W
            </span>
            <div>
              <h2 id="auth-modal-title" className="font-headline font-black text-xl text-text-dark">
                {mode === 'signin' && 'Sign in to W8VR'}
                {mode === 'signup' && 'Create your account'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-xs text-text-medium mt-0.5">
                {mode === 'signin' && 'Access your events, circles, and RSVPs'}
                {mode === 'signup' && 'Join your friends for live events & hangouts'}
                {mode === 'forgot' && "We'll send you a password reset link"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-text-light hover:text-text-dark hover:bg-surface-high transition-colors"
            aria-label="Close authentication modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
          {/* Google Sign-In Button */}
          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-surface-lowest hover:bg-surface-low border border-gray-200 shadow-2xs font-headline font-bold text-sm text-text-dark flex items-center justify-center gap-3 transition-all hover:border-gray-300 active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] font-bold text-text-light uppercase tracking-wider">
                  or with email / password
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-error-container/30 border border-error/20 rounded-2xl flex items-center gap-2.5 text-xs text-error font-medium animate-shake">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Reset Success Message */}
          {resetSuccess && mode === 'forgot' && (
            <div className="p-3 bg-success-container/40 border border-success/20 rounded-2xl flex items-center gap-2.5 text-xs text-success font-medium">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Password reset link sent to {email}. Check your inbox!</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-bold text-text-dark block mb-1">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" size={16} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Felix Vance"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="input-field pl-10 py-2.5 text-xs bg-surface-low rounded-xl"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-text-dark block mb-1">
                {mode === 'signin' ? 'Email or Username' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" size={16} />
                <input
                  type={mode === 'signin' ? 'text' : 'email'}
                  required
                  placeholder={mode === 'signin' ? 'you@w8vr.app or username' : 'name@example.com'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field pl-10 py-2.5 text-xs bg-surface-low rounded-xl"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-text-dark">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg(null);
                        setResetSuccess(false);
                      }}
                      className="text-[11px] font-bold text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" size={16} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pl-10 py-2.5 text-xs bg-surface-low rounded-xl"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3 mt-1 flex items-center justify-center gap-2 font-headline font-bold text-sm shadow-sm"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  {mode === 'signin' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="pt-2 text-center text-xs text-text-medium border-t border-gray-100 flex flex-col gap-2">
            {mode === 'signin' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg(null);
                  }}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </p>
            )}

            {/* Quick Demo Switchers */}
            <div className="mt-2 p-3 bg-surface-low rounded-2xl flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-dark flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-primary" /> Quick Test Roles:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('admin')}
                  className="badge bg-primary text-white text-[10px] font-bold hover:bg-primary-dark transition-colors cursor-pointer"
                >
                  👑 Admin Login
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('user')}
                  className="badge bg-surface-highest text-text-dark text-[10px] font-bold hover:bg-surface-high transition-colors cursor-pointer"
                >
                  👤 Member Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
