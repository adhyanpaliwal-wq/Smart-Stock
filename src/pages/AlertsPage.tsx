import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  Check,
  PackageCheck,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime, formatINR } from '../lib/formatters';
import {
  deleteNotification,
  markNotificationRead,
  restockProduct,
} from '../services/firestoreService';
import type { Product } from '../types';

export function AlertsPage() {
  const { user } = useAuth();
  const { products, notifications, loading } = useData();
  const { showToast } = useToast();

  const [reorderTarget, setReorderTarget] = useState<Product | null>(null);
  const [reorderQty, setReorderQty] = useState<number>(10);
  const [reorderNote, setReorderNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const alertProducts = useMemo(() => {
    return products
      .filter((p) => p.stockQuantity <= p.minStockLevel)
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
  }, [products]);

  const getSuggestedQty = (p: Product) => Math.max(p.minStockLevel * 2 - p.stockQuantity, 10);

  const openReorderModal = (product: Product) => {
    setReorderTarget(product);
    setReorderQty(getSuggestedQty(product));
    setReorderNote(
      product.supplierName ? `Reordered from ${product.supplierName}` : 'Stock replenishment'
    );
  };

  const handleConfirmReorder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reorderTarget || reorderQty <= 0) return;
    setSubmitting(true);
    try {
      await restockProduct(user.uid, reorderTarget.id, reorderQty, reorderNote);
      showToast({
        title: 'Inventory restocked',
        description: `Added +${reorderQty} ${reorderTarget.unit} to ${reorderTarget.name}.`,
        variant: 'success',
      });
      setReorderTarget(null);
    } catch (err) {
      showToast({
        title: 'Reorder failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!user) return;
    try {
      await markNotificationRead(user.uid, id);
    } catch (err) {
      showToast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Could not update alert.',
        variant: 'error',
      });
    }
  };

  const handleDeleteNotif = async (id: string) => {
    if (!user) return;
    try {
      await deleteNotification(user.uid, id);
    } catch (err) {
      showToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Could not delete notification.',
        variant: 'error',
      });
    }
  };

  return (
    <AppShell
      title="Low Stock Alerts"
      subtitle={`${alertProducts.length} products currently at or below minimum stock level`}
    >
      <div className="space-y-8">
        {/* Low Stock Action Table */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Products Requiring Reorder
              </h2>
              <p className="text-xs text-slate-500">
                Automatically detected whenever current stock quantity &le; minimum stock level
              </p>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              View Full Catalog
            </Link>
          </div>

          {loading ? (
            <div className="p-6 text-xs text-slate-500">Checking inventory thresholds...</div>
          ) : alertProducts.length === 0 ? (
            <div className="p-10 text-center">
              <PackageCheck className="mx-auto h-10 w-10 text-emerald-500" />
              <h3 className="mt-3 font-display text-base font-semibold text-slate-900">
                Stock levels are healthy
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Every product in your catalog is above its minimum stock threshold.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-5 py-3.5">Supplier</th>
                    <th className="px-5 py-3.5 text-right">Available</th>
                    <th className="px-5 py-3.5 text-right">Min Level</th>
                    <th className="px-5 py-3.5 text-right">Suggested Reorder</th>
                    <th className="px-5 py-3.5 text-right">Est. Cost</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alertProducts.map((product) => {
                    const suggested = getSuggestedQty(product);
                    const estCost = suggested * product.purchasePrice;
                    const isOut = product.stockQuantity === 0;
                    return (
                      <tr key={product.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-900">{product.name}</p>
                          <p className="font-mono text-xs text-slate-500">
                            {product.sku} ·{' '}
                            <span className={isOut ? 'text-red-600 font-semibold' : 'text-amber-700'}>
                              {isOut ? 'Out of Stock' : 'Low Stock'}
                            </span>
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          {product.supplierName || '—'}
                        </td>
                        <td
                          className={`px-5 py-3.5 text-right font-mono tabular-nums font-semibold ${
                            isOut ? 'text-red-600' : 'text-amber-700'
                          }`}
                        >
                          {product.stockQuantity} {product.unit}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-600">
                          {product.minStockLevel} {product.unit}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums font-semibold text-indigo-700">
                          +{suggested} {product.unit}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-700">
                          {formatINR(estCost)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => openReorderModal(product)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Reorder
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notification Feed */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <h2 className="font-display text-base font-semibold text-slate-900">
                Alert History &amp; Notifications
              </h2>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {notifications.length} total
            </span>
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No notifications recorded yet. Low-stock and restock events are logged here
              automatically.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.slice(0, 20).map((notif) => (
                <div
                  key={notif.id}
                  className={`px-6 py-4 flex items-start justify-between gap-4 ${
                    notif.isRead ? 'bg-white' : 'bg-indigo-50/30'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <AlertTriangle
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        notif.type === 'out_of_stock'
                          ? 'text-red-600'
                          : notif.type === 'low_stock'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">{notif.message}</p>
                      <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                        {formatDateTime(notif.createdAt)}
                        {!notif.isRead && ' · Unread'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(notif.id)}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-700"
                        title="Mark as read"
                        aria-label="Mark notification as read"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteNotif(notif.id)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reorder / Restock Modal */}
      {reorderTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Reorder &amp; Receive Stock
                </h2>
                <p className="text-xs text-slate-500">{reorderTarget.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setReorderTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReorder} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                <div>
                  <span className="text-slate-500">Current Stock</span>
                  <p className="font-mono font-semibold text-slate-900 tabular-nums">
                    {reorderTarget.stockQuantity} {reorderTarget.unit}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Min Threshold</span>
                  <p className="font-mono font-semibold text-slate-900 tabular-nums">
                    {reorderTarget.minStockLevel} {reorderTarget.unit}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Quantity to Add ({reorderTarget.unit}) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={reorderQty}
                  onChange={(e) => setReorderQty(Math.max(1, Number(e.target.value)))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm tabular-nums focus:border-indigo-600 focus:outline-none"
                />
                <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
                  Estimated purchase cost: {formatINR(reorderQty * reorderTarget.purchasePrice, true)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Supplier / Restock Note
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={reorderNote}
                  onChange={(e) => setReorderNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReorderTarget(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {submitting ? 'Updating Stock...' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
