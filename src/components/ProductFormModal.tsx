import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles, X } from 'lucide-react';
import { z } from 'zod';
import { formatINR } from '../lib/formatters';
import { productSchema } from '../lib/validation';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS, type Product } from '../types';

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  editingProduct: Product | null;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
}

export function ProductFormModal({
  isOpen,
  editingProduct,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as never,
    defaultValues: {
      name: '',
      sku: '',
      category: PRODUCT_CATEGORIES[0],
      stockQuantity: 0,
      minStockLevel: 5,
      purchasePrice: 0,
      sellingPrice: 0,
      supplierName: '',
      unit: 'pcs',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        reset({
          name: editingProduct.name,
          sku: editingProduct.sku,
          category: editingProduct.category,
          stockQuantity: editingProduct.stockQuantity,
          minStockLevel: editingProduct.minStockLevel,
          purchasePrice: editingProduct.purchasePrice,
          sellingPrice: editingProduct.sellingPrice,
          supplierName: editingProduct.supplierName,
          unit: editingProduct.unit,
          imageUrl: editingProduct.imageUrl || '',
        });
      } else {
        reset({
          name: '',
          sku: '',
          category: PRODUCT_CATEGORIES[0],
          stockQuantity: 10,
          minStockLevel: 5,
          purchasePrice: 0,
          sellingPrice: 0,
          supplierName: '',
          unit: 'pcs',
          imageUrl: '',
        });
      }
    }
  }, [isOpen, editingProduct, reset]);

  if (!isOpen) return null;

  const watchedStock = Number(watch('stockQuantity')) || 0;
  const watchedPurchase = Number(watch('purchasePrice')) || 0;
  const watchedSelling = Number(watch('sellingPrice')) || 0;
  const watchedName = watch('name') || '';

  const inventoryValue = watchedStock * watchedPurchase;
  const unitMargin = watchedSelling - watchedPurchase;

  const generateSku = () => {
    const prefix =
      watchedName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 4) || 'ITEM';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setValue('sku', `${prefix}-${rand}`, { shouldValidate: true });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl my-8">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="product-modal-title" className="font-display text-lg font-semibold text-slate-900">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-slate-500">
              All values sync directly to your Firestore inventory catalog.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g., Fortune Chakki Fresh Atta 5kg"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                SKU / Product Code *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  {...register('sku')}
                  placeholder="ATTA-5KG-01"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={generateSku}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
                  title="Generate SKU"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Auto
                </button>
              </div>
              {errors.sku && <p className="mt-1 text-xs text-red-600">{errors.sku.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category *</label>
              <select
                {...register('category')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Current Stock Quantity *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                {...register('stockQuantity')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-indigo-600 focus:outline-none"
              />
              {errors.stockQuantity && (
                <p className="mt-1 text-xs text-red-600">{errors.stockQuantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Minimum Stock Alert Level *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                {...register('minStockLevel')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-indigo-600 focus:outline-none"
              />
              {errors.minStockLevel && (
                <p className="mt-1 text-xs text-red-600">{errors.minStockLevel.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Purchase Price (INR) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                {...register('purchasePrice')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-indigo-600 focus:outline-none"
              />
              {errors.purchasePrice && (
                <p className="mt-1 text-xs text-red-600">{errors.purchasePrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Selling Price (INR) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                {...register('sellingPrice')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 tabular-nums focus:border-indigo-600 focus:outline-none"
              />
              {errors.sellingPrice && (
                <p className="mt-1 text-xs text-red-600">{errors.sellingPrice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Unit *</label>
              <select
                {...register('unit')}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
              >
                {PRODUCT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Supplier Name
              </label>
              <input
                type="text"
                {...register('supplierName')}
                placeholder="e.g., Shree Ganesh Distributors"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              {errors.supplierName && (
                <p className="mt-1 text-xs text-red-600">{errors.supplierName.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Product Image URL (optional)
              </label>
              <input
                type="url"
                {...register('imageUrl')}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
              />
              {errors.imageUrl && (
                <p className="mt-1 text-xs text-red-600">{errors.imageUrl.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-xs text-slate-500">Computed Inventory Value</p>
              <p className="mt-0.5 font-mono text-base font-semibold text-slate-900 tabular-nums">
                {formatINR(inventoryValue, true)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Profit Margin per Unit</p>
              <p
                className={`mt-0.5 font-mono text-base font-semibold tabular-nums ${
                  unitMargin >= 0 ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {formatINR(unitMargin, true)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              {isSubmitting
                ? 'Saving...'
                : editingProduct
                ? 'Save Changes'
                : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
