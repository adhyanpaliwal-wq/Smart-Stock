/**
 * Phase 0 Security Rules Verification Spec for SmartStock
 * Verifies that all "Dirty Dozen" adversarial payloads are rejected with PERMISSION_DENIED.
 * Intended to be executed against the Firebase Rules Unit Testing emulator when available.
 */
export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const dirtyDozenCases: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Cross-Tenant Product Read',
    operation: 'get',
    path: 'users/userA/products/prod1',
    auth: { uid: 'userB', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Cross-Tenant Sales List',
    operation: 'list',
    path: 'users/userA/sales',
    auth: { uid: 'userB', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Email Product Create',
    operation: 'create',
    path: 'users/userA/products/prod1',
    auth: { uid: 'userA', email_verified: false },
    payload: { ownerId: 'userA', name: 'Basmati Rice', stockQuantity: 10 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Owner Spoofing on Create',
    operation: 'create',
    path: 'users/userB/products/prod1',
    auth: { uid: 'userB', email_verified: true },
    payload: { ownerId: 'userA', name: 'Spoofed Item' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow Field Injection',
    operation: 'create',
    path: 'users/userA/products/prod1',
    auth: { uid: 'userA', email_verified: true },
    payload: { ownerId: 'userA', name: 'Item', isVerified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Negative Stock Write',
    operation: 'update',
    path: 'users/userA/products/prod1',
    auth: { uid: 'userA', email_verified: true },
    payload: { stockQuantity: -5 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Client Timestamp Forgery',
    operation: 'create',
    path: 'users/userA/sales/sale1',
    auth: { uid: 'userA', email_verified: true },
    payload: { ownerId: 'userA', createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Immutable OwnerId Update',
    operation: 'update',
    path: 'users/userA/products/prod1',
    auth: { uid: 'userA', email_verified: true },
    payload: { ownerId: 'userB' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'ID Poisoning Long Document ID',
    operation: 'create',
    path: `users/userA/products/${'a'.repeat(200)}`,
    auth: { uid: 'userA', email_verified: true },
    payload: { ownerId: 'userA', name: 'Poison' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Completed Sale Tampering',
    operation: 'update',
    path: 'users/userA/sales/sale1',
    auth: { uid: 'userA', email_verified: true },
    payload: { totalAmount: 1 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Empty Sale Items Array',
    operation: 'create',
    path: 'users/userA/sales/sale2',
    auth: { uid: 'userA', email_verified: true },
    payload: { ownerId: 'userA', items: [] },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-Assigned Plan Escalation',
    operation: 'update',
    path: 'users/userA',
    auth: { uid: 'userA', email_verified: true },
    payload: { plan: 'premium' },
    expected: 'PERMISSION_DENIED',
  },
];
