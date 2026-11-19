import React, { useMemo, useState } from 'react';
import {
  Edit2,
  Eye,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { ProductFormModal } from '../components/ProductFormModal';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime, formatINR, formatNumberIN } from '../lib/formatters';
import {
  addProduct,
  deleteProduct,
  restockProduct,
  updateProduct,
  type ProductInput,
} from '../services/firestoreService';
import { PRODUCT_CATEGORIES, type Product } from '../types';

type SortOption = 'updated_desc' | 'name_asc' | 'stock_asc' | 'stock_desc' | 'value_desc';
type StatusFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export function InventoryPage() {
  const { user } = useAuth();
  const { products, loading } = useData();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('updated_desc');

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockLoading, setRestockLoading] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q);
      const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'out_of_stock' && p.stockQuantity === 0) ||
        (statusFilter === 'low_stock' &&
          p.stockQuantity > 0 &&
          p.stockQuantity <= p.minStockLevel) ||
        (statusFilter === 'in_stock' && p.stockQuantity > p.minStockLevel);
      return matchesSearch && matchesCat && matchesStatus;
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'stock_asc':
          return a.stockQuantity - b.stockQuantity;
        case 'stock_desc':
          return b.stockQuantity - a.stockQuantity;
        case 'value_desc':
          return b.stockQuantity * b.purchasePrice - a.stockQuantity * a.purchasePrice;
        default:
          return 0;
      }
    });
  }, [products, searchTerm, categoryFilter, statusFilter, sortBy]);

  const filteredValuation = useMemo(
    () => filteredProducts.reduce((sum, p) => sum + p.stockQuantity * p.purchasePrice, 0),
    [filteredProducts]
  );

  const handleSaveProduct = async (values: ProductInput) => {
    if (!user) return;
    try {
      if (editingProduct) {
        await updateProduct(user.uid, editingProduct.id, values);
        showToast({
          title: 'Product updated',
          description: `${values.name} saved to Firestore.`,
          variant: 'success',
        });
      } else {
        await addProduct(user.uid, values);
        showToast({
          title: 'Product added',
          description: `${values.name} added to inventory.`,
          variant: 'success',
        });
      }
      setFormOpen(false);
      setEditingProduct(null);
    } catch (err) {
      showToast({
        title: 'Failed to save product',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  };

  const confirmDelete = async () => {
    if (!user || !deletingProduct) return;
    setDeleteLoading(true);
    try {
      await deleteProduct(user.uid, deletingProduct.id);
      showToast({
        title: 'Product deleted',
        description: `${deletingProduct.name} removed from catalog.`,
        variant: 'info',
      });
      setDeletingProduct(null);
      if (viewingProduct?.id === deletingProduct.id) {
        setViewingProduct(null);
      }
    } catch (err) {
      showToast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Could not delete product.',
        variant: 'error',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleQuickRestock = async () => {
    if (!user || !viewingProduct || restockQty <= 0) return;
    setRestockLoading(true);
    try {
      await restockProduct(user.uid, viewingProduct.id, restockQty, 'Manual restock from inventory');
      showToast({
        title: 'Stock updated',
        description: `Added +${restockQty} ${viewingProduct.unit} to ${viewingProduct.name}.`,
        variant: 'success',
      });
      setViewingProduct(null);
    } catch (err) {
      showToast({
        title: 'Restock failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setRestockLoading(false);
    }
  };

  return (
    <AppShell
      title="Inventory Management"
      subtitle={`${formatNumberIN(products.length)} SKUs · Total valuation ${formatINR(filteredValuation)}`}
      action={
        <button
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </button>
      }
    >
      {/* Filters Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name, SKU, or supplier..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label="Filter by stock status"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none"
            >
              <option value="all">All Stock</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort products"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-indigo-600 focus:outline-none"
            >
              <option value="updated_desc">Recently Updated</option>
              <option value="name_asc">Name (A–Z)</option>
              <option value="stock_asc">Stock (Low–High)</option>
              <option value="stock_desc">Stock (High–Low)</option>
              <option value="value_desc">Value (High–Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-4 font-display text-lg font-semibold text-slate-900">
            {products.length === 0 ? 'No products in your inventory yet' : 'No matching products'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {products.length === 0
              ? 'Add your first product with SKU, purchase price, selling price, and minimum stock level.'
              : 'Try clearing your search query or switching category filters.'}
          </p>
          {products.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setFormOpen(true);
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add First Product
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Product &amp; SKU</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5 text-right">Stock</th>
                  <th className="px-5 py-3.5 text-right">Purchase</th>
                  <th className="px-5 py-3.5 text-right">Selling</th>
                  <th className="px-5 py-3.5 text-right">Stock Value</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const val = product.stockQuantity * product.purchasePrice;
                  const isOut = product.stockQuantity === 0;
                  const isLow =
                    product.stockQuantity > 0 && product.stockQuantity <= product.minStockLevel;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="font-mono text-xs text-slate-500">
                          {product.sku}
                          {product.supplierName ? ` · ${product.supplierName}` : ''}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{product.category}</td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-900">
                        {product.stockQuantity} {product.unit}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums text-slate-600">
                        {formatINR(product.purchasePrice)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatINR(product.sellingPrice)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono tabular-nums font-medium text-slate-900">
                        {formatINR(val)}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium whitespace-nowrap">
                        {isOut ? (
                          <span className="text-red-600">Out of Stock</span>
                        ) : isLow ? (
                          <span className="text-amber-700">Low Stock</span>
                        ) : (
                          <span className="text-emerald-700">In Stock</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setViewingProduct(product);
                              setRestockQty(Math.max(product.minStockLevel * 2, 10));
                            }}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
                            title="View Details"
                            aria-label={`View ${product.name}`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(product);
                              setFormOpen(true);
                            }}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            title="Edit Product"
                            aria-label={`Edit ${product.name}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(product)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            title="Delete Product"
                            aria-label={`Delete ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <ProductFormModal
        isOpen={formOpen}
        editingProduct={editingProduct}
        onClose={() => {
          setFormOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleSaveProduct}
      />

      {/* Product Details & Quick Restock Modal */}
      {viewingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="font-mono text-xs text-slate-500">{viewingProduct.sku}</p>
                <h2 className="mt-1 font-display text-lg font-bold text-slate-900">
                  {viewingProduct.name}
                </h2>
                <p className="text-xs text-slate-500">{viewingProduct.category}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {viewingProduct.imageUrl && (
              <div className="mt-4 h-40 w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                <img
                  src={viewingProduct.imageUrl}
                  alt={viewingProduct.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-slate-500">Current Stock</p>
                <p className="mt-1 font-mono text-base font-bold text-slate-900 tabular-nums">
                  {viewingProduct.stockQuantity} {viewingProduct.unit}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-slate-500">Minimum Level</p>
                <p className="mt-1 font-mono text-base font-bold text-slate-900 tabular-nums">
                  {viewingProduct.minStockLevel} {viewingProduct.unit}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-slate-500">Purchase / Selling</p>
                <p className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {formatINR(viewingProduct.purchasePrice)} / {formatINR(viewingProduct.sellingPrice)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-slate-500">Inventory Valuation</p>
                <p className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {formatINR(viewingProduct.stockQuantity * viewingProduct.purchasePrice, true)}
                </p>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-600 space-y-1">
              <p>
                Supplier:{' '}
                <span className="font-medium text-slate-900">
                  {viewingProduct.supplierName || 'Not specified'}
                </span>
              </p>
              <p>
                Total Units Sold:{' '}
                <span className="font-mono font-medium text-slate-900 tabular-nums">
                  {viewingProduct.totalUnitsSold || 0} {viewingProduct.unit}
                </span>
              </p>
              <p>Last Updated: {formatDateTime(viewingProduct.updatedAt)}</p>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-xs font-medium text-slate-700 mb-2">Quick Stock Addition</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, Number(e.target.value)))}
                  className="w-28 rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm tabular-nums focus:border-indigo-600 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={restockLoading}
                  onClick={handleQuickRestock}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {restockLoading ? 'Updating...' : `Add +${restockQty} ${viewingProduct.unit}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="font-display text-base font-bold text-slate-900">Delete Product?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Remove <span className="font-semibold text-slate-900">{deletingProduct.name}</span>{' '}
              ({deletingProduct.sku}) from your inventory catalog? Past sales invoices will remain
              intact.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
