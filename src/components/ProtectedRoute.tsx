import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { MailCheck, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { SmartStockLogo } from './SmartStockLogo';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const {
    user,
    authReady,
    profileLoading,
    needsEmailVerification,
    resendVerificationEmail,
    refreshVerificationStatus,
    logout,
  } = useAuth();
  const { showToast } = useToast();
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  if (!authReady || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <SmartStockLogo />
        <div className="mt-6 w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-indigo-600 rounded-full animate-pulse" />
        </div>
        <p className="mt-3 text-sm text-slate-500">Loading your store workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (needsEmailVerification) {
    const handleCheck = async () => {
      setChecking(true);
      try {
        const verified = await refreshVerificationStatus();
        if (verified) {
          showToast({
            title: 'Email verified',
            description: 'Your SmartStock workspace is ready.',
            variant: 'success',
          });
        } else {
          showToast({
            title: 'Not verified yet',
            description: 'Please open the verification link sent to your inbox first.',
            variant: 'info',
          });
        }
      } catch (err) {
        showToast({
          title: 'Verification check failed',
          description: err instanceof Error ? err.message : 'Please try again.',
          variant: 'error',
        });
      } finally {
        setChecking(false);
      }
    };

    const handleResend = async () => {
      setResending(true);
      try {
        await resendVerificationEmail();
        showToast({
          title: 'Verification email sent',
          description: `Check ${user.email} (including spam/promotions folders).`,
          variant: 'success',
        });
      } catch (err) {
        showToast({
          title: 'Could not resend email',
          description: err instanceof Error ? err.message : 'Please wait a minute and retry.',
          variant: 'error',
        });
      } finally {
        setResending(false);
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl border border-slate-200 bg-white p-8">
          <SmartStockLogo />
          <div className="mt-6 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <MailCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-display text-xl font-bold text-slate-900">
            Verify your email address
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            We sent a verification link to <span className="font-medium text-slate-900">{user.email}</span>.
            Verifying your email protects your store&apos;s inventory records in Cloud Firestore.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleCheck}
              disabled={checking}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking status...' : "I've Verified — Continue"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
            >
              {resending ? 'Sending link...' : 'Resend Verification Email'}
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out or use Google Sign-In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
