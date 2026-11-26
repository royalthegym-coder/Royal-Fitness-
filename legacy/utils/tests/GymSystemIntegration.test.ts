import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import express from 'express';
import { AddressInfo } from 'net';
import {
  GymRelationalDatabase,
  DEFAULT_GYM_ID,
  verifyPassword,
} from '../../src/backend/gymDatabase';
import { createAuthRouter, issueSessionToken } from '../../src/backend/authMiddleware';
import { createGymApiRouter } from '../../src/backend/gymApiRouter';

function createTempDbPath(tag: string) {
  return path.join(
    os.tmpdir(),
    `gym-system-test-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.json`
  );
}

describe('Complete 16-Module Gym Management ERP — Relational DB, Auth/RBAC & E2E Workflows', () => {
  let dbPath: string;
  let db: GymRelationalDatabase;

  beforeEach(() => {
    dbPath = createTempDbPath('erp');
    db = new GymRelationalDatabase(dbPath);
  });

  afterEach(() => {
    try {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    } catch {
      // ignore cleanup errors
    }
  });

  it('seeds all 8 core tables + all auxiliary tables (including workout_plans & diet_plans) idempotently', () => {
    const first = db.getSnapshot();
    expect(first.gyms.length).toBeGreaterThanOrEqual(1);
    expect(first.users.length).toBeGreaterThanOrEqual(3);
    expect(first.members.length).toBeGreaterThanOrEqual(5);
    expect(first.membership_packages.length).toBeGreaterThanOrEqual(4);
    expect(first.memberships.length).toBeGreaterThanOrEqual(5);
    expect(first.payments.length).toBeGreaterThanOrEqual(4);
    expect(first.attendance.length).toBeGreaterThanOrEqual(2);
    expect(first.expenses.length).toBeGreaterThanOrEqual(3);

    // Auxiliary tables
    expect(first.invoices.length).toBeGreaterThanOrEqual(5);
    expect(first.leads.length).toBeGreaterThanOrEqual(3);
    expect(first.staff.length).toBeGreaterThanOrEqual(4);
    expect(first.offers.length).toBeGreaterThanOrEqual(2);
    expect(first.reviews.length).toBeGreaterThanOrEqual(2);
    expect(first.workout_plans.length).toBeGreaterThanOrEqual(3);
    expect(first.diet_plans.length).toBeGreaterThanOrEqual(2);

    // Calling seedIfEmpty again must be completely idempotent
    db.seedIfEmpty();
    const second = db.getSnapshot();
    expect(second.members.length).toBe(first.members.length);
    expect(second.membership_packages.length).toBe(first.membership_packages.length);
    expect(second.invoices.length).toBe(first.invoices.length);
    expect(second.payments.length).toBe(first.payments.length);
    expect(second.workout_plans.length).toBe(first.workout_plans.length);
    expect(second.diet_plans.length).toBe(first.diet_plans.length);
  });

  it('stores user passwords as salted scrypt hashes, supports authenticateUser, and strips credentials from snapshots', () => {
    const rawUsers = db.getRawUsers(DEFAULT_GYM_ID);
    const owner = rawUsers.find((u) => u.role === 'owner');
    expect(owner).toBeDefined();
    expect(owner!.password_hash).not.toContain('Owner@FitnessFuture#2025');
    expect(owner!.password_salt.length).toBeGreaterThanOrEqual(16);
    expect(verifyPassword('Owner@FitnessFuture#2025', owner!.password_hash, owner!.password_salt)).toBe(true);
    expect(verifyPassword('WrongPassword123', owner!.password_hash, owner!.password_salt)).toBe(false);

    const authOk = db.authenticateUser('owner@fitnessfuture.in', 'Owner@FitnessFuture#2025');
    expect(authOk).not.toBeNull();
    expect(authOk?.role).toBe('owner');
    expect((authOk as any).password_hash).toBeUndefined();

    const authFail = db.authenticateUser('owner@fitnessfuture.in', 'WrongPass');
    expect(authFail).toBeNull();

    // API snapshot must NEVER expose password_hash or password_salt
    const snapshot = db.getSnapshot(DEFAULT_GYM_ID);
    for (const safeUser of snapshot.users) {
      expect((safeUser as any).password_hash).toBeUndefined();
      expect((safeUser as any).password_salt).toBeUndefined();
    }
  });

  it('rolls back entire transaction atomically if integrity constraint is violated', () => {
    const beforeCount = db.getSnapshot().members.length;
    expect(() =>
      db.runTransaction((draft) => {
        draft.members.push({
          ...draft.members[0],
          id: 9999,
          gym_id: 'non_existent_gym_id',
          phone: '9999988888',
        });
      })
    ).toThrow(/Foreign key violation/i);

    expect(db.getSnapshot().members.length).toBe(beforeCount);
  });

  it('Workflow A & B: Scientific Admission creates Member, Membership, Invoice, Payment, converts Lead, and blocks duplicates/missing consent', () => {
    expect(() =>
      db.processAdmission({
        name: 'No Consent User',
        phone: '9123456780',
        package_id: 1,
        digital_consent: false,
      })
    ).toThrow(/Digital consent is required/i);

    expect(() =>
      db.processAdmission({
        name: 'Duplicate Mobile Test',
        phone: '9876543210',
        package_id: 1,
        digital_consent: true,
      })
    ).toThrow(/Duplicate mobile number/i);

    const res = db.processAdmission({
      name: 'Karan Joshi',
      phone: '9829100201',
      email: 'karan.joshi@example.com',
      package_id: 4, // Annual Value Pass: ₹14400
      fitness_goal: 'Muscle Gain',
      training_experience: 'Intermediate',
      height_cm: 175,
      weight_kg: 72,
      digital_consent: true,
      coupon_code: 'FIT20', // 20% off ₹14400 = ₹2880 -> ₹11520
      payment_method: 'UPI',
      payment_amount: 6000,
      lead_id: 1,
      idempotency_key: 'ADM-TEST-KARAN-01',
    });

    expect(res.member.status).toBe('Active');
    expect(res.membership.member_id).toBe(res.member.id);
    expect(res.invoice.discount_amount).toBe(2880);
    expect(res.invoice.total_amount).toBe(11520);
    expect(res.invoice.paid_amount).toBe(6000);
    expect(res.invoice.balance_amount).toBe(5520);
    expect(res.invoice.status).toBe('Partial');
    expect(res.payment?.amount).toBe(6000);

    const convertedLead = db.getSnapshot().leads.find((l) => l.id === 1);
    expect(convertedLead?.status).toBe('Converted');
    expect(convertedLead?.converted_member_id).toBe(res.member.id);
  });

  it('Workflow C & I: Coupon validation, Partial -> Full payment, Idempotency duplicate block, and Refund with audit log', () => {
    const validCoupon = db.validateCoupon({ code: 'FRIEND500', baseAmount: 4050 });
    expect(validCoupon.valid).toBe(true);
    expect(validCoupon.discountAmount).toBe(500);
    expect(validCoupon.finalAmount).toBe(3550);

    const invalidCoupon = db.validateCoupon({ code: 'NONEXISTENT99', baseAmount: 4050 });
    expect(invalidCoupon.valid).toBe(false);

    const pay1 = db.recordPayment({
      invoice_id: 1004,
      amount: 1000,
      method: 'Cash',
      idempotency_key: 'IDEMP-1004-PART-2',
    });
    expect(pay1.invoice.paid_amount).toBe(3000);
    expect(pay1.invoice.balance_amount).toBe(1550);
    expect(pay1.invoice.status).toBe('Partial');

    expect(() =>
      db.recordPayment({
        invoice_id: 1004,
        amount: 1000,
        method: 'Cash',
        idempotency_key: 'IDEMP-1004-PART-2',
      })
    ).toThrow(/Duplicate payment blocked/i);

    const pay2 = db.recordPayment({
      invoice_id: 1004,
      amount: 1550,
      method: 'Bank Transfer',
      idempotency_key: 'IDEMP-1004-FINAL',
    });
    expect(pay2.invoice.balance_amount).toBe(0);
    expect(pay2.invoice.status).toBe('Paid');

    const refunded = db.refundInvoice({
      invoice_id: 1004,
      reason: 'Member relocated',
    });
    expect(refunded.status).toBe('Refunded');
    expect(refunded.refunded_amount).toBe(4550);
    expect(refunded.paid_amount).toBe(0);

    const audit = db.getSnapshot().audit_logs.find((a) => a.action === 'INVOICE_REFUNDED');
    expect(audit).toBeDefined();
  });

  it('Workflow D: QR Attendance grants Active member, prevents duplicate check-in, denies Expired member, and supports Check-Out', () => {
    const checkIn = db.checkInMember({
      qr_payload: `GYM-QR:${DEFAULT_GYM_ID}:101`,
      zone: 'Strength',
      method: 'QR',
    });
    expect(checkIn.granted).toBe(true);
    expect(checkIn.record.status).toBe('Checked In');

    expect(() =>
      db.checkInMember({
        qr_payload: `GYM-QR:${DEFAULT_GYM_ID}:101`,
        zone: 'Strength',
      })
    ).toThrow(/already checked in/i);

    const checkedOut = db.checkOutMember(checkIn.record.id);
    expect(checkedOut.status).toBe('Checked Out');
    expect(checkedOut.check_out_time).toBeTruthy();
    expect(checkedOut.duration_minutes).toBeGreaterThanOrEqual(1);

    const denied = db.checkInMember({
      qr_payload: `GYM-QR:${DEFAULT_GYM_ID}:103`,
      zone: 'Main Floor',
    });
    expect(denied.granted).toBe(false);
    expect(denied.record.access_granted).toBe(false);
    expect(denied.record.status).toBe('Denied');
    expect(denied.reason).toMatch(/expired/i);
  });

  it('Workflow E: Expired member renewal updates membership, extends expiry, records payment, and restores QR access', () => {
    // Member #103 (Rohan Mehta) is Expired in seed data
    const renewed = db.renewMembership({
      member_id: 103,
      package_id: 2, // Quarterly Transformation ₹4050
      payment_method: 'UPI',
      payment_amount: 4050,
      idempotency_key: 'RENEW-TEST-103',
    });

    expect(renewed.member.status).toBe('Active');
    expect(renewed.member.expiry_date > new Date().toISOString().split('T')[0]).toBe(true);
    expect(renewed.invoice.status).toBe('Paid');
    expect(renewed.payment?.amount).toBe(4050);

    // Previously denied expired member should now be GRANTED QR check-in
    const postRenewalCheckIn = db.checkInMember({
      qr_payload: `GYM-QR:${DEFAULT_GYM_ID}:103`,
      zone: 'Main Floor',
    });
    expect(postRenewalCheckIn.granted).toBe(true);
  });

  it('Logs honest WhatsApp failure status when WhatsApp Business API credentials are not connected', () => {
    const log = db.logWhatsAppAttempt({
      gym_id: DEFAULT_GYM_ID,
      recipient_name: 'Aarav Sharma',
      recipient_phone: '9876543210',
      template_name: 'expiry_reminder',
      message_preview: 'Renewal reminder',
      status: 'Failed - API Not Connected',
      error_message: 'WhatsApp Business API credentials are not configured.',
    });
    expect(log.status).toBe('Failed - API Not Connected');
    const saved = db.getSnapshot().whatsapp_logs.find((w) => w.id === log.id);
    expect(saved).toBeDefined();
  });

  it('Auth, RBAC, Tenant Isolation & Full 16-Module REST CRUD with Reload Persistence', async () => {
    const app = express();
    app.use(express.json());
    app.use('/api/auth', createAuthRouter(db));
    app.use('/api/gym', createGymApiRouter(db));

    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    try {
      const port = (server.address() as AddressInfo).port;
      const root = `http://127.0.0.1:${port}`;
      const base = `${root}/api/gym`;

      // 1. Login as Owner -> receives signed Bearer token
      const loginRes = await fetch(`${root}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@fitnessfuture.in',
          password: 'Owner@FitnessFuture#2025',
        }),
      });
      expect(loginRes.status).toBe(200);
      const loginJson = await loginRes.json();
      expect(loginJson.success).toBe(true);
      expect(typeof loginJson.token).toBe('string');
      const ownerToken: string = loginJson.token;

      // 2. GET /api/auth/me with valid token -> 200; tampered token -> 401
      const meRes = await fetch(`${root}/api/auth/me`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      expect(meRes.status).toBe(200);
      const meJson = await meRes.json();
      expect(meJson.user.role).toBe('owner');

      const badTokenRes = await fetch(`${root}/api/auth/me`, {
        headers: { Authorization: 'Bearer tampered.invalid.token' },
      });
      expect(badTokenRes.status).toBe(401);

      // 3. RBAC enforcement: Trainer token cannot refund invoices, delete expenses, or create backups (403)
      const trainerToken = issueSessionToken({
        userId: 'usr-trainer-1',
        email: 'trainer@fitnessfuture.in',
        name: 'Vikram Singh',
        role: 'trainer',
        gym_id: DEFAULT_GYM_ID,
      }).token;

      const trainerRefundRes = await fetch(`${base}/invoices/1001/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${trainerToken}`,
        },
        body: JSON.stringify({ reason: 'Unauthorized attempt' }),
      });
      expect(trainerRefundRes.status).toBe(403);

      const trainerExpenseDelRes = await fetch(`${base}/expenses/1`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(trainerExpenseDelRes.status).toBe(403);

      const trainerBackupRes = await fetch(`${base}/backup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(trainerBackupRes.status).toBe(403);

      // 4. Tenant Isolation: non-owner requesting another gym_id -> 403
      const crossTenantRes = await fetch(`${base}/bootstrap?gym_id=other_gym_999`, {
        headers: { Authorization: `Bearer ${trainerToken}` },
      });
      expect(crossTenantRes.status).toBe(403);

      const ownerHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      };

      // 5. GET /bootstrap & GET /dashboard-summary
      const bootRes = await fetch(`${base}/bootstrap`, { headers: ownerHeaders });
      expect(bootRes.status).toBe(200);
      const bootJson = await bootRes.json();
      expect(bootJson.core_tables).toHaveLength(8);
      expect(bootJson.data.workout_plans.length).toBeGreaterThanOrEqual(3);
      expect(bootJson.data.diet_plans.length).toBeGreaterThanOrEqual(2);

      const summaryRes = await fetch(`${base}/dashboard-summary`, { headers: ownerHeaders });
      expect(summaryRes.status).toBe(200);
      const summaryJson = await summaryRes.json();
      expect(summaryJson.summary.totalMembers).toBeGreaterThanOrEqual(5);
      expect(summaryJson.summary.totalRevenue).toBeGreaterThan(0);

      // 6. CRUD across Modules: Staff, Workout Plans, Diet Plans, Expenses, Offers, Reviews, Leads + Conversion
      const staffRes = await fetch(`${base}/staff`, {
        method: 'POST',
        headers: ownerHeaders,
        body: JSON.stringify({
          name: 'Coach Devika Nair',
          role: 'Trainer',
          phone: '9829887766',
          email: 'devika@fitnessfuture.in',
          salary: 38000,
          specialization: 'Mobility & Core',
        }),
      });
      expect(staffRes.status).toBe(201);
      const staffId = (await staffRes.json()).staff.id;

      const workoutRes = await fetch(`${base}/workout-plans`, {
        method: 'POST',
        headers: ownerHeaders,
        body: JSON.stringify({
          name: 'Athletic Conditioning 5x5',
          category: 'Fitness',
          level: 'Intermediate',
          duration: '50 mins',
          frequency: '4 Days / Week',
          main_workout: [{ name: 'Back Squat', sets: '5', reps: '5' }],
        }),
      });
      expect(workoutRes.status).toBe(201);

      const dietRes = await fetch(`${base}/diet-plans`, {
        method: 'POST',
        headers: ownerHeaders,
        body: JSON.stringify({
          name: 'High Protein Vegetarian Cut',
          goal: 'Weight Loss',
          diet_type: 'Vegetarian',
          calories: 1750,
          macros: { protein: 120, carbs: 165, fats: 52 },
          meals: [{ time: '08:00 AM', name: 'Paneer Bhurji', items: ['Paneer 120g', '2 Multigrain Roti'], calories: 420 }],
        }),
      });
      expect(dietRes.status).toBe(201);

      const expRes = await fetch(`${base}/expenses`, {
        method: 'POST',
        headers: ownerHeaders,
        body: JSON.stringify({
          item: 'Commercial Treadmill Belt Servicing',
          category: 'Maintenance',
          vendor: 'FitTech Jaipur',
          amount: 4500,
          payment_method: 'UPI',
        }),
      });
      expect(expRes.status).toBe(201);

      const offerRes = await fetch(`${base}/offers`, {
        method: 'POST',
        headers: ownerHeaders,
        body: JSON.stringify({
          title: 'Monsoon Strength Pass',
          code: 'MONSOON15',
          discount_type: 'percentage',
          discount_value: 15,
          usage_limit: 50,
        }),
      });
      expect(offerRes.status).toBe(201);

      const reviewRes = await fetch(`${base}/reviews`, {
        method: 'POST',
        headers: ownerHeaders,
        body: JSON.stringify({
          member_name: 'Aarav Sharma',
          rating: 5,
          category: 'Coaching',
          comment: 'Clean facility and attentive trainers.',
        }),
      });
      expect(reviewRes.status).toBe(201);

      const leadRes = await fetch(`${base}/leads`, {
        method: 'POST',
        headers: ownerHeaders,
        body: JSON.stringify({
          name: 'Meera Rathore',
          phone: '9829771122',
          source: 'Instagram',
          goal: 'Weight Loss',
        }),
      });
      expect(leadRes.status).toBe(201);
      const createdLeadId = (await leadRes.json()).lead.id;

      const convertRes = await fetch(`${base}/leads/${createdLeadId}/convert`, {
        method: 'POST',
        headers: ownerHeaders,
        body: JSON.stringify({ package_id: 2, payment_method: 'UPI', payment_amount: 4050 }),
      });
      expect(convertRes.status).toBe(201);
      const convertJson = await convertRes.json();
      expect(convertJson.member.name).toBe('Meera Rathore');
      expect(convertJson.invoice.status).toBe('Paid');
      expect(db.getSnapshot().leads.find((l) => l.id === createdLeadId)?.status).toBe('Converted');

      // 7. Gym Registration + Social Media Links persistence (Workflow K)
      const gymRes = await fetch(`${base}/gyms`, {
        method: 'POST',
        headers: ownerHeaders,
        body: JSON.stringify({
          gymName: 'Iron Peak Athletics',
          ownerName: 'Rajesh Verma',
          email: 'rajesh@ironpeak.in',
          mobile: '9829556677',
          upiId: 'ironpeak@upi',
          address: 'Tonk Road, Jaipur',
          googleLocation: 'https://maps.google.com/?q=Tonk+Road+Jaipur',
        }),
      });
      expect(gymRes.status).toBe(201);
      const gymId = (await gymRes.json()).gym.gym_id;

      const socialRes = await fetch(`${base}/gyms/${encodeURIComponent(gymId)}/social-links`, {
        method: 'PUT',
        headers: ownerHeaders,
        body: JSON.stringify({
          whatsapp: 'https://wa.me/919829556677',
          instagram: 'https://instagram.com/ironpeakathletics',
          facebook: 'https://facebook.com/ironpeakathletics',
          youtube: 'https://youtube.com/@ironpeakathletics',
        }),
      });
      expect(socialRes.status).toBe(200);

      // 8. Owner Backup snapshot
      const backupRes = await fetch(`${base}/backup`, {
        method: 'POST',
        headers: ownerHeaders,
      });
      expect(backupRes.status).toBe(201);
      const backupJson = await backupRes.json();
      expect(backupJson.success).toBe(true);

      // 9. Logout revokes token -> /api/auth/me returns 401
      const logoutRes = await fetch(`${root}/api/auth/logout`, {
        method: 'POST',
        headers: ownerHeaders,
      });
      expect(logoutRes.status).toBe(200);

      const postLogoutMe = await fetch(`${root}/api/auth/me`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      });
      expect(postLogoutMe.status).toBe(401);

      // 10. Reload DB from disk -> all records created above MUST survive reload
      const reloadedDb = new GymRelationalDatabase(dbPath);
      const reloaded = reloadedDb.getSnapshot();
      expect(reloaded.staff.some((s) => s.id === staffId)).toBe(true);
      expect(reloaded.workout_plans.some((w) => w.name === 'Athletic Conditioning 5x5')).toBe(true);
      expect(reloaded.diet_plans.some((d) => d.name === 'High Protein Vegetarian Cut')).toBe(true);
      expect(reloaded.expenses.some((e) => e.item === 'Commercial Treadmill Belt Servicing')).toBe(true);
      expect(reloaded.offers.some((o) => o.code === 'MONSOON15')).toBe(true);
      expect(reloaded.reviews.some((r) => r.comment === 'Clean facility and attentive trainers.')).toBe(true);
      expect(reloaded.members.some((m) => m.name === 'Meera Rathore')).toBe(true);
      const savedGym = reloaded.gyms.find((g) => g.gym_id === gymId);
      expect(savedGym?.instagram_url).toBe('https://instagram.com/ironpeakathletics');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
