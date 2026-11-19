# SmartStock Firestore Security Specification (Phase 0)

## 1. Data Invariants

1. **Strict Tenant Isolation**: Every document under `/users/{userId}` and its subcollections (`business`, `products`, `sales`, `transactions`, `notifications`) belongs exclusively to `userId`. Cross-user reads, queries, writes, or deletes are strictly denied.
2. **Verified Identity & Ownership**: All mutations require `request.auth != null`, `request.auth.token.email_verified == true`, `request.auth.uid == userId`, and matching `ownerId == request.auth.uid` (or `uid == request.auth.uid` on `users/{userId}`).
3. **Zero Shadow Fields**: Every create operation enforces exact required + allowed keys (`hasAll` + `hasOnly`). Every update operation restricts mutated keys using `affectedKeys().hasOnly(...)` per named action.
4. **Non-Negative Stock & Price Integrity**: Product `stockQuantity`, `minStockLevel`, `purchasePrice`, `sellingPrice`, and `totalUnitsSold` must always be numbers `>= 0`. Negative stock is forbidden at the database rule layer.
5. **Immutable Audit & Sale Records**: Completed sales (`sales/{saleId}`) and ledger entries (`transactions/{transactionId}`) are append-only financial records and cannot be mutated or forged by clients once created (`allow update: if false`).
6. **Temporal Integrity**: All `createdAt` fields must equal `request.time` on creation and remain immutable thereafter. All mutable documents require `updatedAt == request.time` on update.
7. **Bounded Payloads**: All strings, IDs (`^[a-zA-Z0-9_\-]+$`, max 128 chars), and sale `items` arrays (1 to 50 items) are strictly bounded to prevent resource exhaustion.

## 2. The "Dirty Dozen" Attack Payloads

1. **Cross-Tenant Read**: User B attempts `get` on `/users/userA/products/prod1` -> `PERMISSION_DENIED`.
2. **Cross-Tenant List Scraping**: User B attempts `list` on `/users/userA/sales` -> `PERMISSION_DENIED`.
3. **Unverified Email Write**: User A with `email_verified: false` attempts to create `/users/userA/products/prod1` -> `PERMISSION_DENIED`.
4. **Owner Spoofing on Create**: User B creates `/users/userB/products/prod1` with `ownerId: "userA"` -> `PERMISSION_DENIED`.
5. **Shadow Field Injection**: User A creates product with extra ghost field `isVerified: true` or `adminOverride: true` -> `PERMISSION_DENIED`.
6. **Negative Stock Write**: User A updates product with `stockQuantity: -5` -> `PERMISSION_DENIED`.
7. **Client Timestamp Forgery**: User A creates a sale with backdated `createdAt: "2020-01-01T00:00:00Z"` instead of `request.time` -> `PERMISSION_DENIED`.
8. **Immutable Field Tampering**: User A updates product attempting to change `ownerId` or `createdAt` -> `PERMISSION_DENIED`.
9. **ID Poisoning**: User A writes to `/users/userA/products/../../admin_hack` or a 500-char ID -> `PERMISSION_DENIED`.
10. **Sale Tampering After Completion**: User A attempts to update `totalAmount` on an existing `/users/userA/sales/sale1` -> `PERMISSION_DENIED`.
11. **Unbounded Sale Array Attack**: User A creates a sale with `items: []` (0 items) or 51+ items -> `PERMISSION_DENIED`.
12. **Self-Assigned Subscription Escalation**: User A updates `/users/userA` attempting to set `plan: "premium"` without an authorized billing action -> `PERMISSION_DENIED`.
