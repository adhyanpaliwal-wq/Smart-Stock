import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AppShell } from '../components/AppShell';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import {
  exportToCSV,
  formatDate,
  formatINR,
  formatShortDay,
  isSameLocalDay,
  isSameLocalMonth,
  toDate,
} from '../lib/formatters';

type DatePreset = 'today' | '7d' | '30d' | 'all' | 'custom';

export function ReportsPage() {
  const { products, sales, metrics } = useData();
  const { showToast } = useToast();

  const [preset, setPreset] = useState<DatePreset>('30d');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      const d = toDate(s.createdAt);
      if (preset === 'today') return isSameLocalDay(d, now);
      if (preset === '7d') {
        const min = new Date(now);
        min.setDate(now.getDate() - 6);
        min.setHours(0, 0, 0, 0);
        return d >= min;
      }
      if (preset === '30d') {
        const min = new Date(now);
        min.setDate(now.getDate() - 29);
        min.setHours(0, 0, 0, 0);
        return d >= min;
      }
      if (preset === 'custom') {
        const from = startDate ? new Date(`${startDate}T00:00:00`) : new Date(0);
        const to = endDate ? new Date(`${endDate}T23:59:59`) : new Date();
        return d >= from && d <= to;
      }
      return true;
    });
  }, [sales, preset, startDate, endDate]);

  const reportTotals = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    let dailySales = 0;
    let weeklySales = 0;
    let monthlySales = 0;

    for (const s of sales) {
      const d = toDate(s.createdAt);
      if (isSameLocalDay(d, now)) dailySales += s.totalAmount;
      if (d >= weekAgo) weeklySales += s.totalAmount;
      if (isSameLocalMonth(d, now)) monthlySales += s.totalAmount;
    }

    const filteredRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const filteredProfit = filteredSales.reduce((sum, s) => sum + s.grossProfit, 0);

    return {
      dailySales,
      weeklySales,
      monthlySales,
      filteredRevenue,
      filteredProfit,
      marginPct: filteredRevenue > 0 ? (filteredProfit / filteredRevenue) * 100 : 0,
    };
  }, [sales, filteredSales]);

  const dailyChartData = useMemo(() => {
    const map = new Map<string, { label: string; revenue: number; profit: number }>();
    const sorted = [...filteredSales].sort(
      (a, b) => toDate(a.createdAt).getTime() - toDate(b.createdAt).getTime()
    );
    for (const s of sorted) {
      const d = toDate(s.createdAt);
      const key = d.toISOString().slice(0, 10);
      const existing = map.get(key) || { label: formatShortDay(d), revenue: 0, profit: 0 };
      existing.revenue = Number((existing.revenue + s.totalAmount).toFixed(2));
      existing.profit = Number((existing.profit + s.grossProfit).toFixed(2));
      map.set(key, existing);
    }
    return Array.from(map.values());
  }, [filteredSales]);

  const fastMoving = useMemo(
    () =>
      [...products]
        .filter((p) => (p.totalUnitsSold || 0) > 0)
        .sort((a, b) => (b.totalUnitsSold || 0) - (a.totalUnitsSold || 0))
        .slice(0, 8),
    [products]
  );

  const slowMoving = useMemo(
    () =>
      [...products]
        .sort((a, b) => (a.totalUnitsSold || 0) - (b.totalUnitsSold || 0))
        .slice(0, 8),
    [products]
  );

  const lowStock = useMemo(
    () => products.filter((p) => p.stockQuantity <= p.minStockLevel),
    [products]
  );

  const handleExportSalesCSV = () => {
    exportToCSV(
      `smartstock-sales-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Invoice Number', 'Date', 'Customer', 'Payment Method', 'Items', 'Revenue (INR)', 'Cost (INR)', 'Gross Profit (INR)'],
      filteredSales.map((s) => [
        s.invoiceNumber,
        formatDate(s.createdAt),
        s.customerName,
        s.paymentMethod,
        s.itemCount,
        s.totalAmount.toFixed(2),
        s.totalCost.toFixed(2),
        s.grossProfit.toFixed(2),
      ])
    );
    showToast({ title: 'Sales CSV exported', variant: 'success' });
  };

  const handleExportInventoryCSV = () => {
    exportToCSV(
      `smartstock-inventory-valuation-${new Date().toISOString().slice(0, 10)}.csv`,
      ['SKU', 'Product Name', 'Category', 'Stock', 'Unit', 'Min Stock', 'Purchase Price (INR)', 'Selling Price (INR)', 'Valuation (INR)', 'Units Sold'],
      products.map((p) => [
        p.sku,
        p.name,
        p.category,
        p.stockQuantity,
        p.unit,
        p.minStockLevel,
        p.purchasePrice.toFixed(2),
        p.sellingPrice.toFixed(2),
        (p.stockQuantity * p.purchasePrice).toFixed(2),
        p.totalUnitsSold || 0,
      ])
    );
    showToast({ title: 'Inventory valuation CSV exported', variant: 'success' });
  };

  return (
    <AppShell
      title="Reports & Analytics"
      subtitle="Daily, weekly, and monthly revenue, gross profit, inventory valuation, and CSV exports"
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportInventoryCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Inventory CSV
          </button>
          <button
            type="button"
            onClick={handleExportSalesCSV}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            Sales CSV
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Date Filter Bar */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {(
              [
                { id: 'today', label: 'Today' },
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: 'all', label: 'All Time' },
                { id: 'custom', label: 'Custom Range' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPreset(opt.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  preset === opt.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs"
              />
            </div>
          )}
        </div>

        {/* Core Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Daily Sales (Today)</p>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {formatINR(reportTotals.dailySales, true)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Weekly Sales (7 Days)</p>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {formatINR(reportTotals.weeklySales, true)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Monthly Sales (This Month)</p>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {formatINR(reportTotals.monthlySales, true)}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Selected Period Revenue</p>
            <p className="mt-2 font-mono text-2xl font-bold text-indigo-700 tabular-nums">
              {formatINR(reportTotals.filteredRevenue, true)}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              {filteredSales.length} completed bills
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Estimated Gross Profit</p>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-700 tabular-nums">
              {formatINR(reportTotals.filteredProfit, true)}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              Margin: {reportTotals.marginPct.toFixed(1)}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium text-slate-500">Current Inventory Valuation</p>
            <p className="mt-2 font-mono text-2xl font-bold text-slate-900 tabular-nums">
              {formatINR(metrics.totalInventoryValue, true)}
            </p>
            <p className="mt-1 text-xs text-slate-500 tabular-nums">
              Across {metrics.totalProducts} active SKUs
            </p>
          </div>
        </div>

        {/* Period Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Revenue &amp; Gross Profit Breakdown (Selected Period)
          </h2>
          {dailyChartData.length === 0 ? (
            <p className="mt-8 pb-6 text-center text-xs text-slate-500">
              No sales data within the selected date range.
            </p>
          ) : (
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip formatter={(value) => formatINR(Number(value ?? 0), true)} />
                  <Bar dataKey="revenue" name="Revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Gross Profit" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Performance Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Fast-Moving Products
            </h3>
            <p className="text-xs text-slate-500 mb-4">Highest unit sales volume</p>
            {fastMoving.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No units sold yet.</p>
            ) : (
              <div className="space-y-2.5">
                {fastMoving.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 last:border-b-0"
                  >
                    <span className="font-medium text-slate-900 truncate pr-2">{p.name}</span>
                    <span className="font-mono font-semibold text-emerald-700 tabular-nums shrink-0">
                      {p.totalUnitsSold} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Slow-Moving Products
            </h3>
            <p className="text-xs text-slate-500 mb-4">Lowest unit turnover</p>
            {slowMoving.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No products added yet.</p>
            ) : (
              <div className="space-y-2.5">
                {slowMoving.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 last:border-b-0"
                  >
                    <span className="font-medium text-slate-900 truncate pr-2">{p.name}</span>
                    <span className="font-mono text-slate-600 tabular-nums shrink-0">
                      {p.totalUnitsSold || 0} sold · {formatINR(p.stockQuantity * p.purchasePrice)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-display text-sm font-semibold text-slate-900">
              Low-Stock Summary
            </h3>
            <p className="text-xs text-slate-500 mb-4">Products needing replenishment</p>
            {lowStock.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">No low-stock products.</p>
            ) : (
              <div className="space-y-2.5">
                {lowStock.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-xs border-b border-slate-100 pb-2 last:border-b-0"
                  >
                    <span className="font-medium text-slate-900 truncate pr-2">{p.name}</span>
                    <span
                      className={`font-mono font-semibold tabular-nums shrink-0 ${
                        p.stockQuantity === 0 ? 'text-red-600' : 'text-amber-700'
                      }`}
                    >
                      {p.stockQuantity} / {p.minStockLevel} {p.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
