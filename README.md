# SmartStock — Smart Inventory. Better Business.

SmartStock is a production-ready inventory management, counter billing, low-stock alert, and gross profit analytics SaaS platform built for small Indian retail shops (kirana stores, stationery shops, clothing stores, mobile accessory stores, and neighbourhood businesses).

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, React Router v7
- **Forms & Validation:** React Hook Form + Zod
- **Charts:** Recharts
- **Icons:** Lucide React
- **Backend & Auth:** Firebase Authentication + Cloud Firestore
- **Hosting:** Vercel compatible (`vercel.json` SPA rewrites included)

## Key Features

1. **Firebase Authentication:**
   - Email & Password registration (with Full Name, Business Name, Mobile Number, Email verification)
   - Email & Password login + Forgot Password reset email
   - Google Sign-In (`signInWithPopup`)
   - Protected internal routes and persistent login sessions
2. **Real-Time Multi-User Firestore Architecture:**
   - Strictly isolated per-merchant collections under `users/{userId}/...` (`business`, `products`, `sales`, `transactions`, `notifications`)
   - Hardened `firestore.rules` enforcing verified ownership, strict key schemas, non-negative stock, and immutable sales/ledger records
3. **Inventory Management:**
   - Add, edit, delete, view details, quick restock, search, category/stock filters, sorting, and automatic stock valuation (`stockQuantity × purchasePrice`)
4. **Sales & Counter Billing:**
   - Multi-item bill builder with oversell protection
   - Atomic Firestore `runTransaction` deducting product stock, recording sales, computing gross profit, logging ledger entries, and triggering low-stock alerts
   - Printable customer sales receipts
5. **Low-Stock Alerts & Reports:**
   - Automatic detection (`stockQuantity <= minStockLevel`) with suggested reorder quantities and one-click restocking
   - Daily, weekly, monthly revenue & gross profit reports, fast/slow-moving SKU analysis, date filters, and CSV export

## Firebase Setup Instructions

1. Open your Firebase Console (`https://console.firebase.google.com/`).
2. Under **Authentication → Sign-in method**, ensure both **Google** and **Email/Password** providers are enabled.
3. Under **Authentication → Settings → Authorized domains**, add your Vercel domain (e.g., `smartstock.vercel.app`) when deploying externally.
4. Deploy the security rules from `firestore.rules` to your Firestore database.

## Local Development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` if deploying outside AI Studio and populate your `VITE_FIREBASE_*` keys.

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the project into Vercel (`Framework Preset: Vite`, `Build Command: npm run build`, `Output Directory: dist`).
3. Add all `VITE_FIREBASE_*` environment variables from `.env.example` in Vercel Project Settings → Environment Variables.
4. Deploy. `vercel.json` handles SPA route rewrites automatically.
