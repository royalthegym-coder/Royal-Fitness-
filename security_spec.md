# Security Specification & "Dirty Dozen" Adversarial Attack Audit

## 1. Core Data Invariants & Zero-Trust Constraints

1. **Role Immobility & Non-Self-Assignment**:
   - An authenticated user (`request.auth.uid`) can NEVER assign themselves `super_admin` or `admin` roles upon account creation.
   - An authenticated user can NEVER modify their existing `role` field.
   - Only verified Super Admins (only `royalthegym@gmail.com` with `email_verified == true`) can assign or escalate roles.

2. **Billing & Invoice Tamper-Proofing**:
   - Only verified Gym Administrators or Super Admins can transition an invoice or payment to `status: "Paid"` or `status: "Confirmed"`.
   - Regular members may only create invoices with `status: "Pending"` or transition them to `status: "Verification Pending"` with payment reference metadata. Any client-side write attempting to directly mark an invoice as `"Paid"` must immediately return `PERMISSION_DENIED`.

3. **Global Franchise & Tenant Governance Isolation**:
   - Documents in `tenants/{tenantId}` and `system_policies/{policyId}` are strictly protected against modification by non-administrative users.
   - System policies controlling global lock bypass or grace periods can ONLY be updated by Super Admins.

4. **Immutable Audit Trails**:
   - Security audit logs (`security_audit`), admin logs (`admin_activity_logs`), and force-unlock records (`force_unlock_audit_logs`) are strictly append-only. No updates (`allow update: if false`) are ever permitted. Only Super Admins may prune records.

5. **Path Hardening & Anti-Denial-of-Wallet**:
   - All document IDs must adhere to `isValidId()` (size <= 128 characters, matching `^[a-zA-Z0-9_\-]+$`).
   - String payloads are bound with strict `.size()` constraints preventing storage bloat or memory exhaustion.

---

## 2. The "Dirty Dozen" Adversarial Payloads

### Payload 1: Self-Promoted Super Admin Exploitation
- **Target Path**: `users/attacker_uid_123`
- **Method**: `UPDATE`
- **Caller**: `auth.uid = "attacker_uid_123"` (Standard Member)
- **Malicious Payload**:
```json
{
  "role": "super_admin"
}
```
- **Expected Result**: `PERMISSION_DENIED` (Cannot alter role field).

### Payload 2: Self-Assigned Admin Registration
- **Target Path**: `users/attacker_uid_456`
- **Method**: `CREATE`
- **Caller**: `auth.uid = "attacker_uid_456"` (New User)
- **Malicious Payload**:
```json
{
  "uid": "attacker_uid_456",
  "name": "Attacker",
  "email": "attacker@evil.com",
  "role": "admin",
  "status": "Active",
  "createdAt": "2026-11-06T10:00:00.000Z"
}
```
- **Expected Result**: `PERMISSION_DENIED` (New users can only register with `role: "member"`).

### Payload 3: Account Force-Unlock Privilege Escalation
- **Target Path**: `users/attacker_uid_123`
- **Method**: `UPDATE`
- **Caller**: `auth.uid = "attacker_uid_123"`
- **Malicious Payload**:
```json
{
  "forceUnlocked": true,
  "accountLocked": false
}
```
- **Expected Result**: `PERMISSION_DENIED` (Lock and force-unlock states are immutable for non-admins).

### Payload 4: Fake Paid Bill Attack
- **Target Path**: `invoices/inv_9999`
- **Method**: `UPDATE`
- **Caller**: `auth.uid = "member_777"`
- **Malicious Payload**:
```json
{
  "status": "Paid"
}
```
- **Expected Result**: `PERMISSION_DENIED` (Members cannot transition status to 'Paid').

### Payload 5: Zero-Cost Paid Invoice Injection
- **Target Path**: `invoices/inv_forged_888`
- **Method**: `CREATE`
- **Caller**: `auth.uid = "member_777"`
- **Malicious Payload**:
```json
{
  "id": 888,
  "memberId": "member_777",
  "memberName": "Fraudulent User",
  "packageId": 103,
  "packageName": "Lifetime Elite Pass",
  "amount": 0,
  "date": "2026-11-06",
  "status": "Paid"
}
```
- **Expected Result**: `PERMISSION_DENIED` (Members cannot create invoices with status 'Paid').

