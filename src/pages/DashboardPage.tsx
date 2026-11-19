import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  IndianRupee,
  Package,
  Plus,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppShell } from '../components/AppShell';
import { ProductFormModal } from '../components/ProductFormModal';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import {
  formatDateTime,
  formatINR,
  formatMonthYear,
  formatNumberIN,
  formatShortDay,
  isSameLocalDay,
  isSameLocalMonth,
  toDate,
} from '../lib/formatters';
import { addProduct, type ProductInput } from '../services/firestoreService';

const CHART_COLORS = ['#4F46E5', '#2563EB', '#0EA5E9', '#10B981', '#F59E0B', '#64748B'];

export function DashboardPage() {
  const { user } = useAuth();
  const { products, sales, transactions, loading, metrics } = useData();
  const { showToast } = useToast();
  const [addOpen, setAddOpen] = useState(false);

  // 1. Sales Overview (Last 7 Days)
  const sevenDayData = useMemo(() => {
    const days: { label: string; revenue: number; profit: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      let revenue = 0;
      let profit = 0;
      for (const s of sales) {
        if (isSameLocalDay(toDate(s.createdAt), d)) {
          revenue += s.totalAmount;
          profit += s.grossProfit;
        }
      }
      days.push({
        label: formatShortDay(d),
        revenue: Number(revenue.toFixed(2)),
        profit: Number(profit.toFixed(2)),
      });
    }
    return days;
  }, [sales]);

  // 2. Monthly Sales Trend (Last 6 Months)
  const monthlyTrendData = useMemo(() => {
    const months: { label: string; revenue: number; profit: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      let revenue = 0;
      let profit = 0;
      for (const s of sales) {
        if (isSameLocalMonth(toDate(s.createdAt), d)) {
          revenue += s.totalAmount;
          profit += s.grossProfit;
        }
      }
      months.push({
        label: formatMonthYear(d),
        revenue: Number(revenue.toFixed(2)),
        profit: Number(profit.toFixed(2)),
      });
    }
    return months;
  }, [sales]);

  // 3. Inventory Category Distribution
  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; units: number }>();
    for (const p of products) {
      const existing = map.get(p.category) || { name: p.category, value: 0, units: 0 };
      existing.value += p.stockQuantity * p.purchasePrice;
      existing.units += p.stockQuantity;
      map.set(p.category, existing);
    }
    return Array.from(map.values())
      .map((item) => ({ ...item, value: Number(item.value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [products]);

  // 4. Fast-Moving Products (highest units sold)
  const fastMoving = useMemo(() => {
    return [...products]
      .filter((p) => (p.totalUnitsSold || 0) > 0)
      .sort((a, b) => (b.totalUnitsSold || 0) - (a.totalUnitsSold || 0))
      .slice(0, 5);
  }, [products]);

  // 5. Slow-Moving Products (in stock, lowest units sold)
  const slowMoving = useMemo(() => {
    return [...products]
      .filter((p) => p.stockQuantity > 0)
      .sort((a, b) => (a.totalUnitsSold || 0) - (b.totalUnitsSold || 0))
      .slice(0, 5);
  }, [products]);

  const combinedAlerts = useMemo(
    () => [...metrics.outOfStockProducts, ...metrics.lowStockProducts].slice(0, 6),
    [metrics.outOfStockProducts, metrics.lowStockProducts]
  );

  const handleCreateFirstProduct = async (values: ProductInput) => {
    if (!user) return;
    try {
      await addProduct(user.uid, values);
      showToast({
        title: 'Product added',
        description: `${values.name} is now live in your inventory.`,
        variant: 'success',
      });
      setAddOpen(false);
    } catch (err) {
      showToast({
        title: 'Could not add product',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return (
      <AppShell title="Dashboard" subtitle="Store overview and performance">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
              <div className="h-3 w-24 bg-slate-200 rounded" />
              <div className="mt-4 h-7 w-32 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle="Live inventory valuation, sales velocity, and low-stock monitoring"
      action={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </button>
          <Link
            to="/sales"
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            <ShoppingBag className="h-4 w-4" />
            Record Sale
          </Link>
        </div>
      }
    >
      {products.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center max-w-2xl mx-auto mt-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Package className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-slate-900">
            Welcome to your SmartStock workspace
          </h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Your Firestore database is connected and empty. Add your first product to start tracking
            stock levels, inventory value, and counter sales in real time.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Your First Product
            </button>
            <Link
              to="/settings"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Complete Shop Profile
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 6 Required KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Total Products</span>
                <Package className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {formatNumberIN(metrics.totalProducts)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Active SKUs in catalog</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Total Inventory Value</span>
                <IndianRupee className="h-4 w-4 text-blue-600" />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {formatINR(metrics.totalInventoryValue)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Stock quantity × purchase price</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Today&apos;s Sales</span>
                <ShoppingBag className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {formatINR(metrics.todaysSales)}
              </p>
              <p className="mt-1 text-xs text-slate-500 tabular-nums">
                {metrics.todaysSalesCount} {metrics.todaysSalesCount === 1 ? 'bill' : 'bills'} today
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Low Stock Products</span>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold text-amber-700 tabular-nums">
                {formatNumberIN(metrics.lowStockProducts.length)}
              </p>
              <p className="mt-1 text-xs text-slate-500">At or below minimum threshold</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Out of Stock Products</span>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold text-red-600 tabular-nums">
                {formatNumberIN(metrics.outOfStockProducts.length)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Zero units remaining</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Monthly Revenue</span>
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
                {formatINR(metrics.monthlyRevenue)}
              </p>
              <p className="mt-1 text-xs text-slate-500">Current calendar month</p>
            </div>
          </div>

          {/* Charts Row 1: Sales Overview & Monthly Sales Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900">
                    Sales Overview (Last 7 Days)
                  </h2>
                  <p className="text-xs text-slate-500">Daily revenue vs gross profit in INR</p>
                </div>
              </div>
              <div className="mt-5 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sevenDayData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      formatter={(value) => formatINR(Number(value ?? 0), true)}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#4F46E5"
                      fill="#EEF2FF"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="Gross Profit"
                      stroke="#10B981"
                      fill="#ECFDF5"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900">
                  Monthly Sales Trend
                </h2>
                <p className="text-xs text-slate-500">6-month revenue trajectory</p>
              </div>
              <div className="mt-5 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyTrendData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      formatter={(value) => formatINR(Number(value ?? 0), true)}
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #E2E8F0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="revenue" name="Revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Profit" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Category Distribution + Fast & Slow Moving Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Inventory Category Distribution
              </h2>
              <p className="text-xs text-slate-500">Share of stock valuation by category</p>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={2}
                    >
                      {categoryData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatINR(Number(value ?? 0), true)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1.5">
                {categoryData.slice(0, 4).map((cat, idx) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-700 truncate pr-2">
                      <span
                        className="h-2.5 w-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="font-mono text-slate-900 tabular-nums">
                      {formatINR(cat.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Fast-Moving Products
              </h2>
              <p className="text-xs text-slate-500">Top items by units sold</p>
              {fastMoving.length === 0 ? (
                <p className="mt-8 text-xs text-slate-500">
                  No completed sales recorded yet. Fast-moving items will appear once bills are
                  completed.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {fastMoving.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-b-0"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {p.category} · Stock: {p.stockQuantity} {p.unit}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-emerald-700 tabular-nums shrink-0">
                        {p.totalUnitsSold} sold
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="font-display text-base font-semibold text-slate-900">
                Slow-Moving Products
              </h2>
              <p className="text-xs text-slate-500">In-stock items with lowest turnover</p>
              {slowMoving.length === 0 ? (
                <p className="mt-8 text-xs text-slate-500">No in-stock products available.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {slowMoving.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-b-0"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          Value: {formatINR(p.stockQuantity * p.purchasePrice)} · {p.stockQuantity}{' '}
                          {p.unit}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-medium text-slate-600 tabular-nums shrink-0">
                        {p.totalUnitsSold || 0} sold
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Transactions & Low Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900">
                    Recent Stock &amp; Sales Transactions
                  </h2>
                  <p className="text-xs text-slate-500">Latest movements in your ledger</p>
                </div>
                <Link
                  to="/sales"
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View Sales <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No stock movements recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 font-medium">Product</th>
                        <th className="px-5 py-3 font-medium">Type</th>
                        <th className="px-5 py-3 font-medium text-right">Qty</th>
                        <th className="px-5 py-3 font-medium text-right">Amount</th>
                        <th className="px-5 py-3 font-medium text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.slice(0, 7).map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3 font-medium text-slate-900">
                            {tx.productName}
                            <p className="text-[11px] font-normal text-slate-500 truncate max-w-[200px]">
                              {tx.note}
                            </p>
                          </td>
                          <td className="px-5 py-3 capitalize text-slate-600">{tx.type}</td>
                          <td
                            className={`px-5 py-3 text-right font-mono tabular-nums font-medium ${
                              tx.quantityDelta < 0 ? 'text-red-600' : 'text-emerald-700'
                            }`}
                          >
                            {tx.quantityDelta > 0 ? `+${tx.quantityDelta}` : tx.quantityDelta}
                          </td>
                          <td className="px-5 py-3 text-right font-mono tabular-nums text-slate-900">
                            {formatINR(tx.amount)}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-500 tabular-nums whitespace-nowrap">
                            {formatDateTime(tx.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-900">
                    Low-Stock Alerts
                  </h2>
                  <p className="text-xs text-slate-500">Items requiring immediate reorder</p>
                </div>
                <Link
                  to="/alerts"
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Manage Alerts <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {combinedAlerts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  All products are currently above their minimum stock levels.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {combinedAlerts.map((item) => (
                    <div key={item.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.stockQuantity === 0 ? (
                            <span className="font-medium text-red-600">Out of stock</span>
                          ) : (
                            <span className="font-medium text-amber-700">
                              Low stock ({item.stockQuantity} {item.unit})
                            </span>
                          )}{' '}
                          · Min: {item.minStockLevel}
                        </p>
                      </div>
                      <Link
                        to="/alerts"
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                      >
                        Reorder
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ProductFormModal
        isOpen={addOpen}
        editingProduct={null}
        onClose={() => setAddOpen(false)}
        onSubmit={handleCreateFirstProduct}
      />
    </AppShell>
  );
}
