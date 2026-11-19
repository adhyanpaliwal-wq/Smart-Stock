import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, Mail, MapPin, Phone, Store } from 'lucide-react';
import { z } from 'zod';
import { SmartStockLogo } from '../components/SmartStockLogo';
import { useAuth } from '../contexts/AuthContext';
import { contactSchema } from '../lib/validation';

type ContactFormValues = z.infer<typeof contactSchema>;

export function LandingPage() {
  const { user } = useAuth();
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onContactSubmit = async (_values: ContactFormValues) => {
    setContactSubmitted(true);
    reset();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top Bar Contract: 3 Zones (Wordmark — Nav Links — Primary CTA) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
          <Link to="/" aria-label="SmartStock Home">
            <SmartStockLogo />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#features"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
            <a
              href="#contact"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Contact
            </a>
            <Link
              to={user ? '/dashboard' : '/login'}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {user ? 'Dashboard' : 'Login'}
            </Link>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={user ? '/dashboard' : '/register'}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0"
            >
              {user ? 'Open Workspace' : 'Start Free Trial'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-xs font-medium text-slate-500 tracking-wide">
                Smart Inventory. Better Business. · Built for Indian Retail Shops
              </p>
              <h1
                className="mt-4 font-display font-bold tracking-tight text-slate-900 leading-[1.12]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', textWrap: 'balance' }}
              >
                Take Control of Your Inventory. Grow Your Business.
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Track every shelf item in real time, bill customers with printable receipts, catch
                low-stock items before shelves run empty, and monitor daily gross profit in INR —
                without spreadsheets or complex ERP software.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
                >
                  {user ? 'Go to Dashboard' : 'Start Free Trial'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors whitespace-nowrap"
                >
                  Login to your store
                </Link>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                14-day free trial · ₹299/month afterwards · Designed for kirana, stationery,
                apparel &amp; mobile accessory shops
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[280px] rounded-xl border border-slate-200 bg-slate-100 overflow-hidden">
                <img
                  src="/src/assets/images/hero_smartstock_retail_1795102210366.jpg"
                  alt="Organized modern Indian retail store counter using SmartStock digital inventory"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 4-column capability summary strip */}
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-200 pt-10 gap-8">
            <div>
              <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                Real-Time
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">Atomic Stock Deduction</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Every completed bill automatically deducts product stock via Firestore transactions.
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                ₹299/mo
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">Honest Retail Pricing</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Affordable monthly plan built specifically for Tier-2 and Tier-3 neighbourhood
                merchants.
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                Zero-Guess
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">Low-Stock Reorder Alerts</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Automatic threshold alerts with suggested reorder quantities and fast restock actions.
              </p>
            </div>
            <div>
              <p className="font-mono text-2xl font-semibold text-slate-900 tabular-nums">
                1-Click
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">Profit &amp; CSV Reports</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Identify fast-moving and slow-moving SKUs and export sales summaries anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section (Asymmetric Bento Grid) */}
      <section id="features" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-indigo-600">Built for daily shop operations</p>
            <h2
              className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900"
              style={{ textWrap: 'balance' }}
            >
              Everything a neighbourhood retailer needs to run lean and profitable
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white overflow-hidden grid grid-cols-1 md:grid-cols-2">
              <div className="p-8 flex flex-col justify-between">
                <div>
                  <p className="font-mono text-xs text-slate-500">01. Live Inventory Control</p>
                  <h3 className="mt-3 font-display text-xl font-semibold text-slate-900">
                    Know exact stock value and SKU counts across every category
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    Track purchase price, selling price, supplier name, and minimum threshold for
                    every product. SmartStock calculates your total inventory valuation and unit
                    margins automatically.
                  </p>
                </div>
                <p className="mt-6 text-xs font-medium text-slate-500">
                  SKU search · Category filtering · Instant stock valuation
                </p>
              </div>
              <div className="min-h-[240px] bg-slate-100 border-t md:border-t-0 md:border-l border-slate-200">
                <img
                  src="/src/assets/images/retail_kirana_owner_1795102211038.jpg"
                  alt="Indian shop owner reviewing live store stock on a digital tablet"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 flex flex-col justify-between">
              <div>
                <p className="font-mono text-xs text-slate-500">02. Billing &amp; Stock Sync</p>
                <h3 className="mt-3 font-display text-xl font-semibold text-slate-900">
                  Counter sales with printable receipts
                </h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  Select products, enter customer quantities, accept Cash, UPI, Card, or Credit,
                  and print clean thermal-ready receipts. Overselling is blocked automatically.
                </p>
              </div>
              <p className="mt-6 text-xs font-medium text-slate-500">
                Atomic transactions · Negative stock prevention
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 flex flex-col justify-between">
              <div>
                <p className="font-mono text-xs text-slate-500">03. Smart Reorder Alerts</p>
                <h3 className="mt-3 font-display text-xl font-semibold text-slate-900">
                  Catch low-stock items early
                </h3>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  Products at or below minimum stock level appear immediately in your Alerts queue
                  with suggested reorder quantities and one-click restock logging.
                </p>
              </div>
              <p className="mt-6 text-xs font-medium text-slate-500">
                Fast-moving &amp; slow-moving SKU tracking
              </p>
            </div>

            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white overflow-hidden grid grid-cols-1 md:grid-cols-2">
              <div className="min-h-[240px] bg-slate-100 border-b md:border-b-0 md:border-r border-slate-200">
                <img
                  src="/src/assets/images/retail_electronics_shop_1795102211125.jpg"
                  alt="Neatly stocked mobile accessories and stationery retail display shelves"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-8 flex flex-col justify-between">
                <div>
                  <p className="font-mono text-xs text-slate-500">04. Profit &amp; Analytics</p>
                  <h3 className="mt-3 font-display text-xl font-semibold text-slate-900">
                    Daily, weekly, and monthly revenue &amp; gross profit reports
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    Stop guessing which products make money. Compare sales revenue against purchase
                    cost, view category distributions, and export clean CSV reports for your CA or
                    records.
                  </p>
                </div>
                <p className="mt-6 text-xs font-medium text-slate-500">
                  Date-range filters · Recharts analytics · CSV export
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-indigo-600">Simple 3-step onboarding</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900">
              How SmartStock works for your store
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-xl border border-slate-200 bg-white p-7">
              <p className="font-mono text-sm font-semibold text-indigo-600">01</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Create your store &amp; add products
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Register with email or Google Sign-In, enter your shop details, and add your first
                products with purchase price, selling price, and minimum stock threshold.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-7">
              <p className="font-mono text-sm font-semibold text-indigo-600">02</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Record daily sales at the counter
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Build customer bills in seconds. Every completed sale deducts inventory atomically,
                logs gross profit, and generates a printable receipt.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-7">
              <p className="font-mono text-sm font-semibold text-indigo-600">03</p>
              <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">
                Reorder smarter &amp; track growth
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Review automated low-stock alerts before popular items sell out and inspect
                fast-moving vs slow-moving items in real time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-indigo-600">Transparent pricing</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900">
              Built to pay for itself in your first week
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Start with a full 14-day free trial. Upgrade only when SmartStock proves value in
              your shop.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            <div className="rounded-xl border border-slate-200 bg-white p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">For getting started</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-slate-900">Free Trial</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-bold text-slate-900 tabular-nums">
                    ₹0
                  </span>
                  <span className="text-sm text-slate-500">/ 14 days</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    Basic inventory catalog &amp; stock tracking
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    Automated low-stock alerts
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    Daily sales recording &amp; printable receipts
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            <div className="rounded-xl border-2 border-indigo-600 bg-slate-50/60 p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-600">For growing retail stores</p>
                <h3 className="mt-1 font-display text-2xl font-bold text-slate-900">
                  SmartStock Premium
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-bold text-slate-900 tabular-nums">
                    ₹299
                  </span>
                  <span className="text-sm text-slate-500">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    Complete unlimited inventory &amp; supplier tracking
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    Real-time sales analytics &amp; profit margins
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    Advanced daily/weekly/monthly reports &amp; CSV export
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    Fast-moving &amp; slow-moving product performance tracking
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Get Started with Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-indigo-600">Talk to our team</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900">
              Questions about onboarding your shop?
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Whether you run a single-counter kirana store or manage multiple product lines in
              stationery, clothing, or mobile accessories, we can help you migrate your stock list.
            </p>

            <div className="mt-8 space-y-4 text-sm text-slate-700">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>support@smartstock.in</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="font-mono tabular-nums">+91 98260 00299</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>Built for retailers across Tier-2 &amp; Tier-3 India</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-xl border border-slate-200 bg-white p-8">
              {contactSubmitted ? (
                <div className="py-6 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">
                    Inquiry received
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Thank you for reaching out. Our onboarding team will contact you shortly, or you
                    can start your 14-day free trial immediately.
                  </p>
                  <div className="mt-6 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setContactSubmitted(false)}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Send another message
                    </button>
                    <Link
                      to="/register"
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Start Free Trial
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onContactSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        {...register('name')}
                        placeholder="Rajesh Sharma"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                      {errors.name && (
                        <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Shop / Business Name *
                      </label>
                      <input
                        type="text"
                        {...register('shopName')}
                        placeholder="Sharma Kirana & General"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                      />
                      {errors.shopName && (
                        <p className="mt-1 text-xs text-red-600">{errors.shopName.message}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number or Email *
                    </label>
                    <input
                      type="text"
                      {...register('phoneOrEmail')}
                      placeholder="9876543210 or owner@shop.in"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                    {errors.phoneOrEmail && (
                      <p className="mt-1 text-xs text-red-600">{errors.phoneOrEmail.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      How can we help? *
                    </label>
                    <textarea
                      rows={3}
                      {...register('message')}
                      placeholder="Tell us your store type and approximate SKU count..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                    />
                    {errors.message && (
                      <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                  >
                    <Store className="h-4 w-4" />
                    Send Inquiry
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <SmartStockLogo />
            <p className="mt-2 text-xs text-slate-500">
              Smart Inventory. Better Business. · © {new Date().getFullYear()} SmartStock
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-900">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-slate-900">
              Pricing
            </a>
            <Link to="/login" className="hover:text-slate-900">
              Login
            </Link>
            <Link to="/register" className="hover:text-slate-900">
              Start Free Trial
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
