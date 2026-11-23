import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Building2,
  Upload,
  PenTool,
  CheckCircle2,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  X,
  AlertCircle,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { compressImageFile, normalizeSafeExternalUrl } from '../imageUpload';
import {
  RegisteredGymRecord,
  saveRegisteredGymToLocalDB,
  getAllRegisteredGymsFromLocalDB,
  deleteRegisteredGymFromLocalDB,
} from '../localGymDatabase';
import { useGym, GymConfig } from '../context/GymProvider';
import { useTenantStore } from '../store/useTenantStore';
import { useToast } from '../hooks/useToast';
import { gymApi } from '../services/gymApiClient';

interface FormState {
  gymId: string;
  gymName: string;
  ownerName: string;
  email: string;
  mobileNumber: string;
  upiId: string;
  googleLocationUrl: string;
  address: string;
  logoDataUrl: string;
  signatureDataUrl: string;
}

const EMPTY_FORM: FormState = {
  gymId: '',
  gymName: '',
  ownerName: '',
  email: '',
  mobileNumber: '',
  upiId: '',
  googleLocationUrl: '',
  address: '',
  logoDataUrl: '',
  signatureDataUrl: '',
};

type ValidatedField =
  | 'gymName'
  | 'ownerName'
  | 'email'
  | 'mobileNumber'
  | 'upiId'
  | 'googleLocationUrl'
  | 'logoDataUrl'
  | 'signatureDataUrl';

type FieldErrors = Partial<Record<ValidatedField, string>>;
type TouchedFields = Partial<Record<ValidatedField, boolean>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UPI_REGEX = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z0-9.-]{2,}$/;
const ALLOWED_PHONE_CHARS_REGEX = /^[+\d\s()-]*$/;

const validateSingleField = (field: ValidatedField, value: string): string | undefined => {
  const trimmed = value.trim();

  switch (field) {
    case 'gymName':
      if (!trimmed) return 'Gym name is required.';
      if (trimmed.length < 2) return 'Gym name must be at least 2 characters.';
      return undefined;

    case 'ownerName':
      if (!trimmed) return "Gym owner's name is required.";
      if (trimmed.length < 2) return "Owner's name must be at least 2 characters.";
      return undefined;

    case 'email':
      if (!trimmed) return 'Email address is required.';
      if (!EMAIL_REGEX.test(trimmed)) {
        return 'Enter a valid email address (e.g. owner@yourgym.com).';
      }
      return undefined;

    case 'mobileNumber': {
      if (!trimmed) return 'Mobile number is required.';
      if (!ALLOWED_PHONE_CHARS_REGEX.test(trimmed)) {
        return 'Use digits only (optional +, spaces, or hyphens).';
      }
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length < 10) {
        return `Mobile number must be at least 10 digits (${digits.length}/10 entered).`;
      }
      if (digits.length > 15) {
        return `Mobile number cannot exceed 15 digits (${digits.length} entered).`;
      }
      return undefined;
    }

    case 'upiId':
      if (!trimmed) return 'UPI ID is required.';
      if (!UPI_REGEX.test(trimmed)) {
        return 'Enter a valid UPI ID (e.g. yourgym@okicici).';
      }
      return undefined;

    case 'googleLocationUrl':
      if (!trimmed) return 'Google location link or address is required.';
      return undefined;

    case 'logoDataUrl':
      if (!trimmed) return 'Gym logo upload is required before submission.';
      return undefined;

    case 'signatureDataUrl':
      if (!trimmed) return "Owner's digital signature upload is required before submission.";
      return undefined;
  }
};

const ALL_VALIDATED_FIELDS: ValidatedField[] = [
  'gymName',
  'ownerName',
  'email',
  'mobileNumber',
  'upiId',
  'googleLocationUrl',
  'logoDataUrl',
  'signatureDataUrl',
];

const getAllFieldErrors = (state: FormState): FieldErrors => {
  const errors: FieldErrors = {};
  for (const field of ALL_VALIDATED_FIELDS) {
    const err = validateSingleField(field, state[field]);
    if (err) errors[field] = err;
  }
  return errors;
};

interface GymRegistrationFormProps {
  onBack?: () => void;
}

