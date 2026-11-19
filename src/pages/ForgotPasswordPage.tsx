import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { SmartStockLogo } from '../components/SmartStockLogo';
import { formatAuthError, useAuth } from '../contexts/AuthContext';
import { forgotPasswordSchema } from '../lib/validation';

type ForgotValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotValues) => {
    setAuthError(null);
    try {
      await sendPasswordReset(values.email);
      setSentTo(values.email);
    } catch (err) {
      setAuthError(formatAuthError(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Sign In
        </Link>
        <div className="mt-6">
          <SmartStockLogo />
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900">
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Enter your registered email and we will send you a Firebase password reset link.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          {sentTo ? (
            <div className="text-center py-2">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold text-slate-900">
                Password reset email sent
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Check <span className="font-medium text-slate-900">{sentTo}</span> for a link to
                choose a new password.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Return to Sign In
              </Link>
            </div>
          ) : (
            <>
              {authError && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800"
                >
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    placeholder="owner@yourshop.in"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                >
                  {isSubmitting ? 'Sending reset link...' : 'Send Password Reset Email'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
