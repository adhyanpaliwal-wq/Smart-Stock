import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { isSameLocalDay, isSameLocalMonth, toDate } from '../lib/formatters';
import { useAuth } from './AuthContext';
import type { AlertNotification, InventoryTransaction, Product, Sale } from '../types';

interface DashboardMetrics {
  totalProducts: number;
  totalInventoryValue: number;
  todaysSales: number;
  todaysSalesCount: number;
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  monthlyRevenue: number;
  totalRevenue: number;
  totalGrossProfit: number;
}

interface DataContextValue {
  products: Product[];
  sales: Sale[];
  transactions: InventoryTransaction[];
  notifications: AlertNotification[];
  unreadNotificationsCount: number;
  loading: boolean;
  metrics: DashboardMetrics;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { authReady, user, userProfile } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authReady || !user || !user.emailVerified || !userProfile) {
      setProducts([]);
      setSales([]);
      setTransactions([]);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const uid = user.uid;
    let loadedCount = 0;
    const markLoaded = () => {
      loadedCount += 1;
      if (loadedCount >= 4) setLoading(false);
    };

    const productsQuery = query(
      collection(db, 'users', uid, 'products'),
      where('ownerId', '==', uid)
    );

    const salesQuery = query(
      collection(db, 'users', uid, 'sales'),
      where('ownerId', '==', uid)
    );

    const txQuery = query(
      collection(db, 'users', uid, 'transactions'),
      where('ownerId', '==', uid)
    );

    const notifQuery = query(
      collection(db, 'users', uid, 'notifications'),
      where('ownerId', '==', uid)
    );

    const unsubProducts = onSnapshot(
      productsQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, 'id'>) }));
        list.sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime());
        setProducts(list);
        markLoaded();
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/products`)
    );

    const unsubSales = onSnapshot(
      salesQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Sale, 'id'>) }));
        list.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
        setSales(list);
        markLoaded();
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/sales`)
    );

    const unsubTx = onSnapshot(
      txQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<InventoryTransaction, 'id'>),
        }));
        list.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
        setTransactions(list);
        markLoaded();
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/transactions`)
    );

    const unsubNotif = onSnapshot(
      notifQuery,
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<AlertNotification, 'id'>),
        }));
        list.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
        setNotifications(list);
        markLoaded();
      },
      (error) => handleFirestoreError(error, OperationType.LIST, `users/${uid}/notifications`)
    );

    return () => {
      unsubProducts();
      unsubSales();
      unsubTx();
      unsubNotif();
    };
  }, [authReady, user, userProfile]);

  const metrics = useMemo<DashboardMetrics>(() => {
    const now = new Date();
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.stockQuantity * p.purchasePrice,
      0
    );
    const lowStockProducts = products.filter(
      (p) => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel
    );
    const outOfStockProducts = products.filter((p) => p.stockQuantity === 0);

    let todaysSales = 0;
    let todaysSalesCount = 0;
    let monthlyRevenue = 0;
    let totalRevenue = 0;
    let totalGrossProfit = 0;

    for (const sale of sales) {
      const saleDate = toDate(sale.createdAt);
      totalRevenue += sale.totalAmount;
      totalGrossProfit += sale.grossProfit;
      if (isSameLocalDay(saleDate, now)) {
        todaysSales += sale.totalAmount;
        todaysSalesCount += 1;
      }
      if (isSameLocalMonth(saleDate, now)) {
        monthlyRevenue += sale.totalAmount;
      }
    }

    return {
      totalProducts,
      totalInventoryValue,
      todaysSales,
      todaysSalesCount,
      lowStockProducts,
      outOfStockProducts,
      monthlyRevenue,
      totalRevenue,
      totalGrossProfit,
    };
  }, [products, sales]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  return (
    <DataContext.Provider
      value={{
        products,
        sales,
        transactions,
        notifications,
        unreadNotificationsCount,
        loading,
        metrics,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
