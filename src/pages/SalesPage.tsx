import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Minus,
  Plus,
  Printer,
  ReceiptIndianRupee,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ReceiptModal } from '../components/ReceiptModal';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime, formatINR } from '../lib/formatters';
import { completeSaleTransaction } from '../services/firestoreService';
import { PAYMENT_METHODS, type PaymentMethod, type Product, type Sale } from '../types';

interface CartEntry {
  product: Product;
  quantity: number;
}

export function SalesPage() {
  const { user, businessProfile } = useAuth();
  const { products, sales, loading } = useData();
  const { showToast } = useToast();

  const [productQuery, setProductQuery] = useState('');
  const [salesSearch, setSalesSearch] = useState('');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [submitting, setSubmitting] = useState(false);

  const [activeReceipt, setActiveReceipt] = useState<Sale | null>(null);

  const availableProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return products.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, productQuery]);

  const filteredSales = useMemo(() => {
    const q = salesSearch.trim().toLowerCase();
    return sales.filter(
      (s) =>
        !q ||
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.paymentMethod.toLowerCase().includes(q)
    );
  }, [sales, salesSearch]);

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      showToast({
        title: 'Out of stock',
        description: `${product.name} has 0 units available.`,
        variant: 'error',
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          showToast({
            title: 'Stock limit reached',
            description: `Only ${product.stockQuantity} ${product.unit} available for ${product.name}.`,
            variant: 'info',
          });
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, nextQty: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const clamped = Math.min(Math.max(1, nextQty), item.product.stockQuantity);
          if (nextQty > item.product.stockQuantity) {
            showToast({
              title: 'Insufficient stock',
              description: `Maximum available is ${item.product.stockQuantity} ${item.product.unit}.`,
              variant: 'info',
            });
          }
          return { ...item, quantity: clamped };
        })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartSummary = useMemo(() => {
    let totalAmount = 0;
    let totalCost = 0;
    for (const item of cart) {
      totalAmount += item.product.sellingPrice * item.quantity;
      totalCost += item.product.purchasePrice * item.quantity;
    }
    return {
      totalAmount,
      totalCost,
      grossProfit: totalAmount - totalCost,
    };
  }, [cart]);

  const handleCompleteSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || cart.length === 0) return;

    setSubmitting(true);
    try {
      const sale = await completeSaleTransaction(user.uid, {
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        paymentMethod,
        lines: cart.map((entry) => ({
          productId: entry.product.id,
          quantity: entry.quantity,
        })),
      });

      showToast({
        title: `Sale recorded (${sale.invoiceNumber})`,
        description: `Stock deducted atomically · Total ${formatINR(sale.totalAmount, true)}`,
        variant: 'success',
      });

      setCart([]);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setActiveReceipt(sale);
    } catch (err) {
      showToast({
        title: 'Could not complete sale',
        description: err instanceof Error ? err.message : 'Transaction failed.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Sales & Billing"
      subtitle="Atomic stock deduction with instant profit calculation and printable receipts"
    >
      <div className="space-y-8">
        {/* New Sale Builder */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Product Selector */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Select Products for Sale
              </h2>
              <div className="mt-3 relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search catalog by name, SKU, or category..."
                  className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>

            {products.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-medium text-slate-900">No products available to sell</p>
                <p className="mt-1 text-xs text-slate-500">
                  Add inventory items first to start recording customer bills.
                </p>
                <Link
                  to="/inventory"
                  className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Go to Inventory
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {availableProducts.map((p) => {
                  const out = p.stockQuantity <= 0;
                  return (
                    <div
                      key={p.id}
                      className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          {p.sku} ·{' '}
                          <span className={out ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                            {p.stockQuantity} {p.unit} left
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                          {formatINR(p.sellingPrice)}
                        </span>
                        <button
                          type="button"
                          disabled={out}
                          onClick={() => addToCart(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-800 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Bill / Checkout */}
          <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
            <form onSubmit={handleCompleteSale} className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="font-display text-base font-semibold text-slate-900 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-indigo-600" />
                  Current Bill
                </h2>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  Click &ldquo;Add&rdquo; next to any in-stock product to build a customer bill.
                </div>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {cart.map((entry) => (
                    <div
                      key={entry.product.id}
                      className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {entry.product.name}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500 tabular-nums">
                          {formatINR(entry.product.sellingPrice)} × {entry.quantity} ={' '}
                          {formatINR(entry.product.sellingPrice * entry.quantity, true)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(entry.product.id, entry.quantity - 1)}
                          className="rounded border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={entry.product.stockQuantity}
                          value={entry.quantity}
                          onChange={(e) =>
                            updateCartQuantity(entry.product.id, Number(e.target.value) || 1)
                          }
                          className="w-12 rounded border border-slate-200 py-1 text-center font-mono text-xs tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(entry.product.id, entry.quantity + 1)}
                          className="rounded border border-slate-200 p-1 text-slate-600 hover:bg-slate-50"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(entry.product.id)}
                          className="rounded p-1 text-slate-400 hover:text-red-600"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Customer Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                        paymentMethod === method
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Estimated Gross Profit</span>
                  <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                    {formatINR(cartSummary.grossProfit, true)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>Bill Total</span>
                  <span className="font-mono tabular-nums">
                    {formatINR(cartSummary.totalAmount, true)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={cart.length === 0 || submitting}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Processing Sale...' : 'Complete Sale & Deduct Stock'}
              </button>
            </form>
          </div>
        </div>

        {/* Sales History */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200">
            <div>
              <h2 className="font-display text-base font-semibold text-slate-900">
                Sales History
              </h2>
              <p className="text-xs text-slate-500">
                Completed invoices and printable customer receipts
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                placeholder="Search invoice # or customer..."
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-xs text-slate-500">Loading sales history...</div>
          ) : filteredSales.length === 0 ? (
            <div className="p-10 text-center">
              <ReceiptIndianRupee className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-900">No sales recorded yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Completed bills will appear here with automatic gross profit tracking.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3 text-right">Items</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-right">Profit</th>
                    <th className="px-5 py-3 text-right">Date</th>
                    <th className="px-5 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-indigo-700">
                        {sale.invoiceNumber}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-900">
                        <p className="font-medium">{sale.customerName}</p>
                        {sale.customerPhone && (
                          <p className="font-mono text-slate-500">{sale.customerPhone}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{sale.paymentMethod}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs tabular-nums text-slate-700">
                        {sale.itemCount}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold tabular-nums text-slate-900">
                        {formatINR(sale.totalAmount, true)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold tabular-nums text-emerald-700">
                        {formatINR(sale.grossProfit, true)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {formatDateTime(sale.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setActiveReceipt(sale)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ReceiptModal
        sale={activeReceipt}
        business={businessProfile}
        onClose={() => setActiveReceipt(null)}
      />
    </AppShell>
  );
}
