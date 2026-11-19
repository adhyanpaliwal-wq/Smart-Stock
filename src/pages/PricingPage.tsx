import React, { useMemo, useState } from 'react';
import { Check, Info } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatDate, toDate } from '../lib/formatters';

export function PricingPage() {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  const [upgradeRequested, setUpgradeRequested] = useState(false);

  const trialInfo = useMemo(() => {
    if (!userProfile?.trialEndsAt) {
      return { daysLeft: 14, endDateLabel: '14 days remaining' };
    }
    const end = toDate(userProfile.trialEndsAt);
    const diffMs = end.getTime() - Date.now();
    const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return {
      daysLeft,
      endDateLabel: formatDate(end),
    };
  }, [userProfile]);

  const isPremium = userProfile?.plan === 'premium';

  const handleRequestUpgrade = () => {
    setUpgradeRequested(true);
    showToast({
      title: 'Premium billing inquiry noted',
      description:
        'Online payment gateway integration is upcoming. Your store continues on the active free trial.',
      variant: 'info',
    });
  };

  return (
    <AppShell
      title="Subscription & Pricing"
      subtitle="Transparent monthly pricing designed for Indian retail businesses"
    >
      <div className="max-w-4xl space-y-6">
        {/* Current Subscription Status Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">Current Workspace Plan</p>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-900">
              {isPremium ? 'SmartStock Premium (₹299/month)' : 'Free Trial (14 Days)'}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              {isPremium
                ? 'Active premium subscription.'
                : `${trialInfo.daysLeft} days remaining in your free trial · Ends ${trialInfo.endDateLabel}`}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium text-slate-500">Billing Status</p>
            <p className="mt-0.5 font-mono text-sm font-semibold text-indigo-700">
              {isPremium ? 'Active' : 'Trial Active · No Card Required'}
            </p>
          </div>
        </div>

        {/* MVP Payment Notice */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3 text-xs text-slate-700">
          <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            SmartStock is currently in MVP release. All inventory, billing, alert, and analytics
            features are unlocked during your trial. Self-serve UPI / card subscription checkout
            will be enabled once Razorpay / Stripe billing is connected.
          </p>
        </div>

        {/* Plan Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-7 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">For evaluating SmartStock</p>
              <h3 className="mt-1 font-display text-xl font-bold text-slate-900">Free Trial</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
                  ₹0
                </span>
                <span className="text-xs text-slate-500">/ 14 days</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  Basic inventory tracking &amp; SKU management
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  Automated low-stock alerts
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  Basic sales tracking &amp; printable receipts
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-100 text-xs font-semibold text-slate-500">
              {!isPremium ? 'Currently Active on Your Store' : 'Included in Trial'}
            </div>
          </div>

          <div className="rounded-xl border-2 border-indigo-600 bg-white p-7 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-indigo-600">Recommended for active shops</p>
              <h3 className="mt-1 font-display text-xl font-bold text-slate-900">
                SmartStock Premium
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-mono text-3xl font-bold text-slate-900 tabular-nums">
                  ₹299
                </span>
                <span className="text-xs text-slate-500">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  Complete inventory management &amp; valuation
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  Real-time sales analytics &amp; profit trends
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  Advanced reports with date filters &amp; CSV export
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                  Fast-moving &amp; slow-moving product performance tracking
                </li>
              </ul>
            </div>

            <div className="mt-8">
              {isPremium ? (
                <p className="text-xs font-semibold text-emerald-700">Current Plan Active</p>
              ) : upgradeRequested ? (
                <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-center text-xs font-medium text-indigo-800">
                  Upgrade request recorded — payments launch soon
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestUpgrade}
                  className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  Request Premium Plan (₹299/mo)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
