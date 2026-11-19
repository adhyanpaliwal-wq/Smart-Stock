import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, LogOut, Save } from 'lucide-react';
import { z } from 'zod';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { settingsSchema } from '../lib/validation';
import { updateUserAndBusinessProfile } from '../services/firestoreService';
import { SHOP_CATEGORIES } from '../types';

type SettingsValues = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const { user, userProfile, businessProfile, sendPasswordReset, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [resetSending, setResetSending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: '',
      businessName: '',
      shopCategory: SHOP_CATEGORIES[0],
      mobileNumber: '',
      address: '',
      city: '',
      state: '',
      gstin: '',
    },
  });

  useEffect(() => {
    if (userProfile || businessProfile) {
      reset({
        fullName: userProfile?.fullName || user?.displayName || '',
        businessName: businessProfile?.businessName || userProfile?.businessName || '',
        shopCategory: businessProfile?.shopCategory || SHOP_CATEGORIES[0],
        mobileNumber: userProfile?.mobileNumber || businessProfile?.phone || '',
        address: businessProfile?.address || '',
        city: businessProfile?.city || '',
        state: businessProfile?.state || '',
        gstin: businessProfile?.gstin || '',
      });
    }
  }, [user, userProfile, businessProfile, reset]);

  const onSubmit = async (values: SettingsValues) => {
    if (!user) return;
    try {
      await updateUserAndBusinessProfile(user.uid, values);
      showToast({
        title: 'Profile updated',
        description: 'Your store details and receipt header have been saved.',
        variant: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Could not save settings',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetSending(true);
    try {
      await sendPasswordReset(user.email);
      showToast({
        title: 'Password reset email sent',
        description: `Check ${user.email} for instructions to reset your password.`,
        variant: 'success',
      });
    } catch (err) {
      showToast({
        title: 'Could not send reset email',
        description: err instanceof Error ? err.message : 'Please try again later.',
        variant: 'error',
      });
    } finally {
      setResetSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppShell
      title="Settings & Profile"
      subtitle="Manage your owner account, store address, receipt details, and security"
    >
      <div className="max-w-3xl space-y-6">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-xl border border-slate-200 bg-white p-6 space-y-5"
        >
          <div className="border-b border-slate-200 pb-4">
            <h2 className="font-display text-base font-semibold text-slate-900">
              Store &amp; Owner Details
            </h2>
            <p className="text-xs text-slate-500">
              Business name, address, phone, and GSTIN appear on printed customer receipts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                {...register('fullName')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Business / Shop Name *
              </label>
              <input
                type="text"
                {...register('businessName')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
              {errors.businessName && (
                <p className="mt-1 text-xs text-red-600">{errors.businessName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                {...register('mobileNumber')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm focus:border-indigo-600 focus:outline-none"
              />
              {errors.mobileNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.mobileNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Shop Category *
              </label>
              <select
                {...register('shopCategory')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              >
                {SHOP_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency</label>
              <input
                type="text"
                disabled
                value="INR (₹ Indian Rupee)"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Business Address
              </label>
              <input
                type="text"
                {...register('address')}
                placeholder="Shop No. 12, Main Market Road"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
              <input
                type="text"
                {...register('city')}
                placeholder="Indore"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
              <input
                type="text"
                {...register('state')}
                placeholder="Madhya Pradesh"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                GSTIN (optional)
              </label>
              <input
                type="text"
                {...register('gstin')}
                placeholder="23AABCS1429B1Z5"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm uppercase focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>

        {/* Account Security & Session */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Account Security &amp; Session
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Send a Firebase password reset link or sign out of this browser.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={resetSending}
              onClick={handlePasswordReset}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <KeyRound className="h-3.5 w-3.5" />
              {resetSending ? 'Sending...' : 'Send Password Reset Email'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
