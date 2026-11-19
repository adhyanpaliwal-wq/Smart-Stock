import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { truncateStr } from '../lib/validation';
import type {
  BusinessProfile,
  PaymentMethod,
  Product,
  RegistrationMetadata,
  Sale,
  SaleItem,
  UserProfile,
} from '../types';

export interface ProductInput {
  name: string;
  sku: string;
  category: string;
  stockQuantity: number;
  minStockLevel: number;
  purchasePrice: number;
  sellingPrice: number;
  supplierName: string;
  unit: string;
  imageUrl?: string;
}

export interface SaleCartLine {
  productId: string;
  quantity: number;
}

export interface CreateSaleInput {
  customerName: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  lines: SaleCartLine[];
}

export async function provisionUserProfileIfMissing(
  user: User,
  meta?: RegistrationMetadata | null
): Promise<{ userProfile: UserProfile; businessProfile: BusinessProfile }> {
  const userRef = doc(db, 'users', user.uid);
  const businessRef = doc(db, 'users', user.uid, 'business', 'primary');

  try {
    const [userSnap, businessSnap] = await Promise.all([getDoc(userRef), getDoc(businessRef)]);

    if (userSnap.exists() && businessSnap.exists()) {
      return {
        userProfile: userSnap.data() as UserProfile,
        businessProfile: businessSnap.data() as BusinessProfile,
      };
    }

    const rawName = meta?.fullName || user.displayName || user.email?.split('@')[0] || 'Shop Owner';
    const fullName = truncateStr(rawName, 100).length >= 2 ? truncateStr(rawName, 100) : 'Shop Owner';

    const rawBusiness = meta?.businessName || `${fullName}'s Store`;
    const businessName =
      truncateStr(rawBusiness, 120).length >= 2 ? truncateStr(rawBusiness, 120) : 'My Retail Store';

    const email = truncateStr(user.email || 'merchant@smartstock.in', 160);
    const mobileNumber = truncateStr(meta?.mobileNumber || user.phoneNumber || '', 20);
    const trialEndsAt = Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

    const batch = writeBatch(db);

    if (!userSnap.exists()) {
      batch.set(userRef, {
        uid: user.uid,
        fullName,
        businessName,
        email,
        mobileNumber,
        plan: 'free_trial',
        trialEndsAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    if (!businessSnap.exists()) {
      batch.set(businessRef, {
        ownerId: user.uid,
        businessName,
        shopCategory: 'General & Departmental Store',
        phone: mobileNumber,
        email,
        address: '',
        city: '',
        state: '',
        gstin: '',
        currency: 'INR',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    const [createdUser, createdBusiness] = await Promise.all([getDoc(userRef), getDoc(businessRef)]);
    return {
      userProfile: createdUser.data() as UserProfile,
      businessProfile: createdBusiness.data() as BusinessProfile,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function updateUserAndBusinessProfile(
  uid: string,
  input: {
    fullName: string;
    businessName: string;
    shopCategory: string;
    mobileNumber: string;
    address: string;
    city?: string;
    state?: string;
    gstin?: string;
  }
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const businessRef = doc(db, 'users', uid, 'business', 'primary');

  try {
    const batch = writeBatch(db);
    batch.update(userRef, {
      fullName: truncateStr(input.fullName, 100),
      businessName: truncateStr(input.businessName, 120),
      mobileNumber: truncateStr(input.mobileNumber, 20),
      updatedAt: serverTimestamp(),
    });
    batch.update(businessRef, {
      businessName: truncateStr(input.businessName, 120),
      shopCategory: truncateStr(input.shopCategory, 60),
      phone: truncateStr(input.mobileNumber, 20),
      address: truncateStr(input.address, 250),
      city: truncateStr(input.city, 80),
      state: truncateStr(input.state, 80),
      gstin: truncateStr(input.gstin, 20),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function addProduct(uid: string, input: ProductInput): Promise<string> {
  const productsCol = collection(db, 'users', uid, 'products');
  const productRef = doc(productsCol);
  const txRef = doc(collection(db, 'users', uid, 'transactions'));

  const stockQty = Math.max(0, Number(input.stockQuantity) || 0);
  const minLevel = Math.max(0, Number(input.minStockLevel) || 0);
  const purchasePrice = Math.max(0, Number(input.purchasePrice) || 0);
  const sellingPrice = Math.max(0, Number(input.sellingPrice) || 0);
  const name = truncateStr(input.name, 120);
  const sku = truncateStr(input.sku, 40);

  try {
    const batch = writeBatch(db);

    batch.set(productRef, {
      ownerId: uid,
      name,
      sku,
      category: truncateStr(input.category, 60),
      stockQuantity: stockQty,
      minStockLevel: minLevel,
      purchasePrice,
      sellingPrice,
      supplierName: truncateStr(input.supplierName, 100),
      unit: truncateStr(input.unit, 24) || 'pcs',
      imageUrl: truncateStr(input.imageUrl, 500),
      totalUnitsSold: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (stockQty > 0) {
      batch.set(txRef, {
        ownerId: uid,
        type: 'initial',
        productId: productRef.id,
        productName: name,
        quantityDelta: stockQty,
        amount: Number((stockQty * purchasePrice).toFixed(2)),
        referenceId: productRef.id,
        note: `Opening stock added (${sku})`,
        createdAt: serverTimestamp(),
      });
    }

    if (stockQty <= minLevel) {
      const notifRef = doc(collection(db, 'users', uid, 'notifications'));
      const suggestedQty = Math.max(minLevel * 2 - stockQty, 10);
      batch.set(notifRef, {
        ownerId: uid,
        type: stockQty === 0 ? 'out_of_stock' : 'low_stock',
        productId: productRef.id,
        productName: name,
        currentStock: stockQty,
        minStockLevel: minLevel,
        suggestedReorderQty: suggestedQty,
        message:
          stockQty === 0
            ? `${name} is out of stock (0 ${input.unit} remaining).`
            : `${name} is low on stock (${stockQty} ${input.unit} vs min ${minLevel}).`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
    return productRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${uid}/products/${productRef.id}`);
  }
}

export async function updateProduct(
  uid: string,
  productId: string,
  input: ProductInput
): Promise<void> {
  const productRef = doc(db, 'users', uid, 'products', productId);

  try {
    await updateDoc(productRef, {
      name: truncateStr(input.name, 120),
      sku: truncateStr(input.sku, 40),
      category: truncateStr(input.category, 60),
      stockQuantity: Math.max(0, Number(input.stockQuantity) || 0),
      minStockLevel: Math.max(0, Number(input.minStockLevel) || 0),
      purchasePrice: Math.max(0, Number(input.purchasePrice) || 0),
      sellingPrice: Math.max(0, Number(input.sellingPrice) || 0),
      supplierName: truncateStr(input.supplierName, 100),
      unit: truncateStr(input.unit, 24) || 'pcs',
      imageUrl: truncateStr(input.imageUrl, 500),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/products/${productId}`);
  }
}

export async function restockProduct(
  uid: string,
  productId: string,
  addQuantity: number,
  note?: string
): Promise<void> {
  if (addQuantity <= 0) {
    throw new Error('Restock quantity must be greater than zero.');
  }

  const productRef = doc(db, 'users', uid, 'products', productId);
  const txRef = doc(collection(db, 'users', uid, 'transactions'));
  const notifRef = doc(collection(db, 'users', uid, 'notifications'));

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(productRef);
      if (!snap.exists()) {
        throw new Error('Product no longer exists.');
      }
      const data = snap.data() as Omit<Product, 'id'>;
      const newStock = data.stockQuantity + addQuantity;

      transaction.update(productRef, {
        stockQuantity: newStock,
        updatedAt: serverTimestamp(),
      });

      transaction.set(txRef, {
        ownerId: uid,
        type: 'restock',
        productId,
        productName: truncateStr(data.name, 120),
        quantityDelta: addQuantity,
        amount: Number((addQuantity * data.purchasePrice).toFixed(2)),
        referenceId: productId,
        note: truncateStr(note || `Restocked +${addQuantity} ${data.unit}`, 200),
        createdAt: serverTimestamp(),
      });

      transaction.set(notifRef, {
        ownerId: uid,
        type: 'reorder_placed',
        productId,
        productName: truncateStr(data.name, 120),
        currentStock: newStock,
        minStockLevel: data.minStockLevel,
        suggestedReorderQty: 0,
        message: `Restocked ${data.name} by +${addQuantity} ${data.unit}. New stock: ${newStock}.`,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Product no longer exists')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/products/${productId}`);
  }
}

export async function deleteProduct(uid: string, productId: string): Promise<void> {
  const productRef = doc(db, 'users', uid, 'products', productId);
  try {
    await deleteDoc(productRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/products/${productId}`);
  }
}

export async function completeSaleTransaction(
  uid: string,
  input: CreateSaleInput
): Promise<Sale> {
  if (input.lines.length === 0 || input.lines.length > 50) {
    throw new Error('A sale must include between 1 and 50 line items.');
  }

  const saleRef = doc(collection(db, 'users', uid, 'sales'));
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  try {
    let createdSalePayload: Omit<Sale, 'id' | 'createdAt'> | null = null;

    await runTransaction(db, async (transaction) => {
      // Phase 1: ALL reads first (Firestore transaction requirement)
      const productRefs = input.lines.map((line) => doc(db, 'users', uid, 'products', line.productId));
      const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));

      const saleItems: SaleItem[] = [];
      let totalAmount = 0;
      let totalCost = 0;

      const productUpdates: Array<{
        ref: typeof productRefs[number];
        newStock: number;
        newSold: number;
        productName: string;
        minStockLevel: number;
        unit: string;
        qty: number;
        lineTotal: number;
      }> = [];

      for (let i = 0; i < input.lines.length; i++) {
        const line = input.lines[i];
        const snap = productSnaps[i];
        if (!snap.exists()) {
          throw new Error('One of the selected products no longer exists.');
        }

        const prod = snap.data() as Omit<Product, 'id'>;
        if (line.quantity <= 0) {
          throw new Error(`Invalid quantity for ${prod.name}.`);
        }
        if (prod.stockQuantity < line.quantity) {
          throw new Error(
            `Insufficient stock for ${prod.name}. Available: ${prod.stockQuantity} ${prod.unit}, Requested: ${line.quantity}.`
          );
        }

        const lineTotal = Number((prod.sellingPrice * line.quantity).toFixed(2));
        const lineCost = Number((prod.purchasePrice * line.quantity).toFixed(2));
        const lineProfit = Number((lineTotal - lineCost).toFixed(2));

        totalAmount = Number((totalAmount + lineTotal).toFixed(2));
        totalCost = Number((totalCost + lineCost).toFixed(2));

        saleItems.push({
          productId: snap.id,
          productName: truncateStr(prod.name, 120),
          sku: truncateStr(prod.sku, 40),
          quantity: line.quantity,
          unitPurchasePrice: prod.purchasePrice,
          unitSellingPrice: prod.sellingPrice,
          lineTotal,
          lineProfit,
        });

        productUpdates.push({
          ref: productRefs[i],
          newStock: prod.stockQuantity - line.quantity,
          newSold: (prod.totalUnitsSold || 0) + line.quantity,
          productName: prod.name,
          minStockLevel: prod.minStockLevel,
          unit: prod.unit,
          qty: line.quantity,
          lineTotal,
        });
      }

      const grossProfit = Number((totalAmount - totalCost).toFixed(2));

      createdSalePayload = {
        ownerId: uid,
        invoiceNumber,
        customerName: truncateStr(input.customerName || 'Walk-in Customer', 100),
        customerPhone: truncateStr(input.customerPhone, 20),
        paymentMethod: input.paymentMethod,
        items: saleItems,
        itemCount: saleItems.length,
        totalAmount,
        totalCost,
        grossProfit,
        status: 'completed',
      };

      // Phase 2: ALL writes after reads
      transaction.set(saleRef, {
        ...createdSalePayload,
        createdAt: serverTimestamp(),
      });

      for (const upd of productUpdates) {
        transaction.update(upd.ref, {
          stockQuantity: upd.newStock,
          totalUnitsSold: upd.newSold,
          updatedAt: serverTimestamp(),
        });

        const txRef = doc(collection(db, 'users', uid, 'transactions'));
        transaction.set(txRef, {
          ownerId: uid,
          type: 'sale',
          productId: upd.ref.id,
          productName: truncateStr(upd.productName, 120),
          quantityDelta: -upd.qty,
          amount: upd.lineTotal,
          referenceId: saleRef.id,
          note: `Sold ${upd.qty} ${upd.unit} · ${invoiceNumber}`,
          createdAt: serverTimestamp(),
        });

        if (upd.newStock <= upd.minStockLevel) {
          const notifRef = doc(collection(db, 'users', uid, 'notifications'));
          const suggestedQty = Math.max(upd.minStockLevel * 2 - upd.newStock, 10);
          transaction.set(notifRef, {
            ownerId: uid,
            type: upd.newStock === 0 ? 'out_of_stock' : 'low_stock',
            productId: upd.ref.id,
            productName: truncateStr(upd.productName, 120),
            currentStock: upd.newStock,
            minStockLevel: upd.minStockLevel,
            suggestedReorderQty: suggestedQty,
            message:
              upd.newStock === 0
                ? `${upd.productName} hit 0 stock after ${invoiceNumber}.`
                : `${upd.productName} dropped to ${upd.newStock} ${upd.unit} (min ${upd.minStockLevel}).`,
            isRead: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    });

    if (!createdSalePayload) {
      throw new Error('Failed to create sale record.');
    }

    return {
      id: saleRef.id,
      ...(createdSalePayload as Omit<Sale, 'id' | 'createdAt'>),
      createdAt: Timestamp.now(),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith('Insufficient stock') ||
        error.message.includes('Invalid quantity') ||
        error.message.includes('no longer exists'))
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/sales/${saleRef.id}`);
  }
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'notifications', notificationId);
  try {
    await updateDoc(ref, { isRead: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}/notifications/${notificationId}`);
  }
}

export async function deleteNotification(uid: string, notificationId: string): Promise<void> {
  const ref = doc(db, 'users', uid, 'notifications', notificationId);
  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/notifications/${notificationId}`);
  }
}