### Payload 6: Tenant Franchise Account Hijack
- **Target Path**: `tenants/franchise_alpha`
- **Method**: `UPDATE`
- **Caller**: `auth.uid = "member_777"`
- **Malicious Payload**:
```json
{
  "account_locked": false,
  "owner_email": "attacker@evil.com"
}
```
- **Expected Result**: `PERMISSION_DENIED` (Tenant modifications require Admin/SuperAdmin clearance).

### Payload 7: Global Policy System Lockdown Bypass
- **Target Path**: `system_policies/global_expiration`
- **Method**: `UPDATE`
- **Caller**: `auth.uid = "gym_admin_456"` (Non-SuperAdmin)
- **Malicious Payload**:
```json
{
  "id": "global_expiration",
  "expirationMode": "bypass_all",
  "gracePeriodDays": 365,
  "forceUnlockAllAccounts": true
}
```
- **Expected Result**: `PERMISSION_DENIED` (Only Super Admin can update global policies).

### Payload 8: Payment Confirmation Forgery
- **Target Path**: `payments/pay_spoofed_001`
- **Method**: `UPDATE`
- **Caller**: `auth.uid = "member_777"`
- **Malicious Payload**:
```json
{
  "status": "Confirmed",
  "verifiedBy": "Self"
}
```
- **Expected Result**: `PERMISSION_DENIED` (Only admins can confirm payments).

### Payload 9: Member Lock Status Bypass
- **Target Path**: `members/777`
- **Method**: `UPDATE`
- **Caller**: `auth.uid = "777"`
- **Malicious Payload**:
```json
{
  "accountLocked": false,
  "forceUnlocked": true,
  "expiryDate": "2030-01-01"
}
```
- **Expected Result**: `PERMISSION_DENIED` (Members cannot edit lock/unlock or expiration attributes).

### Payload 10: Audit Trail Tampering
- **Target Path**: `admin_activity_logs/log_critical_1`
- **Method**: `UPDATE` or `DELETE`
- **Caller**: `auth.uid = "admin_123"`
- **Malicious Payload**:
```json
{
  "action": "CLEARED_BY_USER",
  "details": "Evidence erased"
}
```
- **Expected Result**: `PERMISSION_DENIED` (Audit logs are immutable).

### Payload 11: Document ID Poisoning Attack
- **Target Path**: `users/A${'a'.repeat(2000)}Z`
- **Method**: `GET` or `SET`
- **Caller**: Any
- **Expected Result**: `PERMISSION_DENIED` (DocId exceeds 128 chars limit).

### Payload 12: Blanket PII User Directory Scraping
- **Target Path**: `users`
- **Method**: `LIST` (collection query)
- **Caller**: `auth.uid = "member_777"` (Standard Member)
- **Expected Result**: `PERMISSION_DENIED` (Only Admins may list the entire users collection).

---

## 3. Canonical 12-Module Gym OS Security Invariants

1. **Profiles Biometric & Role Isolation (`profiles/{profileId}`)**:
   - Members can only read their own profile (`auth.uid == profileId`) or staff (`owner`, `receptionist`, `trainer`) may read assigned/managed profiles.
   - Members can NEVER elevate `role` or toggle `biometric_access_enabled = true` on client writes; only `subscriptions` trigger sync or Admin/Owner writes may activate biometric turnstile entry.

2. **Subscriptions & Payment Ledger Tamper-Proofing (`subscriptions/{subId}`, `payment_transactions/{txId}`)**:
   - Only Owner/SuperAdmin/Receptionist may write `subscriptions` or `payment_transactions` with `status: 'active'` or `payment_status: 'captured'`.
   - Members can read only their own `subscriptions` and `payment_transactions` (`member_id == auth.uid`).

3. **Workout, Nutrition & BCA Telemetry Isolation**:
   - Members can manage their own `workout_session_logs`, `daily_meal_logs`, and `body_metrics_logs` (`member_id == auth.uid`), while staff (`owner`, `trainer`, `receptionist`) can read/review.
   - `exercises_master` and active `membership_plans` are read-only catalogs for members and writable only by authorized staff/owners.

4. **CRM Leads & Automation Logs (`gym_leads/{leadId}`, `automation_logs/{logId}`)**:
   - Strictly restricted to gym staff (`owner`, `receptionist`, `trainer`) and Super Admins. Standard members cannot list or modify CRM leads or automation logs (`PERMISSION_DENIED`).

