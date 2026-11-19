import React from 'react';
import { Printer, X } from 'lucide-react';
import { formatDateTime, formatINR } from '../lib/formatters';
import type { BusinessProfile, Sale } from '../types';

interface ReceiptModalProps {
  sale: Sale | null;
  business: BusinessProfile | null;
  onClose: () => void;
}

export function ReceiptModal({ sale, business, onClose }: ReceiptModalProps) {
  if (!sale) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 no-print">
          <h2 id="receipt-title" className="font-display text-base font-semibold text-slate-900">
            Sales Receipt
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close receipt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-6 text-slate-900 max-h-[80vh] overflow-y-auto">
          <div className="text-center border-b border-dashed border-slate-300 pb-4">
            <p className="font-display text-lg font-bold text-slate-900">
              {business?.businessName || 'SmartStock Retail Store'}
            </p>
            {business?.address && (
              <p className="mt-0.5 text-xs text-slate-600">
                {business.address}
                {business.city ? `, ${business.city}` : ''}
              </p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              {business?.phone ? `Tel: ${business.phone}` : ''}
              {business?.phone && business?.gstin ? ' · ' : ''}
              {business?.gstin ? `GSTIN: ${business.gstin}` : ''}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-y-1.5 text-xs text-slate-600 border-b border-dashed border-slate-300 pb-4">
            <span>Invoice No</span>
            <span className="text-right font-mono font-semibold text-slate-900">
              {sale.invoiceNumber}
            </span>
            <span>Date &amp; Time</span>
            <span className="text-right tabular-nums">{formatDateTime(sale.createdAt)}</span>
            <span>Customer</span>
            <span className="text-right font-medium text-slate-900">{sale.customerName}</span>
            {sale.customerPhone && (
              <>
                <span>Phone</span>
                <span className="text-right tabular-nums">{sale.customerPhone}</span>
              </>
            )}
            <span>Payment</span>
            <span className="text-right font-medium text-slate-900">{sale.paymentMethod}</span>
          </div>

          <table className="mt-4 w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1.5 text-left font-medium">Item</th>
                <th className="py-1.5 text-right font-medium">Qty</th>
                <th className="py-1.5 text-right font-medium">Rate</th>
                <th className="py-1.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sale.items.map((item, idx) => (
                <tr key={`${item.productId}-${idx}`}>
                  <td className="py-2 pr-2 font-medium text-slate-900">{item.productName}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{item.quantity}</td>
                  <td className="py-2 text-right font-mono tabular-nums">
                    {formatINR(item.unitSellingPrice)}
                  </td>
                  <td className="py-2 text-right font-mono font-medium tabular-nums">
                    {formatINR(item.lineTotal, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 border-t border-dashed border-slate-300 pt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Items Count</span>
              <span className="font-mono tabular-nums">{sale.itemCount}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900">
              <span>Total Paid</span>
              <span className="font-mono tabular-nums">{formatINR(sale.totalAmount, true)}</span>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Thank you for shopping with us · Powered by SmartStock
          </p>
        </div>
      </div>
    </div>
  );
}