const GymRegistrationForm: React.FC<GymRegistrationFormProps> = ({ onBack }) => {
  const { currentGym, registerGymConfig, setCurrentGym } = useGym();
  const registerTenant = useTenantStore((s) => s.registerTenant);
  const updateTenantProfile = useTenantStore((s) => s.updateTenantProfile);
  const deleteTenant = useTenantStore((s) => s.deleteTenant);
  const { addToast } = useToast();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [registeredGyms, setRegisteredGyms] = useState<RegisteredGymRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<'logo' | 'signature' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<'logo' | 'signature' | null>(null);

  const gymNameInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);

  const fieldErrors = getAllFieldErrors(form);
  const isFormValid = Object.keys(fieldErrors).length === 0;
  const mobileDigitCount = form.mobileNumber.replace(/\D/g, '').length;

  const shouldShowFieldError = (field: ValidatedField): boolean => {
    if (!fieldErrors[field]) return false;
    if (hasAttemptedSubmit || touched[field]) return true;
    // Show real-time format/length feedback immediately while typing email, mobile, or UPI
    if (
      (field === 'email' || field === 'mobileNumber' || field === 'upiId') &&
      form[field].trim().length > 0
    ) {
      return true;
    }
    return false;
  };

  const getMissingRequirements = (): string[] => {
    const missing: string[] = [];
    if (fieldErrors.gymName) missing.push('Gym Name');
    if (fieldErrors.ownerName) missing.push('Owner Name');
    if (fieldErrors.email) missing.push('Valid Email');
    if (fieldErrors.mobileNumber) missing.push('10–15 Digit Mobile');
    if (fieldErrors.upiId) missing.push('Valid UPI ID');
    if (fieldErrors.googleLocationUrl) missing.push('Google Location');
    if (fieldErrors.logoDataUrl) missing.push('Gym Logo');
    if (fieldErrors.signatureDataUrl) missing.push('Owner Signature');
    return missing;
  };

  const missingRequirements = getMissingRequirements();

  const loadLocalGyms = useCallback(async () => {
    setIsLoadingDb(true);
    try {
      const records = await getAllRegisteredGymsFromLocalDB();
      setRegisteredGyms(records);
    } catch (err) {
      console.error('Failed to read local gym database:', err);
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    void loadLocalGyms();
  }, [loadLocalGyms]);

  const markFieldTouched = (field: ValidatedField) => {
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  };

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (ALL_VALIDATED_FIELDS.includes(field as ValidatedField)) {
      markFieldTouched(field as ValidatedField);
    }
    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);
  };

  const processImageUpload = async (file: File, target: 'logo' | 'signature') => {
    setUploadingField(target);
    setErrorMessage(null);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: target === 'logo' ? 420 : 520,
        maxHeight: target === 'logo' ? 420 : 220,
        quality: target === 'logo' ? 0.88 : 0.92,
        preserveAlpha: true,
      });

      setForm((prev) => ({
        ...prev,
        ...(target === 'logo'
          ? { logoDataUrl: compressed }
          : { signatureDataUrl: compressed }),
      }));
      markFieldTouched(target === 'logo' ? 'logoDataUrl' : 'signatureDataUrl');
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : `Unable to process ${target} image.`;
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setUploadingField(null);
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'logo' | 'signature'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      void processImageUpload(file, target);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, target: 'logo' | 'signature') => {
    e.preventDefault();
    setDragTarget(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processImageUpload(file, target);
    }
  };

  const validateForm = (): string | null => {
    const errors = getAllFieldErrors(form);
    const firstField = ALL_VALIDATED_FIELDS.find((f) => Boolean(errors[f]));
    return firstField ? errors[firstField] || null : null;
  };

  const toGymConfig = (record: RegisteredGymRecord): GymConfig => ({
    gymId: record.gymId,
    gymName: record.gymName,
    ownerName: record.ownerName,
    logoUrl: record.logoDataUrl,
    signatureUrl: record.signatureDataUrl,
    themeColor: 'amber',
    upiId: record.upiId,
    paymentUpiId: record.upiId,
    address: record.address || record.googleLocationUrl,
    googleLocationUrl: record.googleLocationUrl,
    phone: record.mobileNumber,
    whatsappNumber: record.mobileNumber,
    email: record.email,
    socialLinks: record.socialLinks || {},
    secretKey: `tenant_secret_${record.gymId}`,
    isSetupComplete: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      addToast(validationError, 'error');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const isEditing = Boolean(form.gymId);
      const normalizedGoogleUrl = normalizeSafeExternalUrl(form.googleLocationUrl);
      const resolvedAddress = form.address.trim() || form.googleLocationUrl.trim();
      const nowIso = new Date().toISOString();
      const existingRecord = isEditing
        ? registeredGyms.find((r) => r.gymId === form.gymId)
        : undefined;

      let finalGymId = form.gymId;

      if (isEditing) {
        updateTenantProfile(finalGymId, {
          gym_name: form.gymName.trim(),
          owner_name: form.ownerName.trim(),
          admin_name: form.ownerName.trim(),
          email_id: form.email.trim().toLowerCase(),
          phone_number: form.mobileNumber.trim(),
          location: resolvedAddress,
          google_location_url: normalizedGoogleUrl,
          upi_id: form.upiId.trim(),
          logo_url: form.logoDataUrl,
          signature_url: form.signatureDataUrl,
        });
      } else {
        const createdTenant = await registerTenant({
          gymName: form.gymName.trim(),
          ownerName: form.ownerName.trim(),
          adminName: form.ownerName.trim(),
          email: form.email.trim().toLowerCase(),
          phoneNumber: form.mobileNumber.trim(),
          location: resolvedAddress,
          googleLocationUrl: normalizedGoogleUrl,
          logoUrl: form.logoDataUrl,
          signatureUrl: form.signatureDataUrl,
          whatsappPhoneId: form.mobileNumber.trim(),
          upiId: form.upiId.trim(),
        });
        finalGymId =
          createdTenant?.gym_id ||
          `gym_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      }

      const savedRecord = await saveRegisteredGymToLocalDB({
        gymId: finalGymId,
        gymName: form.gymName.trim(),
        ownerName: form.ownerName.trim(),
        email: form.email.trim().toLowerCase(),
        mobileNumber: form.mobileNumber.trim(),
        upiId: form.upiId.trim(),
        address: resolvedAddress,
        googleLocationUrl: normalizedGoogleUrl,
        logoDataUrl: form.logoDataUrl,
        signatureDataUrl: form.signatureDataUrl,
        socialLinks: existingRecord?.socialLinks || {},
        createdAt: existingRecord?.createdAt || nowIso,
        updatedAt: nowIso,
      });

      registerGymConfig(toGymConfig(savedRecord));
      await loadLocalGyms();

      const msg = isEditing
        ? `Updated ${savedRecord.gymName} and synced portal branding.`
        : `Saved ${savedRecord.gymName} to the local database and set as active gym.`;
      setSuccessMessage(msg);
      addToast(msg, 'success');
      setForm(EMPTY_FORM);
      setTouched({});
      setHasAttemptedSubmit(false);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Could not save gym registration.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRecord = (record: RegisteredGymRecord) => {
    setForm({
      gymId: record.gymId,
      gymName: record.gymName,
      ownerName: record.ownerName,
      email: record.email,
      mobileNumber: record.mobileNumber,
      upiId: record.upiId,
      googleLocationUrl: record.googleLocationUrl,
      address: record.address,
      logoDataUrl: record.logoDataUrl,
      signatureDataUrl: record.signatureDataUrl,
    });
    setTouched({});
    setHasAttemptedSubmit(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleActivateRecord = (record: RegisteredGymRecord) => {
    setCurrentGym(toGymConfig(record));
    addToast(`Active gym switched to ${record.gymName}.`, 'success');
  };

  const handleDeleteRecord = async (gymId: string) => {
    try {
      await deleteRegisteredGymFromLocalDB(gymId);
      deleteTenant(gymId);
      void gymApi.deleteGym(gymId);
      setConfirmDeleteId(null);
      if (form.gymId === gymId) {
        setForm(EMPTY_FORM);
      }
      await loadLocalGyms();
      addToast('Gym removed from local database.', 'info');
    } catch (err) {
      console.error('Failed to delete gym record:', err);
      addToast('Could not remove gym record.', 'error');
    }
  };

  const previewMapUrl = normalizeSafeExternalUrl(form.googleLocationUrl);
  const filteredGyms = registeredGyms.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      g.gymName.toLowerCase().includes(q) ||
      g.ownerName.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.mobileNumber.toLowerCase().includes(q) ||
      g.upiId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1.5 max-w-2xl">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Portal Sign-In
            </button>
          )}
          <p className="text-xs font-medium text-amber-400">
            Gym Management Portal · Local IndexedDB Storage
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
            Gym Registration
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Capture owner contact details, UPI payment ID, Google Maps location, official logo, and owner digital signature. Saved entries persist locally and automatically brand receipts and the Member Portal.
          </p>
        </div>

        <div className="flex items-center gap-6 text-sm shrink-0">
          <div className="text-left md:text-right">
            <p className="text-xs text-zinc-400">Stored locally</p>
            <p className="font-mono tabular-nums text-lg font-semibold text-white">
              {registeredGyms.length} {registeredGyms.length === 1 ? 'Gym' : 'Gyms'}
            </p>
          </div>
          <div className="h-8 w-px bg-white/10" aria-hidden="true" />
          <div className="text-left md:text-right max-w-[200px]">
            <p className="text-xs text-zinc-400">Active in portal</p>
            <p className="text-sm font-semibold text-amber-400 truncate">
              {currentGym.gymName}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Workspace Split: Registration Form (Left) + Live Receipt Preview (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="xl:col-span-7 rounded-2xl border border-white/10 bg-zinc-950/90 p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                {form.gymId ? 'Edit Gym Profile' : 'Register a Gym'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                All fields marked with * (including Gym Logo and Owner Signature) are required.
              </p>
            </div>
            {form.gymId && (
              <button
                type="button"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setTouched({});
                  setHasAttemptedSubmit(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancel Edit
              </button>
            )}
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Owner & Gym Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1.5">
              <span className="block text-xs font-medium text-zinc-300">
                Gym Name *
              </span>
              <input
                ref={gymNameInputRef}
                type="text"
                required
                aria-invalid={shouldShowFieldError('gymName')}
                aria-describedby={shouldShowFieldError('gymName') ? 'gymName-error' : undefined}
                value={form.gymName}
                onChange={(e) => handleFieldChange('gymName', e.target.value)}
                onBlur={() => markFieldTouched('gymName')}
                placeholder="Apex Iron Fitness Club"
                className={`w-full rounded-lg border bg-zinc-900/80 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                  shouldShowFieldError('gymName')
                    ? 'border-red-500/70 focus:border-red-400 focus:ring-red-400'
                    : 'border-white/15 focus:border-amber-400 focus:ring-amber-400'
                }`}
              />
              {shouldShowFieldError('gymName') && (
                <p id="gymName-error" className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.gymName}</span>
                </p>
              )}
            </label>

            <label className="block space-y-1.5">
              <span className="block text-xs font-medium text-zinc-300">
                Gym Owner's Name *
              </span>
              <input
                type="text"
                required
                aria-invalid={shouldShowFieldError('ownerName')}
                aria-describedby={shouldShowFieldError('ownerName') ? 'ownerName-error' : undefined}
                value={form.ownerName}
                onChange={(e) => handleFieldChange('ownerName', e.target.value)}
                onBlur={() => markFieldTouched('ownerName')}
                placeholder="Rajesh Verma"
                className={`w-full rounded-lg border bg-zinc-900/80 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                  shouldShowFieldError('ownerName')
                    ? 'border-red-500/70 focus:border-red-400 focus:ring-red-400'
                    : 'border-white/15 focus:border-amber-400 focus:ring-amber-400'
                }`}
              />
              {shouldShowFieldError('ownerName') && (
                <p id="ownerName-error" className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.ownerName}</span>
                </p>
              )}
            </label>

            <label className="block space-y-1.5">
              <span className="flex items-center justify-between text-xs font-medium text-zinc-300">
                <span>Email Address *</span>
                {form.email.trim().length > 0 && !fieldErrors.email && (
                  <span className="text-emerald-400 font-normal flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                )}
              </span>
              <input
                type="email"
                required
                aria-invalid={shouldShowFieldError('email')}
                aria-describedby={shouldShowFieldError('email') ? 'email-error' : undefined}
                value={form.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                onBlur={() => markFieldTouched('email')}
                placeholder="owner@yourgym.com"
                className={`w-full rounded-lg border bg-zinc-900/80 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                  shouldShowFieldError('email')
                    ? 'border-red-500/70 focus:border-red-400 focus:ring-red-400'
                    : form.email.trim().length > 0 && !fieldErrors.email
                      ? 'border-emerald-500/60 focus:border-emerald-400 focus:ring-emerald-400'
                      : 'border-white/15 focus:border-amber-400 focus:ring-amber-400'
                }`}
              />
              {shouldShowFieldError('email') && (
                <p id="email-error" className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </label>

            <label className="block space-y-1.5">
              <span className="flex items-center justify-between text-xs font-medium text-zinc-300">
                <span>Mobile Number *</span>
                <span
                  className={`font-mono tabular-nums text-[11px] font-normal ${
                    mobileDigitCount === 0
                      ? 'text-zinc-500'
                      : !fieldErrors.mobileNumber
                        ? 'text-emerald-400'
                        : 'text-red-400'
                  }`}
                >
                  {mobileDigitCount}/10 digits{mobileDigitCount > 10 && mobileDigitCount <= 15 ? ' (valid)' : ''}
                </span>
              </span>
              <input
                type="tel"
                required
                aria-invalid={shouldShowFieldError('mobileNumber')}
                aria-describedby={shouldShowFieldError('mobileNumber') ? 'mobileNumber-error' : undefined}
                value={form.mobileNumber}
                onChange={(e) => handleFieldChange('mobileNumber', e.target.value)}
                onBlur={() => markFieldTouched('mobileNumber')}
                placeholder="+91 98765 43210"
                className={`w-full rounded-lg border bg-zinc-900/80 px-3.5 py-2.5 text-sm font-mono tabular-nums text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                  shouldShowFieldError('mobileNumber')
                    ? 'border-red-500/70 focus:border-red-400 focus:ring-red-400'
                    : form.mobileNumber.trim().length > 0 && !fieldErrors.mobileNumber
                      ? 'border-emerald-500/60 focus:border-emerald-400 focus:ring-emerald-400'
                      : 'border-white/15 focus:border-amber-400 focus:ring-amber-400'
                }`}
              />
              {shouldShowFieldError('mobileNumber') && (
                <p id="mobileNumber-error" className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.mobileNumber}</span>
                </p>
              )}
            </label>

            <label className="block space-y-1.5">
              <span className="flex items-center justify-between text-xs font-medium text-zinc-300">
                <span>UPI ID *</span>
                {form.upiId.trim().length > 0 && !fieldErrors.upiId && (
                  <span className="text-emerald-400 font-normal flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </span>
                )}
              </span>
              <input
                type="text"
                required
                aria-invalid={shouldShowFieldError('upiId')}
                aria-describedby={shouldShowFieldError('upiId') ? 'upiId-error' : undefined}
                value={form.upiId}
                onChange={(e) => handleFieldChange('upiId', e.target.value)}
                onBlur={() => markFieldTouched('upiId')}
                placeholder="yourgym@okicici"
                className={`w-full rounded-lg border bg-zinc-900/80 px-3.5 py-2.5 text-sm font-mono text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                  shouldShowFieldError('upiId')
                    ? 'border-red-500/70 focus:border-red-400 focus:ring-red-400'
                    : form.upiId.trim().length > 0 && !fieldErrors.upiId
                      ? 'border-emerald-500/60 focus:border-emerald-400 focus:ring-emerald-400'
                      : 'border-white/15 focus:border-amber-400 focus:ring-amber-400'
                }`}
              />
              {shouldShowFieldError('upiId') && (
                <p id="upiId-error" className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.upiId}</span>
                </p>
              )}
            </label>

            <label className="block space-y-1.5">
              <span className="block text-xs font-medium text-zinc-300">
                Google Location (Maps Link or Pin) *
              </span>
              <input
                type="text"
                required
                aria-invalid={shouldShowFieldError('googleLocationUrl')}
                aria-describedby={
                  shouldShowFieldError('googleLocationUrl') ? 'googleLocation-error' : undefined
                }
                value={form.googleLocationUrl}
                onChange={(e) => handleFieldChange('googleLocationUrl', e.target.value)}
                onBlur={() => markFieldTouched('googleLocationUrl')}
                placeholder="https://maps.app.goo.gl/... or City, Landmark"
                className={`w-full rounded-lg border bg-zinc-900/80 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 ${
                  shouldShowFieldError('googleLocationUrl')
                    ? 'border-red-500/70 focus:border-red-400 focus:ring-red-400'
                    : 'border-white/15 focus:border-amber-400 focus:ring-amber-400'
                }`}
              />
              {shouldShowFieldError('googleLocationUrl') && (
                <p id="googleLocation-error" className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.googleLocationUrl}</span>
                </p>
              )}
            </label>
          </div>

          {previewMapUrl && (
            <div className="flex items-center justify-between gap-3 text-xs text-zinc-400 border-t border-white/5 pt-3">
              <span className="truncate">
                Google Location link normalized for receipts and Member Portal
              </span>
              <a
                href={previewMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-amber-400 hover:text-amber-300 whitespace-nowrap shrink-0"
              >
                Open Maps <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <label className="block space-y-1.5">
            <span className="block text-xs font-medium text-zinc-300">
              Street Address (Optional)
            </span>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="2nd Floor, Main Plaza, Sector 14"
              className="w-full rounded-lg border border-white/15 bg-zinc-900/80 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </label>

          {/* Image Uploads: Gym Logo + Owner Digital Signature (Required) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
            {/* Gym Logo Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                <span>Gym Logo *</span>
                <span
                  className={`font-normal ${
                    form.logoDataUrl
                      ? 'text-emerald-400'
                      : shouldShowFieldError('logoDataUrl')
                        ? 'text-red-400'
                        : 'text-zinc-500'
                  }`}
                >
                  {form.logoDataUrl ? 'Uploaded' : 'Required'}
                </span>
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragTarget('logo');
                }}
                onDragLeave={() => setDragTarget(null)}
                onDrop={(e) => handleDrop(e, 'logo')}
                className={`rounded-xl border border-dashed p-4 transition-colors ${
                  dragTarget === 'logo'
                    ? 'border-amber-400 bg-amber-500/10'
                    : shouldShowFieldError('logoDataUrl')
                      ? 'border-red-500/70 bg-red-500/5'
                      : form.logoDataUrl
                        ? 'border-emerald-500/45 bg-zinc-900/50'
                        : 'border-white/20 bg-zinc-900/50 hover:border-white/35'
                }`}
              >
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handleFileInputChange(e, 'logo')}
                  className="hidden"
                />
                {form.logoDataUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-lg bg-zinc-950 border border-white/10 p-2 flex items-center justify-center overflow-hidden">
                      <img
                        src={form.logoDataUrl}
                        alt="Uploaded gym logo preview"
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 whitespace-nowrap cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('logoDataUrl', '')}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/15 whitespace-nowrap cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      markFieldTouched('logoDataUrl');
                      logoInputRef.current?.click();
                    }}
                    disabled={uploadingField === 'logo'}
                    className="w-full py-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                  >
                    <Upload className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-medium text-white">
                      {uploadingField === 'logo' ? 'Compressing Logo...' : 'Upload Gym Logo'}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Drag & drop or click · PNG, JPG, WebP
                    </span>
                  </button>
                )}
              </div>
              {shouldShowFieldError('logoDataUrl') && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.logoDataUrl}</span>
                </p>
              )}
            </div>

            {/* Owner's Digital Signature Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-300">
                <span>Owner's Digital Signature *</span>
                <span
                  className={`font-normal ${
                    form.signatureDataUrl
                      ? 'text-emerald-400'
                      : shouldShowFieldError('signatureDataUrl')
                        ? 'text-red-400'
                        : 'text-zinc-500'
                  }`}
                >
                  {form.signatureDataUrl ? 'Uploaded' : 'Required'}
                </span>
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragTarget('signature');
                }}
                onDragLeave={() => setDragTarget(null)}
                onDrop={(e) => handleDrop(e, 'signature')}
                className={`rounded-xl border border-dashed p-4 transition-colors ${
                  dragTarget === 'signature'
                    ? 'border-amber-400 bg-amber-500/10'
                    : shouldShowFieldError('signatureDataUrl')
                      ? 'border-red-500/70 bg-red-500/5'
                      : form.signatureDataUrl
                        ? 'border-emerald-500/45 bg-zinc-900/50'
                        : 'border-white/20 bg-zinc-900/50 hover:border-white/35'
                }`}
              >
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFileInputChange(e, 'signature')}
                  className="hidden"
                />
                {form.signatureDataUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-full h-24 rounded-lg bg-white border border-zinc-300 p-2 flex items-center justify-center overflow-hidden">
                      <img
                        src={form.signatureDataUrl}
                        alt="Uploaded owner digital signature preview"
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => signatureInputRef.current?.click()}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 whitespace-nowrap cursor-pointer"
                      >
                        Replace
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFieldChange('signatureDataUrl', '')}
                        className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/15 whitespace-nowrap cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      markFieldTouched('signatureDataUrl');
                      signatureInputRef.current?.click();
                    }}
                    disabled={uploadingField === 'signature'}
                    className="w-full py-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer"
                  >
                    <PenTool className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-medium text-white">
                      {uploadingField === 'signature'
                        ? 'Processing Signature...'
                        : 'Upload Owner Signature'}
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Transparent PNG or clean white scan
                    </span>
                  </button>
                )}
              </div>
              {shouldShowFieldError('signatureDataUrl') && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.signatureDataUrl}</span>
                </p>
              )}
            </div>
          </div>

          {/* Pre-submission Validation Readiness Status */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            {!isFormValid ? (
              <p className="text-xs text-zinc-400 leading-relaxed">
                <span className="font-medium text-zinc-300">Required to submit: </span>
                {missingRequirements.join(' · ')}
              </p>
            ) : (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>All required details, gym logo, and owner signature are validated and ready to save.</span>
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                disabled={!isFormValid || isSaving || uploadingField !== null}
                className="rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold text-zinc-950 transition-colors whitespace-nowrap cursor-pointer"
              >
                {isSaving
                  ? 'Saving...'
                  : form.gymId
                    ? 'Save Changes'
                    : 'Save Gym Registration'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(EMPTY_FORM);
                  setTouched({});
                  setHasAttemptedSubmit(false);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-white/5 transition-colors whitespace-nowrap cursor-pointer"
              >
                Reset Form
              </button>
            </div>
          </div>
        </form>

        {/* Live Official Receipt Preview */}
        <div className="xl:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span className="font-medium text-zinc-300">Live Receipt Preview</span>
            <span className="font-mono tabular-nums">{new Date().toLocaleDateString()}</span>
          </div>

          <div className="rounded-2xl bg-white text-zinc-900 p-6 border border-zinc-200 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
                  {form.logoDataUrl ? (
                    <img
                      src={form.logoDataUrl}
                      alt="Receipt logo preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Building2 className="w-5 h-5 text-zinc-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-zinc-900 truncate">
                    {form.gymName.trim() || 'Gym Name'}
                  </h3>
                  <p className="text-xs text-zinc-500 truncate">
                    Owner: {form.ownerName.trim() || 'Owner Name'}
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold text-zinc-600 whitespace-nowrap shrink-0">
                Official Receipt
              </p>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <dt className="text-zinc-500">Email</dt>
                <dd className="font-medium text-zinc-900 truncate mt-0.5">
                  {form.email.trim() || 'owner@yourgym.com'}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Mobile</dt>
                <dd className="font-mono tabular-nums font-medium text-zinc-900 truncate mt-0.5">
                  {form.mobileNumber.trim() || '+91 98765 43210'}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">UPI ID</dt>
                <dd className="font-mono font-medium text-emerald-700 truncate mt-0.5">
                  {form.upiId.trim() || 'yourgym@upi'}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Location</dt>
                <dd className="font-medium text-zinc-900 truncate mt-0.5">
                  {form.address.trim() || form.googleLocationUrl.trim() || 'Google Maps Pin'}
                </dd>
              </div>
            </dl>

            <div className="border-t border-dashed border-zinc-300 pt-4 flex items-end justify-between gap-4">
              <div className="text-xs text-zinc-500 space-y-0.5">
                <p className="font-medium text-zinc-800">Member Portal Synced</p>
                <p>Receipts and member UPI QRs use these credentials.</p>
              </div>
              <div className="text-right shrink-0">
                <div className="h-12 w-36 border-b border-zinc-400 flex items-center justify-center mb-1">
                  {form.signatureDataUrl ? (
                    <img
                      src={form.signatureDataUrl}
                      alt="Owner digital signature on receipt"
                      referrerPolicy="no-referrer"
                      className="max-h-11 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[11px] italic text-zinc-400">
                      Digital Signature
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-zinc-700">
                  {form.ownerName.trim() || 'Authorized Signatory'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Registered Gyms Local Database Directory */}
      <section className="space-y-5 pt-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Registered Gyms in Local Database
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Persisted in browser IndexedDB. Activate any gym to update receipts and Member Portal branding.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gym, owner, UPI..."
              className="w-full rounded-lg border border-white/15 bg-zinc-950 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {isLoadingDb ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((skeleton) => (
              <div
                key={skeleton}
                className="h-44 rounded-2xl border border-white/10 bg-zinc-950/60 p-5 animate-pulse"
              />
            ))}
          </div>
        ) : filteredGyms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/50 py-12 px-6 text-center space-y-3">
            <p className="text-sm font-medium text-zinc-200">
              {registeredGyms.length === 0
                ? 'No gyms registered in the local database yet'
                : 'No registered gyms match your search'}
            </p>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              {registeredGyms.length === 0
                ? 'Complete the registration form above to store a gym profile, logo, and owner signature locally.'
                : 'Try searching with a different gym name, owner name, email, or UPI ID.'}
            </p>
            {registeredGyms.length === 0 && (
              <button
                type="button"
                onClick={() => gymNameInputRef.current?.focus()}
                className="inline-flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer"
              >
                Register First Gym
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGyms.map((gym) => {
              const isActive = currentGym.gymId === gym.gymId;
              const safeMapLink = normalizeSafeExternalUrl(gym.googleLocationUrl);

              return (
                <article
                  key={gym.gymId}
                  className={`rounded-2xl border p-5 space-y-4 transition-colors ${
                    isActive
                      ? 'border-amber-400/60 bg-zinc-950'
                      : 'border-white/10 bg-zinc-950/80 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {gym.logoDataUrl ? (
                          <img
                            src={gym.logoDataUrl}
                            alt={`${gym.gymName} logo`}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-zinc-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white truncate">
                          {gym.gymName}
                        </h3>
                        <p className="text-xs text-zinc-400 truncate">
                          {gym.ownerName}
                          {isActive ? ' · Active in Portal' : ''}
                        </p>
                      </div>
                    </div>

                    {gym.signatureDataUrl && (
                      <div className="h-9 w-20 rounded-md bg-white border border-zinc-300 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={gym.signatureDataUrl}
                          alt={`${gym.ownerName} digital signature`}
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-zinc-300">
                    <p className="truncate">
                      <span className="text-zinc-500">Email: </span>
                      {gym.email}
                    </p>
                    <p className="font-mono tabular-nums truncate">
                      <span className="font-sans text-zinc-500">Mobile: </span>
                      {gym.mobileNumber}
                    </p>
                    <p className="font-mono text-emerald-400 truncate">
                      <span className="font-sans text-zinc-500">UPI: </span>
                      {gym.upiId}
                    </p>
                    {safeMapLink && (
                      <a
                        href={safeMapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 truncate"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Google Maps Location</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => handleActivateRecord(gym)}
                          className="rounded-lg border border-emerald-500/35 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/15 whitespace-nowrap cursor-pointer"
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEditRecord(gym)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10 whitespace-nowrap cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </div>

                    {confirmDeleteId === gym.gymId ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleDeleteRecord(gym.gymId)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 whitespace-nowrap cursor-pointer"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/10 whitespace-nowrap cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(gym.gymId)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/15 whitespace-nowrap cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default GymRegistrationForm;
