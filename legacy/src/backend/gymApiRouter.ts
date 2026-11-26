import { Router, Request, Response } from 'express';
import {
  gymDb,
  DEFAULT_GYM_ID,
  sanitizeString,
  normalizeMobile,
  computeExpiryDate,
  GymRelationalDatabase,
} from './gymDatabase.js';
import { attachAuthContext, requireRoles, GymRole } from './authMiddleware.js';

const ALL_STAFF_ROLES: GymRole[] = ['owner', 'admin', 'manager', 'trainer', 'receptionist', 'dietitian'];
const MANAGEMENT_ROLES: GymRole[] = ['owner', 'admin', 'manager'];
const BILLING_ROLES: GymRole[] = ['owner', 'admin', 'manager', 'receptionist'];
const FITNESS_ROLES: GymRole[] = ['owner', 'admin', 'manager', 'trainer', 'dietitian'];

export function createGymApiRouter(
  db: GymRelationalDatabase = gymDb,
  options: { strictAuth?: boolean } = {}
): Router {
  const router = Router();
  const strict = Boolean(options.strictAuth);

  // Cryptographically verify any attached Bearer token (and enforce auth if strict=true)
  router.use(attachAuthContext(strict));

  const getGymId = (req: Request): string => {
    const requested = sanitizeString(
      ((req.query.gym_id || req.body?.gym_id || req.params?.gymId || '') as string),
      80
    );
    if (req.authUser && req.authUser.role !== 'owner' && req.authUser.role !== 'admin') {
      return req.authUser.gym_id;
    }
    return requested || req.authUser?.gym_id || DEFAULT_GYM_ID;
  };

  const getActor = (req: Request): string => req.authUser?.email || 'admin';

  // ==========================================================================
  // 1. BOOTSTRAP, DASHBOARD SUMMARY & BACKUP
  // ==========================================================================
  router.get('/bootstrap', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const hasExplicitGym = Boolean(req.query.gym_id);
      const gymId =
        req.authUser && req.authUser.role !== 'owner' && req.authUser.role !== 'admin'
          ? req.authUser.gym_id
          : hasExplicitGym
          ? getGymId(req)
          : undefined;
      const snapshot = db.getSnapshot(gymId);
      res.json({
        success: true,
        schema_version: snapshot.schema_version,
        core_tables: [
          'gyms',
          'users',
          'members',
          'membership_packages',
          'memberships',
          'payments',
          'attendance',
          'expenses',
        ],
        auxiliary_tables: [
          'invoices',
          'leads',
          'staff',
          'offers',
          'reviews',
          'workout_plans',
          'diet_plans',
          'whatsapp_logs',
          'audit_logs',
        ],
        data: snapshot,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load gym database.' });
    }
  });

  router.get('/dashboard-summary', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const summary = db.getDashboardSummary(getGymId(req));
      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load dashboard summary.' });
    }
  });

  router.post('/backup', requireRoles(['owner', 'admin'], { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const backup = db.createBackup(getActor(req));
      res.status(201).json({ success: true, ...backup });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Backup failed.' });
    }
  });

  // ==========================================================================
  // 2. MEMBERS CRUD & MEMBERSHIP RENEWAL (MODULE 2)
  // ==========================================================================
  router.get('/members', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(getGymId(req));
    res.json({ success: true, members: snap.members });
  });

  router.post('/members', requireRoles(BILLING_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const body = req.body || {};
      const name = sanitizeString(body.name, 120);
      const phone = normalizeMobile(body.phone || '');
      if (!name || phone.length < 10) {
        return res.status(400).json({ success: false, error: 'Member name and valid 10-digit mobile are required.' });
      }
      const member = db.runTransaction((draft) => {
        const dup = draft.members.find((m) => m.gym_id === gymId && !m.archived && normalizeMobile(m.phone) === phone);
        if (dup) throw new Error(`Duplicate mobile number: ${phone} already belongs to ${dup.name}.`);
        const nowIso = new Date().toISOString();
        const today = nowIso.split('T')[0];
        const nextId = Math.max(100, ...draft.members.map((m) => m.id)) + 1;
        const pkgId = Number(body.package_id || body.packageId || draft.membership_packages[0]?.id || 1);
        const pkg = draft.membership_packages.find((p) => p.id === pkgId && p.gym_id === gymId);
        const height = Math.max(100, Math.min(250, Number(body.height_cm || body.height || 170)));
        const weight = Math.max(25, Math.min(250, Number(body.weight_kg || body.weight || 70)));
        const bmi = Number((weight / ((height / 100) * (height / 100))).toFixed(1));
        const joinDate = sanitizeString(body.join_date || body.joinDate, 20) || today;
        const expiryDate =
          sanitizeString(body.expiry_date || body.expiryDate, 20) ||
          computeExpiryDate(joinDate, pkg?.duration_months || 1);

        const rec = {
          id: nextId,
          gym_id: gymId,
          member_code: sanitizeString(body.member_code || body.loginId, 30) || `FF-${1000 + nextId}`,
          name,
          email: sanitizeString(body.email, 160) || `member${nextId}@fitnessfuture.in`,
          phone,
          gender: (body.gender || 'Male') as 'Male' | 'Female' | 'Other',
          dob: sanitizeString(body.dob, 20),
          address: sanitizeString(body.address, 250),
          avatar: String(body.avatar || '').slice(0, 200000),
          join_date: joinDate,
          expiry_date: expiryDate,
          package_id: pkgId,
          assigned_trainer_id: body.assigned_trainer_id ?? body.assignedTrainerId ?? null,
          status: (body.status || 'Active') as 'Active' | 'Pending' | 'Expired' | 'Inactive',
          archived: Boolean(body.archived),
          fitness_goal: sanitizeString(body.fitness_goal || body.fitnessGoal, 60) || 'Fitness',
          training_experience: (body.training_experience || 'Beginner') as 'Beginner' | 'Intermediate' | 'Advanced',
          height_cm: height,
          weight_kg: weight,
          bmi,
          whatsapp_consent: body.whatsapp_consent !== false && body.whatsappConsent !== false,
          digital_consent: body.digital_consent !== false,
          emergency_contact: {
            name: sanitizeString(body.emergency_contact?.name, 100),
            phone: normalizeMobile(body.emergency_contact?.phone || ''),
            relation: sanitizeString(body.emergency_contact?.relation, 50),
          },
          medical_notes: sanitizeString(body.medical_notes, 500),
          approved_workout_plan: sanitizeString(body.approved_workout_plan || body.approvedWorkoutPlan, 140),
          approved_diet_plan: sanitizeString(body.approved_diet_plan || body.approvedDietPlan, 140),
          created_at: nowIso,
          updated_at: nowIso,
        };
        draft.members.unshift(rec);
        draft.audit_logs.unshift({
          id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          gym_id: gymId,
          actor: getActor(req),
          action: 'MEMBER_CREATED',
          entity_type: 'member',
          entity_id: String(nextId),
          details: `Created member ${name} (${rec.member_code}).`,
          created_at: nowIso,
        });
        return rec;
      });
      res.status(201).json({ success: true, member });
    } catch (err: any) {
      const msg = err?.message || 'Failed to create member.';
      res.status(msg.toLowerCase().includes('duplicate') ? 409 : 400).json({ success: false, error: msg });
    }
  });

  router.put('/members/:id', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      const body = req.body || {};
      const updated = db.runTransaction((draft) => {
        const m = draft.members.find((item) => item.id === id && item.gym_id === gymId);
        if (!m) throw new Error('Member not found.');
        const nowIso = new Date().toISOString();
        if (body.name !== undefined) m.name = sanitizeString(body.name, 120) || m.name;
        if (body.email !== undefined) m.email = sanitizeString(body.email, 160);
        if (body.phone !== undefined) {
          const norm = normalizeMobile(body.phone);
          if (norm.length >= 10) m.phone = norm;
        }
        if (body.gender !== undefined) m.gender = body.gender;
        if (body.dob !== undefined) m.dob = sanitizeString(body.dob, 20);
        if (body.address !== undefined) m.address = sanitizeString(body.address, 250);
        if (body.avatar !== undefined) m.avatar = String(body.avatar || '').slice(0, 200000);
        if (body.package_id !== undefined || body.packageId !== undefined) {
          m.package_id = Number(body.package_id ?? body.packageId);
        }
        if (body.expiry_date !== undefined || body.expiryDate !== undefined) {
          m.expiry_date = sanitizeString(body.expiry_date ?? body.expiryDate, 20);
        }
        if (body.assigned_trainer_id !== undefined || body.assignedTrainerId !== undefined) {
          const tid = body.assigned_trainer_id ?? body.assignedTrainerId;
          m.assigned_trainer_id = tid ? Number(tid) : null;
        }
        if (body.status !== undefined) m.status = body.status;
        if (body.archived !== undefined) m.archived = Boolean(body.archived);
        if (body.fitness_goal !== undefined || body.fitnessGoal !== undefined) {
          m.fitness_goal = sanitizeString(body.fitness_goal ?? body.fitnessGoal, 60);
        }
        if (body.whatsapp_consent !== undefined || body.whatsappConsent !== undefined) {
          m.whatsapp_consent = Boolean(body.whatsapp_consent ?? body.whatsappConsent);
        }
        if (body.height_cm !== undefined || body.weight_kg !== undefined) {
          m.height_cm = Math.max(100, Math.min(250, Number(body.height_cm ?? m.height_cm)));
          m.weight_kg = Math.max(25, Math.min(250, Number(body.weight_kg ?? m.weight_kg)));
          m.bmi = Number((m.weight_kg / ((m.height_cm / 100) * (m.height_cm / 100))).toFixed(1));
        }
        if (body.emergency_contact !== undefined) {
          m.emergency_contact = {
            name: sanitizeString(body.emergency_contact?.name, 100),
            phone: normalizeMobile(body.emergency_contact?.phone || ''),
            relation: sanitizeString(body.emergency_contact?.relation, 50),
          };
        }
        if (body.medical_notes !== undefined) m.medical_notes = sanitizeString(body.medical_notes, 500);
        if (body.approved_workout_plan !== undefined || body.approvedWorkoutPlan !== undefined) {
          m.approved_workout_plan = sanitizeString(body.approved_workout_plan ?? body.approvedWorkoutPlan, 140);
        }
        if (body.approved_diet_plan !== undefined || body.approvedDietPlan !== undefined) {
          m.approved_diet_plan = sanitizeString(body.approved_diet_plan ?? body.approvedDietPlan, 140);
        }
        m.updated_at = nowIso;
        return m;
      });
      res.json({ success: true, member: updated });
    } catch (err: any) {
      const msg = err?.message || 'Failed to update member.';
      res.status(msg.toLowerCase().includes('not found') ? 404 : msg.toLowerCase().includes('duplicate') ? 409 : 400).json({ success: false, error: msg });
    }
  });

  router.patch('/members/:id/archive', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      const archived = req.body?.archived !== false;
      const member = db.runTransaction((draft) => {
        const m = draft.members.find((item) => item.id === id && item.gym_id === gymId);
        if (!m) throw new Error('Member not found.');
        const nowIso = new Date().toISOString();
        m.archived = archived;
        m.status = archived ? 'Inactive' : 'Active';
        m.updated_at = nowIso;
        draft.audit_logs.unshift({
          id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          gym_id: gymId,
          actor: getActor(req),
          action: archived ? 'MEMBER_ARCHIVED' : 'MEMBER_RESTORED',
          entity_type: 'member',
          entity_id: String(id),
          details: `Member ${m.name} (#${id}) ${archived ? 'archived' : 'restored'}.`,
          created_at: nowIso,
        });
        return m;
      });
      res.json({ success: true, member });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Archive failed.' });
    }
  });

  router.delete('/members/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      db.runTransaction((draft) => {
        const idx = draft.members.findIndex((m) => m.id === id && m.gym_id === gymId);
        if (idx < 0) throw new Error('Member not found.');
        const removed = draft.members[idx];
        draft.members.splice(idx, 1);
        draft.memberships = draft.memberships.filter((ms) => !(ms.member_id === id && ms.gym_id === gymId));
        draft.payments = draft.payments.filter((p) => !(p.member_id === id && p.gym_id === gymId));
        draft.invoices = draft.invoices.filter((i) => !(i.member_id === id && i.gym_id === gymId));
        draft.attendance = draft.attendance.filter((a) => !(a.member_id === id && a.gym_id === gymId));
        draft.audit_logs.unshift({
          id: `AUD-${Date.now()}`,
          gym_id: gymId,
          actor: getActor(req),
          action: 'MEMBER_DELETED',
          entity_type: 'member',
          entity_id: String(id),
          details: `Deleted member ${removed.name} (#${id}) and dependent records.`,
          created_at: new Date().toISOString(),
        });
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err?.message || 'Delete member failed.' });
    }
  });

  router.post('/members/:id/renew', requireRoles(BILLING_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const result = db.renewMembership({
        gym_id: getGymId(req),
        member_id: Number(req.params.id),
        package_id: req.body?.package_id ? Number(req.body.package_id) : undefined,
        payment_method: req.body?.payment_method || 'UPI',
        payment_amount: req.body?.payment_amount !== undefined ? Number(req.body.payment_amount) : undefined,
        coupon_code: req.body?.coupon_code,
        idempotency_key: req.body?.idempotency_key,
        actor: getActor(req),
      });
      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Membership renewal failed.' });
    }
  });

  // ==========================================================================
  // 3. SCIENTIFIC ADMISSION (MODULE 3 — WORKFLOW A)
  // ==========================================================================
  router.post('/admissions', requireRoles(BILLING_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const result = db.processAdmission({
        ...req.body,
        gym_id: getGymId(req),
      });
      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      const msg = err?.message || 'Admission failed.';
      const status = msg.toLowerCase().includes('duplicate') ? 409 : 400;
      res.status(status).json({ success: false, error: msg });
    }
  });

  // ==========================================================================
  // 4. PACKAGES & DISCOUNTS CRUD (MODULE 4)
  // ==========================================================================
  router.get('/packages', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(getGymId(req));
    res.json({ success: true, packages: snap.membership_packages });
  });

  router.post('/packages', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const body = req.body || {};
      const name = sanitizeString(body.name, 120);
      const price = Number(body.price);
      if (!name || !Number.isFinite(price) || price < 0) {
        return res.status(400).json({ success: false, error: 'Package name and valid non-negative price are required.' });
      }
      const pkg = db.runTransaction((draft) => {
        const nowIso = new Date().toISOString();
        const nextId = Math.max(0, ...draft.membership_packages.map((p) => p.id)) + 1;
        const months = Math.max(1, Number(body.duration_months || body.billingMonths || 1));
        const rec = {
          id: nextId,
          gym_id: gymId,
          name,
          category: sanitizeString(body.category, 60) || 'General',
          duration_months: months,
          duration_label: sanitizeString(body.duration_label || body.duration, 40) || `${months} Month${months > 1 ? 's' : ''}`,
          monthly_base_rate: Math.max(0, Number(body.monthly_base_rate || body.monthlyBaseRate || Math.round(price / months))),
          registration_fee: Math.max(0, Number(body.registration_fee || body.registrationFee || 0)),
          discount_percent: Math.max(0, Math.min(90, Number(body.discount_percent || body.discountPercent || 0))),
          fixed_discount: Math.max(0, Number(body.fixed_discount || body.fixedDiscount || 0)),
          price: Math.round(price),
          features: Array.isArray(body.features) ? body.features.map((f: any) => sanitizeString(f, 120)).filter(Boolean) : [],
          details: sanitizeString(body.details, 300),
          is_popular: Boolean(body.is_popular ?? body.isPopular),
          is_active: body.is_active !== false,
          created_at: nowIso,
          updated_at: nowIso,
        };
        draft.membership_packages.push(rec);
        return rec;
      });
      res.status(201).json({ success: true, package: pkg });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to create package.' });
    }
  });

  router.put('/packages/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      const body = req.body || {};
      const updated = db.runTransaction((draft) => {
        const pkg = draft.membership_packages.find((p) => p.id === id && p.gym_id === gymId);
        if (!pkg) throw new Error('Package not found.');
        if (body.name !== undefined) pkg.name = sanitizeString(body.name, 120) || pkg.name;
        if (body.category !== undefined) pkg.category = sanitizeString(body.category, 60);
        if (body.duration_months !== undefined || body.billingMonths !== undefined) {
          pkg.duration_months = Math.max(1, Number(body.duration_months ?? body.billingMonths));
        }
        if (body.duration_label !== undefined || body.duration !== undefined) {
          pkg.duration_label = sanitizeString(body.duration_label ?? body.duration, 40);
        }
        if (body.monthly_base_rate !== undefined || body.monthlyBaseRate !== undefined) {
          pkg.monthly_base_rate = Math.max(0, Number(body.monthly_base_rate ?? body.monthlyBaseRate));
        }
        if (body.registration_fee !== undefined || body.registrationFee !== undefined) {
          pkg.registration_fee = Math.max(0, Number(body.registration_fee ?? body.registrationFee));
        }
        if (body.discount_percent !== undefined || body.discountPercent !== undefined) {
          pkg.discount_percent = Math.max(0, Math.min(90, Number(body.discount_percent ?? body.discountPercent)));
        }
        if (body.fixed_discount !== undefined || body.fixedDiscount !== undefined) {
          pkg.fixed_discount = Math.max(0, Number(body.fixed_discount ?? body.fixedDiscount));
        }
        if (body.price !== undefined) pkg.price = Math.max(0, Math.round(Number(body.price)));
        if (Array.isArray(body.features)) pkg.features = body.features.map((f: any) => sanitizeString(f, 120)).filter(Boolean);
        if (body.details !== undefined) pkg.details = sanitizeString(body.details, 300);
        if (body.is_popular !== undefined || body.isPopular !== undefined) {
          pkg.is_popular = Boolean(body.is_popular ?? body.isPopular);
        }
        if (body.is_active !== undefined) pkg.is_active = Boolean(body.is_active);
        pkg.updated_at = new Date().toISOString();
        return pkg;
      });
      res.json({ success: true, package: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to update package.' });
    }
  });

  router.delete('/packages/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      db.runTransaction((draft) => {
        const idx = draft.membership_packages.findIndex((p) => p.id === id && p.gym_id === gymId);
        if (idx < 0) throw new Error('Package not found.');
        draft.membership_packages.splice(idx, 1);
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err?.message || 'Delete package failed.' });
    }
  });

  // ==========================================================================
  // 5. BILLING, INVOICES, PAYMENTS & REFUNDS (MODULE 5)
  // ==========================================================================
  router.get('/invoices', requireRoles(BILLING_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(getGymId(req));
    res.json({ success: true, invoices: snap.invoices, payments: snap.payments });
  });

  router.post('/invoices', requireRoles(BILLING_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const result = db.runTransaction((draft) => {
        const memberId = Number(req.body?.member_id ?? req.body?.memberId);
        const member = draft.members.find((m) => m.id === memberId && m.gym_id === gymId);
        if (!member) throw new Error('Selected member does not exist.');

        const pkgId = Number(req.body?.package_id ?? req.body?.packageId ?? member.package_id);
        const pkg = draft.membership_packages.find((p) => p.id === pkgId && p.gym_id === gymId);
        const baseSubtotal = Math.max(0, Number(req.body?.subtotal ?? req.body?.amount ?? pkg?.price ?? 0));
        const regFee = Math.max(0, Number(req.body?.registration_fee ?? 0));

        let discountAmount = Math.max(0, Number(req.body?.discount_amount ?? req.body?.discountAmount ?? 0));
        let appliedCode: string | null = null;
        const couponCode = req.body?.coupon_code || req.body?.couponCode;
        if (couponCode) {
          const v = db.validateCoupon({
            gym_id: gymId,
            code: couponCode,
            baseAmount: baseSubtotal,
            planName: pkg?.name,
          });
          if (!v.valid) throw new Error(v.reason || 'Invalid coupon.');
          discountAmount = Math.max(discountAmount, v.discountAmount);
          appliedCode = v.offer!.code;
          const draftOffer = draft.offers.find((o) => o.id === v.offer!.id);
          if (draftOffer) draftOffer.redemptions += 1;
        }

        const totalAmount = Math.max(0, baseSubtotal + regFee - discountAmount);
        const paidAmount = Math.min(totalAmount, Math.max(0, Number(req.body?.paid_amount ?? req.body?.paidAmount ?? 0)));
        const balanceAmount = Math.max(0, totalAmount - paidAmount);
        const nowIso = new Date().toISOString();
        const today = req.body?.date || nowIso.split('T')[0];
        const nextId = Math.max(1000, ...draft.invoices.map((i) => i.id)) + 1;

        const status =
          paidAmount >= totalAmount
            ? 'Paid'
            : paidAmount > 0
            ? 'Partial'
            : req.body?.status === 'Overdue'
            ? 'Overdue'
            : 'Pending';

        const invoice = {
          id: nextId,
          gym_id: gymId,
          invoice_number: `INV-${new Date().getFullYear()}-${nextId}`,
          member_id: member.id,
          member_name: member.name,
          membership_id: null,
          package_id: pkg?.id || pkgId,
          package_name: sanitizeString(req.body?.package_name || req.body?.packageName || pkg?.name || 'Membership', 120),
          subtotal: baseSubtotal,
          registration_fee: regFee,
          coupon_code: appliedCode,
          discount_amount: discountAmount,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          balance_amount: balanceAmount,
          refunded_amount: 0,
          status: status as any,
          payment_method: (req.body?.payment_method || req.body?.paymentMethod || 'UPI') as any,
          date: today,
          created_at: nowIso,
          updated_at: nowIso,
        };
        draft.invoices.unshift(invoice);

        if (paidAmount > 0) {
          draft.payments.unshift({
            id: `PAY-${nextId}-${Date.now().toString().slice(-4)}`,
            gym_id: gymId,
            invoice_id: nextId,
            member_id: member.id,
            member_name: member.name,
            amount: paidAmount,
            method: invoice.payment_method,
            status: 'Completed',
            idempotency_key: req.body?.idempotency_key || `INV-PAY-${nextId}-${Date.now()}`,
            reference_no: `${invoice.payment_method.toUpperCase()}-${nextId}`,
            paid_at: today,
            created_at: nowIso,
          });
          member.status = 'Active';
          if (pkg && member.expiry_date < today) {
            member.expiry_date = computeExpiryDate(today, pkg.duration_months || 1);
          }
          member.updated_at = nowIso;
        }

        draft.audit_logs.unshift({
          id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          gym_id: gymId,
          actor: getActor(req),
          action: 'INVOICE_CREATED',
          entity_type: 'invoice',
          entity_id: String(nextId),
          details: `Created ${invoice.invoice_number} for ${member.name} (Total ₹${totalAmount}, Paid ₹${paidAmount}).`,
          created_at: nowIso,
        });

        return invoice;
      });

      res.status(201).json({ success: true, invoice: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to create invoice.' });
    }
  });

  router.post('/payments', requireRoles(BILLING_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const result = db.recordPayment({
        gym_id: getGymId(req),
        invoice_id: Number(req.body?.invoice_id),
        amount: Number(req.body?.amount),
        method: req.body?.method || 'UPI',
        idempotency_key: String(req.body?.idempotency_key || ''),
        reference_no: req.body?.reference_no,
        notes: req.body?.notes,
      });
      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      const msg = err?.message || 'Payment processing failed.';
      const status = msg.toLowerCase().includes('duplicate') ? 409 : 400;
      res.status(status).json({ success: false, error: msg });
    }
  });

  router.post('/invoices/:id/refund', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const invoice = db.refundInvoice({
        gym_id: getGymId(req),
        invoice_id: Number(req.params.id),
        reason: req.body?.reason,
      });
      res.json({ success: true, invoice });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Refund failed.' });
    }
  });

  router.delete('/invoices/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      db.runTransaction((draft) => {
        const idx = draft.invoices.findIndex((i) => i.id === id && i.gym_id === gymId);
        if (idx < 0) throw new Error('Invoice not found.');
        draft.invoices.splice(idx, 1);
        draft.payments = draft.payments.filter((p) => !(p.invoice_id === id && p.gym_id === gymId));
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err?.message || 'Delete invoice failed.' });
    }
  });

  // ==========================================================================
  // 6. GEOMETRIC / QR ATTENDANCE (MODULE 6 — WORKFLOW D)
  // ==========================================================================
  router.get('/attendance', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(getGymId(req));
    res.json({ success: true, attendance: snap.attendance });
  });

  router.post('/attendance/check-in', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const result = db.checkInMember({
        gym_id: getGymId(req),
        member_id: req.body?.member_id ? Number(req.body.member_id) : undefined,
        qr_payload: req.body?.qr_payload ? String(req.body.qr_payload) : undefined,
        zone: req.body?.zone || 'Main Floor',
        method: req.body?.method || 'QR',
      });
      res.status(result.granted ? 201 : 403).json({ success: result.granted, ...result });
    } catch (err: any) {
      const msg = err?.message || 'Check-in failed.';
      const status = msg.toLowerCase().includes('already checked in') ? 409 : 400;
      res.status(status).json({ success: false, error: msg });
    }
  });

  router.post('/attendance/:id/check-out', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const record = db.checkOutMember(String(req.params.id), getGymId(req));
      res.json({ success: true, record });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Check-out failed.' });
    }
  });

  router.delete('/attendance/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = String(req.params.id);
      db.runTransaction((draft) => {
        const idx = draft.attendance.findIndex((a) => a.id === id && a.gym_id === gymId);
        if (idx < 0) throw new Error('Attendance record not found.');
        draft.attendance.splice(idx, 1);
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err?.message || 'Delete attendance failed.' });
    }
  });

  // ==========================================================================
  // 7. STAFF & TRAINER MANAGEMENT CRUD (MODULE 7)
  // ==========================================================================
  router.get('/staff', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(getGymId(req));
    res.json({ success: true, staff: snap.staff });
  });

  router.post('/staff', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const body = req.body || {};
      const name = sanitizeString(body.name, 120);
      if (!name) return res.status(400).json({ success: false, error: 'Staff member name is required.' });
      const created = db.runTransaction((draft) => {
        const nowIso = new Date().toISOString();
        const nextId = Math.max(0, ...draft.staff.map((s) => s.id)) + 1;
        const rec = {
          id: nextId,
          gym_id: gymId,
          name,
          role: (body.role || 'Trainer') as any,
          phone: normalizeMobile(body.phone || ''),
          email: sanitizeString(body.email, 160),
          salary: Math.max(0, Number(body.salary) || 0),
          shift: sanitizeString(body.shift, 60) || '06:00 AM - 02:00 PM',
          specialization: sanitizeString(body.specialization, 120) || 'General Fitness',
          status: (body.status || 'Active') as any,
          rating: Math.min(5, Math.max(1, Number(body.rating) || 4.8)),
          active_clients: Math.max(0, Number(body.active_clients ?? body.activeClients) || 0),
          attendance_today: (body.attendance_today || body.attendanceToday || 'Present') as any,
          payroll_status: (body.payroll_status || body.payrollStatus || 'Pending') as any,
          join_date: sanitizeString(body.join_date || body.joinDate, 20) || nowIso.split('T')[0],
          created_at: nowIso,
          updated_at: nowIso,
        };
        draft.staff.unshift(rec);
        draft.audit_logs.unshift({
          id: `AUD-${Date.now()}`,
          gym_id: gymId,
          actor: getActor(req),
          action: 'STAFF_CREATED',
          entity_type: 'staff',
          entity_id: String(nextId),
          details: `Added ${rec.role} ${rec.name} (Salary ₹${rec.salary}).`,
          created_at: nowIso,
        });
        return rec;
      });
      res.status(201).json({ success: true, staff: created });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to add staff.' });
    }
  });

  router.put('/staff/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      const body = req.body || {};
      const updated = db.runTransaction((draft) => {
        const s = draft.staff.find((item) => item.id === id && item.gym_id === gymId);
        if (!s) throw new Error('Staff record not found.');
        if (body.name !== undefined) s.name = sanitizeString(body.name, 120) || s.name;
        if (body.role !== undefined) s.role = body.role;
        if (body.phone !== undefined) s.phone = normalizeMobile(body.phone);
        if (body.email !== undefined) s.email = sanitizeString(body.email, 160);
        if (body.salary !== undefined) s.salary = Math.max(0, Number(body.salary));
        if (body.shift !== undefined) s.shift = sanitizeString(body.shift, 60);
        if (body.specialization !== undefined) s.specialization = sanitizeString(body.specialization, 120);
        if (body.status !== undefined) s.status = body.status;
        if (body.rating !== undefined) s.rating = Math.min(5, Math.max(1, Number(body.rating)));
        if (body.active_clients !== undefined || body.activeClients !== undefined) {
          s.active_clients = Math.max(0, Number(body.active_clients ?? body.activeClients));
        }
        if (body.attendance_today !== undefined || body.attendanceToday !== undefined) {
          s.attendance_today = body.attendance_today ?? body.attendanceToday;
        }
        if (body.payroll_status !== undefined || body.payrollStatus !== undefined) {
          s.payroll_status = body.payroll_status ?? body.payrollStatus;
        }
        s.updated_at = new Date().toISOString();
        return s;
      });
      res.json({ success: true, staff: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to update staff.' });
    }
  });

  router.delete('/staff/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      db.runTransaction((draft) => {
        const idx = draft.staff.findIndex((s) => s.id === id && s.gym_id === gymId);
        if (idx < 0) throw new Error('Staff record not found.');
        draft.staff.splice(idx, 1);
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err?.message || 'Failed to delete staff.' });
    }
  });

  // ==========================================================================
  // 8. SMART WORKOUT PLANS CRUD (MODULE 8)
  // ==========================================================================
  router.get('/workout-plans', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(getGymId(req));
    res.json({ success: true, workout_plans: snap.workout_plans });
  });

  router.post('/workout-plans', requireRoles(FITNESS_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const body = req.body || {};
      const name = sanitizeString(body.name, 140);
      if (!name) return res.status(400).json({ success: false, error: 'Workout plan name is required.' });
      const created = db.runTransaction((draft) => {
        const nowIso = new Date().toISOString();
        const nextId = Math.max(0, ...draft.workout_plans.map((w) => w.id)) + 1;
        const rec = {
          id: nextId,
          gym_id: gymId,
          name,
          category: sanitizeString(body.category, 60) || 'Fitness',
          level: (body.level || 'Beginner') as 'Beginner' | 'Intermediate' | 'Advanced',
          duration: sanitizeString(body.duration, 40) || '45 mins',
          frequency: sanitizeString(body.frequency, 40) || '4 Days / Week',
          assigned_trainer_id: body.assigned_trainer_id ?? body.assignedTrainerId ?? null,
          description: sanitizeString(body.description, 500),
          scientific_note: sanitizeString(body.scientific_note || body.scientificNote, 400),
          ai_generated: Boolean(body.ai_generated ?? body.aiGenerated),
          main_workout: Array.isArray(body.main_workout || body.mainWorkout)
            ? (body.main_workout || body.mainWorkout)
            : [],
          created_at: nowIso,
          updated_at: nowIso,
        };
        draft.workout_plans.unshift(rec);
        return rec;
      });
      res.status(201).json({ success: true, workout_plan: created });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to save workout plan.' });
    }
  });

  router.put('/workout-plans/:id', requireRoles(FITNESS_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      const body = req.body || {};
      const updated = db.runTransaction((draft) => {
        const w = draft.workout_plans.find((item) => item.id === id && item.gym_id === gymId);
        if (!w) throw new Error('Workout plan not found.');
        if (body.name !== undefined) w.name = sanitizeString(body.name, 140) || w.name;
        if (body.category !== undefined) w.category = sanitizeString(body.category, 60);
        if (body.level !== undefined) w.level = body.level;
        if (body.duration !== undefined) w.duration = sanitizeString(body.duration, 40);
        if (body.frequency !== undefined) w.frequency = sanitizeString(body.frequency, 40);
        if (body.description !== undefined) w.description = sanitizeString(body.description, 500);
        if (body.scientific_note !== undefined || body.scientificNote !== undefined) {
          w.scientific_note = sanitizeString(body.scientific_note ?? body.scientificNote, 400);
        }
        if (Array.isArray(body.main_workout || body.mainWorkout)) {
          w.main_workout = body.main_workout || body.mainWorkout;
        }
        w.updated_at = new Date().toISOString();
        return w;
      });
      res.json({ success: true, workout_plan: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to update workout plan.' });
    }
  });

  router.delete('/workout-plans/:id', requireRoles(FITNESS_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      db.runTransaction((draft) => {
        const idx = draft.workout_plans.findIndex((w) => w.id === id && w.gym_id === gymId);
        if (idx < 0) throw new Error('Workout plan not found.');
        draft.workout_plans.splice(idx, 1);
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err?.message || 'Delete workout plan failed.' });
    }
  });

  // ==========================================================================
  // 9. SMART DIET PLANS CRUD (MODULE 9)
  // ==========================================================================
  router.get('/diet-plans', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(getGymId(req));
    res.json({ success: true, diet_plans: snap.diet_plans });
  });

  router.post('/diet-plans', requireRoles(FITNESS_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const body = req.body || {};
      const name = sanitizeString(body.name, 140);
      if (!name) return res.status(400).json({ success: false, error: 'Diet plan name is required.' });
      const created = db.runTransaction((draft) => {
        const nowIso = new Date().toISOString();
        const nextId = Math.max(0, ...draft.diet_plans.map((d) => d.id)) + 1;
        const rec = {
          id: nextId,
          gym_id: gymId,
          name,
          level: sanitizeString(body.level, 40) || 'Beginner',
          goal: sanitizeString(body.goal, 60) || 'Weight Loss',
          diet_type: (body.diet_type || body.dietType || 'Vegetarian') as any,
          calories: Math.max(800, Number(body.calories) || 1800),
          macros: {
            protein: Math.max(0, Number(body.macros?.protein) || 110),
            carbs: Math.max(0, Number(body.macros?.carbs) || 180),
            fats: Math.max(0, Number(body.macros?.fats) || 55),
          },
          allergies: sanitizeString(body.allergies, 200) || 'None',
          approved_by: body.approved_by || body.approvedBy || null,
          approved_at: body.approved_at || body.approvedAt || null,
          disclaimer:
            sanitizeString(body.disclaimer, 300) ||
            'Nutritional estimates only — not a substitute for professional medical or clinical dietary advice.',
          meals: Array.isArray(body.meals) ? body.meals : [],
          description: sanitizeString(body.description, 500),
          ai_generated: Boolean(body.ai_generated ?? body.aiGenerated),
          created_at: nowIso,
          updated_at: nowIso,
        };
        draft.diet_plans.unshift(rec);
        return rec;
      });
      res.status(201).json({ success: true, diet_plan: created });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to save diet plan.' });
    }
  });

  router.put('/diet-plans/:id', requireRoles(FITNESS_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      const body = req.body || {};
      const updated = db.runTransaction((draft) => {
        const d = draft.diet_plans.find((item) => item.id === id && item.gym_id === gymId);
        if (!d) throw new Error('Diet plan not found.');
        if (body.name !== undefined) d.name = sanitizeString(body.name, 140) || d.name;
        if (body.goal !== undefined) d.goal = sanitizeString(body.goal, 60);
        if (body.diet_type !== undefined || body.dietType !== undefined) d.diet_type = body.diet_type ?? body.dietType;
        if (body.calories !== undefined) d.calories = Math.max(800, Number(body.calories));
        if (body.macros !== undefined) d.macros = body.macros;
        if (body.allergies !== undefined) d.allergies = sanitizeString(body.allergies, 200);
        if (body.approved_by !== undefined || body.approvedBy !== undefined) {
          d.approved_by = body.approved_by ?? body.approvedBy;
          d.approved_at = body.approved_at ?? body.approvedAt ?? new Date().toISOString().split('T')[0];
        }
        if (Array.isArray(body.meals)) d.meals = body.meals;
        if (body.description !== undefined) d.description = sanitizeString(body.description, 500);
        d.updated_at = new Date().toISOString();
        return d;
      });
      res.json({ success: true, diet_plan: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to update diet plan.' });
    }
  });

  router.delete('/diet-plans/:id', requireRoles(FITNESS_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      db.runTransaction((draft) => {
        const idx = draft.diet_plans.findIndex((d) => d.id === id && d.gym_id === gymId);
        if (idx < 0) throw new Error('Diet plan not found.');
        draft.diet_plans.splice(idx, 1);
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err?.message || 'Delete diet plan failed.' });
    }
  });

  // ==========================================================================
  // 10. EXPENSES MANAGEMENT CRUD (MODULE 10)
  // ==========================================================================
  router.get('/expenses', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(getGymId(req));
    res.json({ success: true, expenses: snap.expenses });
  });

  router.post('/expenses', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const item = sanitizeString(req.body?.item, 150);
      const amount = Number(req.body?.amount);
      if (!item || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Expense item and positive amount are required.' });
      }
      const created = db.runTransaction((draft) => {
        const nowIso = new Date().toISOString();
        const nextId = Math.max(0, ...draft.expenses.map((e) => e.id)) + 1;
        const rec = {
          id: nextId,
          gym_id: gymId,
          item,
          category: sanitizeString(req.body?.category, 60) || 'Utilities',
          vendor: sanitizeString(req.body?.vendor, 120) || 'Direct Vendor',
          amount,
          date: req.body?.date || nowIso.split('T')[0],
          payment_method: (req.body?.payment_method || req.body?.paymentMethod || 'UPI') as any,
          payment_status: (req.body?.payment_status || req.body?.paymentStatus || 'Paid') as any,
          receipt_url: String(req.body?.receipt_url || req.body?.receiptUrl || '').slice(0, 200000),
          notes: sanitizeString(req.body?.notes, 300),
          created_at: nowIso,
          updated_at: nowIso,
        };
        draft.expenses.unshift(rec);
        draft.audit_logs.unshift({
          id: `AUD-${Date.now()}`,
          gym_id: gymId,
          actor: getActor(req),
          action: 'EXPENSE_LOGGED',
          entity_type: 'expense',
          entity_id: String(nextId),
          details: `Logged expense "${item}" (${rec.category}) for ₹${amount}.`,
          created_at: nowIso,
        });
        return rec;
      });
      res.status(201).json({ success: true, expense: created });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to log expense.' });
    }
  });

  router.put('/expenses/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      const body = req.body || {};
      const updated = db.runTransaction((draft) => {
        const e = draft.expenses.find((item) => item.id === id && item.gym_id === gymId);
        if (!e) throw new Error('Expense record not found.');
        if (body.item !== undefined) e.item = sanitizeString(body.item, 150) || e.item;
        if (body.category !== undefined) e.category = sanitizeString(body.category, 60);
        if (body.vendor !== undefined) e.vendor = sanitizeString(body.vendor, 120);
        if (body.amount !== undefined && Number(body.amount) > 0) e.amount = Number(body.amount);
        if (body.date !== undefined) e.date = sanitizeString(body.date, 20);
        if (body.payment_method !== undefined || body.paymentMethod !== undefined) {
          e.payment_method = body.payment_method ?? body.paymentMethod;
        }
        if (body.payment_status !== undefined || body.paymentStatus !== undefined) {
          e.payment_status = body.payment_status ?? body.paymentStatus;
        }
        if (body.receipt_url !== undefined || body.receiptUrl !== undefined) {
          e.receipt_url = String(body.receipt_url ?? body.receiptUrl ?? '').slice(0, 200000);
        }
        if (body.notes !== undefined) e.notes = sanitizeString(body.notes, 300);
        e.updated_at = new Date().toISOString();
        return e;
      });
      res.json({ success: true, expense: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to update expense.' });
    }
  });

  router.delete('/expenses/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      db.runTransaction((draft) => {
        const idx = draft.expenses.findIndex((e) => e.id === id && e.gym_id === gymId);
        if (idx < 0) throw new Error('Expense record not found.');
        draft.expenses.splice(idx, 1);
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err?.message || 'Delete expense failed.' });
    }
  });

  // ==========================================================================
  // 11. LEADS CRM CRUD & ATOMIC CONVERSION (MODULE 13 — WORKFLOW B)
  // ==========================================================================
  router.get('/leads', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(getGymId(req));
    res.json({ success: true, leads: snap.leads });
  });

  router.post('/leads', requireRoles(BILLING_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const body = req.body || {};
      const name = sanitizeString(body.name, 120);
      const phone = normalizeMobile(body.phone || '');
      if (!name || phone.length < 10) {
        return res.status(400).json({ success: false, error: 'Lead name and valid 10-digit mobile are required.' });
      }
      const created = db.runTransaction((draft) => {
        const nowIso = new Date().toISOString();
        const nextId = Math.max(0, ...draft.leads.map((l) => l.id)) + 1;
        const rec = {
          id: nextId,
          gym_id: gymId,
          name,
          phone,
          email: sanitizeString(body.email, 160),
          source: sanitizeString(body.source, 60) || 'Walk-in',
          interested_package_id: body.interested_package_id ? Number(body.interested_package_id) : null,
          goal: sanitizeString(body.goal, 80) || 'Fitness',
          follow_up_date: sanitizeString(body.follow_up_date || body.followUpDate, 20) || nowIso.split('T')[0],
          status: (body.status || 'New') as any,
          notes: sanitizeString(body.notes, 500),
          converted_member_id: null,
          created_at: nowIso,
          updated_at: nowIso,
        };
        draft.leads.unshift(rec);
        return rec;
      });
      res.status(201).json({ success: true, lead: created });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to create lead.' });
    }
  });

  router.put('/leads/:id', requireRoles(BILLING_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      const body = req.body || {};
      const updated = db.runTransaction((draft) => {
        const l = draft.leads.find((item) => item.id === id && item.gym_id === gymId);
        if (!l) throw new Error('Lead not found.');
        if (body.name !== undefined) l.name = sanitizeString(body.name, 120) || l.name;
        if (body.phone !== undefined) l.phone = normalizeMobile(body.phone) || l.phone;
        if (body.email !== undefined) l.email = sanitizeString(body.email, 160);
        if (body.source !== undefined) l.source = sanitizeString(body.source, 60);
        if (body.goal !== undefined) l.goal = sanitizeString(body.goal, 80);
        if (body.follow_up_date !== undefined || body.followUpDate !== undefined) {
          l.follow_up_date = sanitizeString(body.follow_up_date ?? body.followUpDate, 20);
        }
        if (body.status !== undefined) l.status = body.status;
        if (body.notes !== undefined) l.notes = sanitizeString(body.notes, 500);
        l.updated_at = new Date().toISOString();
        return l;
      });
      res.json({ success: true, lead: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to update lead.' });
    }
  });

  router.delete('/leads/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = Number(req.params.id);
      db.runTransaction((draft) => {
        const idx = draft.leads.findIndex((l) => l.id === id && l.gym_id === gymId);
        if (idx < 0) throw new Error('Lead not found.');
        draft.leads.splice(idx, 1);
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err?.message || 'Delete lead failed.' });
    }
  });

  router.post('/leads/:id/convert', requireRoles(BILLING_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const leadId = Number(req.params.id);
      const snap = db.getSnapshot(gymId);
      const lead = snap.leads.find((l) => l.id === leadId);
      if (!lead) return res.status(404).json({ success: false, error: 'Lead not found.' });
      if (lead.status === 'Converted') {
        return res.status(409).json({ success: false, error: 'Lead has already been converted.' });
      }
      const pkgId = Number(req.body?.package_id || lead.interested_package_id || snap.membership_packages[0]?.id || 1);
      const result = db.processAdmission({
        gym_id: gymId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        package_id: pkgId,
        fitness_goal: lead.goal || 'Fitness',
        digital_consent: true,
        payment_method: req.body?.payment_method || 'UPI',
        payment_amount: req.body?.payment_amount,
        lead_id: lead.id,
      });
      res.status(201).json({ success: true, ...result });
    } catch (err: any) {
      const msg = err?.message || 'Lead conversion failed.';
      res.status(msg.toLowerCase().includes('duplicate') ? 409 : 400).json({ success: false, error: msg });
    }
  });

  // ==========================================================================
  // 12. OFFERS, PROMOTIONS & COUPON VALIDATION (MODULE 14)
  // ==========================================================================
  router.get('/offers', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(getGymId(req));
    res.json({ success: true, offers: snap.offers });
  });

  router.post('/offers/validate', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const { code, baseAmount, planName } = req.body || {};
      const result = db.validateCoupon({
        gym_id: getGymId(req),
        code: String(code || ''),
        baseAmount: Number(baseAmount || 0),
        planName: planName ? String(planName) : undefined,
      });
      res.status(result.valid ? 200 : 400).json({ success: result.valid, ...result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Coupon validation failed.' });
    }
  });

  router.post('/offers', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const title = sanitizeString(req.body?.title, 120);
      const code = sanitizeString(req.body?.code, 40).toUpperCase();
      if (!title || !code) {
        return res.status(400).json({ success: false, error: 'Offer title and coupon code are required.' });
      }
      const created = db.runTransaction((draft) => {
        const nowIso = new Date().toISOString();
        const rec = {
          id: sanitizeString(req.body?.id, 40) || `OFF-${Date.now().toString().slice(-5)}`,
          gym_id: gymId,
          title,
          code,
          campaign_type: (req.body?.campaign_type || req.body?.campaignType || 'Coupon') as any,
          discount_type: (req.body?.discount_type || req.body?.discountType || 'percentage') as any,
          discount_value: Math.max(1, Number(req.body?.discount_value ?? req.body?.discountValue) || 10),
          applicable_plan: sanitizeString(req.body?.applicable_plan || req.body?.applicablePlan, 100) || 'All Membership Plans',
          valid_from: req.body?.valid_from || req.body?.validFrom || nowIso.split('T')[0],
          valid_until: req.body?.valid_until || req.body?.validUntil || computeExpiryDate(nowIso.split('T')[0], 1),
          usage_limit: Math.max(0, Number(req.body?.usage_limit ?? req.body?.usageLimit) || 100),
          redemptions: Math.max(0, Number(req.body?.redemptions) || 0),
          status: (req.body?.status || 'Active') as any,
          description: sanitizeString(req.body?.description, 400),
          created_at: nowIso,
          updated_at: nowIso,
        };
        draft.offers.unshift(rec);
        return rec;
      });
      res.status(201).json({ success: true, offer: created });
    } catch (err: any) {
      const msg = err?.message || 'Failed to create offer.';
      res.status(msg.toLowerCase().includes('unique') ? 409 : 400).json({ success: false, error: msg });
    }
  });

  router.put('/offers/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = String(req.params.id);
      const body = req.body || {};
      const updated = db.runTransaction((draft) => {
        const o = draft.offers.find((item) => item.id === id && item.gym_id === gymId);
        if (!o) throw new Error('Offer not found.');
        if (body.title !== undefined) o.title = sanitizeString(body.title, 120) || o.title;
        if (body.code !== undefined) o.code = sanitizeString(body.code, 40).toUpperCase() || o.code;
        if (body.status !== undefined) o.status = body.status;
        if (body.discount_value !== undefined || body.discountValue !== undefined) {
          o.discount_value = Math.max(1, Number(body.discount_value ?? body.discountValue));
        }
        if (body.redemptions !== undefined) o.redemptions = Math.max(0, Number(body.redemptions));
        if (body.valid_until !== undefined || body.validUntil !== undefined) {
          o.valid_until = sanitizeString(body.valid_until ?? body.validUntil, 20);
        }
        if (body.description !== undefined) o.description = sanitizeString(body.description, 400);
        o.updated_at = new Date().toISOString();
        return o;
      });
      res.json({ success: true, offer: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to update offer.' });
    }
  });

  router.delete('/offers/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = String(req.params.id);
      db.runTransaction((draft) => {
        const idx = draft.offers.findIndex((o) => o.id === id && o.gym_id === gymId);
        if (idx < 0) throw new Error('Offer not found.');
        draft.offers.splice(idx, 1);
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err?.message || 'Delete offer failed.' });
    }
  });

  // ==========================================================================
  // 13. REVIEWS & REPUTATION MANAGEMENT CRUD (MODULE 15)
  // ==========================================================================
  router.get('/reviews', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(getGymId(req));
    res.json({ success: true, reviews: snap.reviews });
  });

  router.post('/reviews', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const memberName = sanitizeString(req.body?.member_name || req.body?.memberName, 100);
      const comment = sanitizeString(req.body?.comment, 800);
      const rating = Math.min(5, Math.max(1, Number(req.body?.rating) || 5)) as 1 | 2 | 3 | 4 | 5;
      if (!memberName || !comment) {
        return res.status(400).json({ success: false, error: 'Member name and comment are required.' });
      }
      const created = db.runTransaction((draft) => {
        const nowIso = new Date().toISOString();
        const rec = {
          id: sanitizeString(req.body?.id, 40) || `REV-${Date.now().toString().slice(-5)}`,
          gym_id: gymId,
          member_id: req.body?.member_id ? Number(req.body.member_id) : null,
          member_name: memberName,
          rating,
          category: (req.body?.category || 'Facility') as any,
          comment,
          reply: req.body?.reply ? sanitizeString(req.body.reply, 800) : undefined,
          replied_at: req.body?.reply ? nowIso.split('T')[0] : undefined,
          status: (req.body?.reply ? 'Replied' : 'Pending') as 'Pending' | 'Replied',
          published_to_google: false,
          date: req.body?.date || nowIso.split('T')[0],
          created_at: nowIso,
          updated_at: nowIso,
        };
        draft.reviews.unshift(rec);
        return rec;
      });
      res.status(201).json({ success: true, review: created });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to record review.' });
    }
  });

  router.put('/reviews/:id', requireRoles(BILLING_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = String(req.params.id);
      const body = req.body || {};
      const updated = db.runTransaction((draft) => {
        const rev = draft.reviews.find((r) => r.id === id && r.gym_id === gymId);
        if (!rev) throw new Error('Review not found.');
        const nowIso = new Date().toISOString();
        if (body.reply !== undefined) {
          rev.reply = sanitizeString(body.reply, 800);
          rev.replied_at = nowIso.split('T')[0];
          rev.status = rev.reply ? 'Replied' : 'Pending';
        }
        if (body.status !== undefined) rev.status = body.status;
        if (body.comment !== undefined) rev.comment = sanitizeString(body.comment, 800);
        rev.updated_at = nowIso;
        return rev;
      });
      res.json({ success: true, review: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to update review.' });
    }
  });

  router.delete('/reviews/:id', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = getGymId(req);
      const id = String(req.params.id);
      db.runTransaction((draft) => {
        const idx = draft.reviews.findIndex((r) => r.id === id && r.gym_id === gymId);
        if (idx < 0) throw new Error('Review not found.');
        draft.reviews.splice(idx, 1);
      });
      res.json({ success: true, deletedId: id });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err?.message || 'Delete review failed.' });
    }
  });

  // ==========================================================================
  // 14. GYM REGISTRATION & SOCIAL LINKS (MODULE 16 — WORKFLOW K)
  // ==========================================================================
  router.get('/gyms', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (_req: Request, res: Response) => {
    const snap = db.getSnapshot();
    res.json({ success: true, gyms: snap.gyms });
  });

  router.post('/gyms', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const body = req.body || {};
      const name = sanitizeString(body.name || body.gymName, 120);
      const ownerName = sanitizeString(body.owner_name || body.ownerName, 120);
      const email = sanitizeString(body.email, 160);
      const mobile = normalizeMobile(body.mobile || body.mobileNumber || body.phone || '');
      if (!name || !ownerName || !email || mobile.length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Gym name, owner name, email, and valid 10-digit mobile number are required.',
        });
      }

      const saved = db.runTransaction((draft) => {
        const nowIso = new Date().toISOString();
        const gymId = sanitizeString(body.gym_id || body.gymId, 80) || `GYM-${Date.now().toString(36).toUpperCase()}`;
        const existingIdx = draft.gyms.findIndex((g) => g.gym_id === gymId);
        const existing = existingIdx >= 0 ? draft.gyms[existingIdx] : undefined;
        const record = {
          gym_id: gymId,
          name,
          owner_name: ownerName,
          email,
          mobile,
          upi_id: sanitizeString(body.upi_id || body.upiId, 100),
          address: sanitizeString(body.address, 250),
          google_maps_url: sanitizeString(body.google_maps_url || body.googleLocationUrl || body.googleLocation, 400),
          logo_url: String(body.logo_url || body.logoDataUrl || body.logo || existing?.logo_url || '').slice(0, 250000),
          signature_url: String(body.signature_url || body.signatureDataUrl || body.signature || existing?.signature_url || '').slice(0, 250000),
          registration_status: 'Verified' as const,
          whatsapp_url: sanitizeString(body.whatsapp_url ?? body.socialLinks?.whatsapp ?? existing?.whatsapp_url, 300),
          instagram_url: sanitizeString(body.instagram_url ?? body.socialLinks?.instagram ?? existing?.instagram_url, 300),
          facebook_url: sanitizeString(body.facebook_url ?? body.socialLinks?.facebook ?? existing?.facebook_url, 300),
          youtube_url: sanitizeString(body.youtube_url ?? body.socialLinks?.youtube ?? existing?.youtube_url, 300),
          created_at: existing?.created_at || nowIso,
          updated_at: nowIso,
        };
        if (existingIdx >= 0) {
          draft.gyms[existingIdx] = record;
        } else {
          draft.gyms.unshift(record);
        }
        draft.audit_logs.unshift({
          id: `AUD-${Date.now()}`,
          gym_id: gymId,
          actor: getActor(req),
          action: existingIdx >= 0 ? 'GYM_UPDATED' : 'GYM_REGISTERED',
          entity_type: 'gym',
          entity_id: gymId,
          details: `Saved gym registration for ${name} (${email}).`,
          created_at: nowIso,
        });
        return record;
      });

      res.status(201).json({ success: true, gym: saved });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to save gym registration.' });
    }
  });

  router.put('/gyms/:gymId/social-links', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = sanitizeString(req.params.gymId, 80);
      const body = req.body || {};
      const updated = db.runTransaction((draft) => {
        let g = draft.gyms.find((item) => item.gym_id === gymId);
        const nowIso = new Date().toISOString();
        if (!g) {
          g = {
            gym_id: gymId,
            name: sanitizeString(body.gymName, 120) || 'Fitness Future',
            owner_name: sanitizeString(body.ownerName, 120) || 'Gym Owner',
            email: sanitizeString(body.email, 160) || 'owner@fitnessfuture.in',
            mobile: normalizeMobile(body.mobile || '9829011223'),
            upi_id: sanitizeString(body.upiId, 100),
            address: sanitizeString(body.address, 250),
            google_maps_url: sanitizeString(body.googleLocationUrl, 400),
            logo_url: '',
            signature_url: '',
            registration_status: 'Verified',
            created_at: nowIso,
            updated_at: nowIso,
          };
          draft.gyms.push(g);
        }
        g.whatsapp_url = sanitizeString(body.whatsapp ?? body.whatsapp_url, 300);
        g.instagram_url = sanitizeString(body.instagram ?? body.instagram_url, 300);
        g.facebook_url = sanitizeString(body.facebook ?? body.facebook_url, 300);
        g.youtube_url = sanitizeString(body.youtube ?? body.youtube_url, 300);
        g.updated_at = nowIso;
        return g;
      });
      res.json({ success: true, gym: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to save social links.' });
    }
  });

  router.delete('/gyms/:gymId', requireRoles(['owner', 'admin'], { strictAuth: strict }), (req: Request, res: Response) => {
    try {
      const gymId = sanitizeString(req.params.gymId, 80);
      if (gymId === DEFAULT_GYM_ID) {
        return res.status(400).json({ success: false, error: 'Cannot delete primary default gym workspace.' });
      }
      db.runTransaction((draft) => {
        const idx = draft.gyms.findIndex((g) => g.gym_id === gymId);
        if (idx < 0) throw new Error('Gym profile not found.');
        draft.gyms.splice(idx, 1);
      });
      res.json({ success: true, deletedGymId: gymId });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err?.message || 'Delete gym failed.' });
    }
  });

  // ==========================================================================
  // 15. AUDIT LOGS & WHATSAPP LOGS
  // ==========================================================================
  router.get('/audit-logs', requireRoles(MANAGEMENT_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(req.query.gym_id ? getGymId(req) : undefined);
    res.json({ success: true, logs: snap.audit_logs.slice(0, 100) });
  });

  router.get('/whatsapp-logs', requireRoles(ALL_STAFF_ROLES, { strictAuth: strict }), (req: Request, res: Response) => {
    const snap = db.getSnapshot(req.query.gym_id ? getGymId(req) : undefined);
    res.json({ success: true, logs: snap.whatsapp_logs.slice(0, 100) });
  });

  return router;
}
