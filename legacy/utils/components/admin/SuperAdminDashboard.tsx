import { getCurrencySymbol } from '../../store/useCurrencyStore';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, Users, Activity, Crown, Database, Globe, Zap, ArrowRight, 
  AlertTriangle, CheckCircle2, Info, DollarSign, Radio, Map, TrendingUp, 
  RefreshCcw, Plus, Sliders, Smartphone, Send, Shield, Lock, Unlock, 
  Layers, Terminal, Wifi, Search, HelpCircle, Check, Copy, ShoppingCart, Target, MessageCircle,
  History, Download
} from 'lucide-react';
import { 
  ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area, ComposedChart, Line, BarChart, Bar, CartesianGrid
} from 'recharts';
import { useGym } from '../../context/GymProvider';
import { SaaSAdminOnboarding } from './SaaSAdminOnboarding';
import { SuperAdminMasterGovernance } from './SuperAdminMasterGovernance';
import { SuperAdminFirestoreUsersPanel } from './SuperAdminFirestoreUsersPanel';
import { SubscriptionOverview } from './SubscriptionOverview';
import { AdminActivityLog, recordAdminActivity } from './AdminActivityLog';
import { ForceUnlockAuditLogsTab } from './ForceUnlockAuditLogsTab';
import { AdminStatsWidget } from './AdminStatsWidget';
import { AdminRoleManagement } from './AdminRoleManagement';
import { downloadForceUnlockLogsCsv } from '../../exportForceUnlockLogs';
import { auth, syncToFirebase, subscribeToCollection } from '../../../lib/firebase';
import { forceUnlockLoggingMiddleware } from '../../middleware/forceUnlockLoggingMiddleware';
import { useTenantStore } from '../../store/useTenantStore';
import { useData } from '../../context/DataProvider';
import { useToast } from '../../hooks/useToast';
import ThreeTierArchitectureEngine from '../ThreeTierArchitectureEngine';


// Structured Interface for live simulated transaction stream
interface SaasLiveTransaction {
  id: string;
  gymName: string;
  member: string;
  amount: number;
  time: string;
  channel: 'UPI' | 'Razorpay' | 'Stripe' | 'Card';
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
}

// active location markers on the Cyber-Geographic SVG grid
interface CyberLocation {
  id: string;
  name: string;
  region: string;
  status: 'ONLINE' | 'STANDBY' | 'LOAD_HEAVY' | 'OFFLINE';
  membersCount: number;
  mrr: number;
  coords: { x: number; y: number };
}

const SuperAdminDashboard: React.FC<{ setCurrentView?: (view: string) => void }> = ({ setCurrentView }) => {
  const { availableGyms, currentGym, setCurrentGym } = useGym();
  const { tenants, updateTenantStatus, deleteTenant, toggleAdminLock, toggleMemberLock } = useTenantStore();
  const { members, addMember, updateMember } = useData();
  const { addToast } = useToast();

  const [isUnlockingAccount, setIsUnlockingAccount] = useState<boolean>(false);
  const [unlockTargetInput, setUnlockTargetInput] = useState<string>('');
  const [activeDashboardTab, setActiveDashboardTab] = useState<'matrix' | 'three_tier' | 'audit_logs' | 'users' | 'roles' | 'governance'>('three_tier');
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);

  /**
   * Downloads 'force_unlock_logs' from Firestore into a CSV format for archival purposes.
   */
  const handleDownloadLogsCsv = async () => {
    setIsExportingCsv(true);
    try {
      const res = await downloadForceUnlockLogsCsv();
      addToast(`Archived ${res.count} records from 'force_unlock_logs' into "${res.filename}"!`, 'success');
    } catch (err: any) {
      console.error('[SuperAdminDashboard] Export force_unlock_logs CSV error:', err);
      addToast('Failed to export force_unlock_logs to CSV.', 'error');
    } finally {
      setIsExportingCsv(false);
    }
  };

  /**
   * Core unlock execution that sets subscription_status to 'ACTIVE' in Firestore.
   */
  const executeUnlockAccount = async (
    cleanUserId: string,
    targetType?: string
  ): Promise<{ success: boolean; targetDisplayName: string; targetDocId: string }> => {
    const nowIso = new Date().toISOString();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    // 1. Identify matched member or tenant from local store if available
    const numericId = Number(cleanUserId.replace('member_', ''));
    const localMember = !isNaN(numericId)
      ? members.find(m => m.id === numericId || m.phone.includes(cleanUserId) || m.email.toLowerCase() === cleanUserId.toLowerCase())
      : members.find(m => m.phone.includes(cleanUserId) || m.email.toLowerCase() === cleanUserId.toLowerCase());

    const cleanTenantId = cleanUserId.replace('admin_', '');
    const localTenant = tenants.find(
      t => t.gym_id === cleanTenantId ||
           (t as any).id === cleanTenantId ||
           t.email_id.toLowerCase() === cleanUserId.toLowerCase() ||
           t.phone_number.includes(cleanUserId)
    );

    const targetDocId = localMember
      ? `member_${localMember.id}`
      : localTenant
      ? `admin_${localTenant.gym_id}`
      : cleanUserId;

    const targetDisplayName = localMember?.name || localTenant?.gym_name || localTenant?.admin_name || cleanUserId;

    // 2. Prepare payload setting subscription_status to 'ACTIVE'
    const firestorePayload = {
      subscription_status: 'ACTIVE',
      status: 'Active',
      account_locked: false,
      accountLocked: false,
      forceUnlocked: true,
      forceUnlockedAt: nowIso,
      subscription_expiry_date: futureDateStr,
      subscription_expires_at: futureDateStr,
      expiryDate: futureDateStr,
      lastUnlockedBy: auth.currentUser?.email || 'SuperAdmin',
      lastUnlockedByAdminUid: auth.currentUser?.uid || 'usr_super_fitness_future',
      updatedAt: nowIso,
    };

    // 3. Write directly to Firestore 'users' collection
    await syncToFirebase('users', targetDocId, {
      uid: targetDocId,
      id: targetDocId,
      name: targetDisplayName,
      email: localMember?.email || localTenant?.email_id || '',
      phone: localMember?.phone || localTenant?.phone_number || '',
      role: localTenant ? 'admin' : 'member',
      ...firestorePayload,
    });

    // 4. Update member-specific collections and stores
    if (localMember || cleanUserId.startsWith('member_') || targetType === 'member') {
      const memId = localMember ? localMember.id : numericId;
      if (!isNaN(memId)) {
        toggleMemberLock(memId, false);
        if (localMember) {
          updateMember({
            ...localMember,
            status: 'Active',
            expiryDate: futureDateStr,
            accountLocked: false,
          } as any);
        }
        await syncToFirebase('members', String(memId), {
          id: memId,
          ...firestorePayload,
        });
      }
    }

    // 5. Update tenant-specific collections and stores
    if (localTenant || cleanUserId.startsWith('admin_') || targetType === 'tenant') {
      const tId = localTenant ? localTenant.gym_id : cleanTenantId;
      toggleAdminLock(tId, false);
      updateTenantStatus(tId, 'Active');
      await syncToFirebase('tenants', tId, {
        gym_id: tId,
        id: tId,
        ...firestorePayload,
      });
    }

    return { success: true, targetDisplayName, targetDocId };
  };

  /**
   * Logging middleware for Force Unlock actions.
   * Intercepts every 'Force Unlock' action performed by admins, capturing
   * admin UID, target user UID, and timestamp, then persisting the audit log in Firestore.
   */
  const unlockAccount = async (userId: string, targetType?: string): Promise<boolean> => {
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      addToast('Please enter a valid user ID, email, or phone number to unlock.', 'warning');
      return false;
    }

    const cleanUserId = userId.trim();
    setIsUnlockingAccount(true);

    try {
      const currentAuthUser = auth.currentUser;
      const adminUid = currentAuthUser?.uid || 'owner_primary';
      const adminEmail = currentAuthUser?.email || 'owner@fitnessfuture.in';

      // Intercept and record via Force Unlock Logging Middleware
      const unlockSuccess = await forceUnlockLoggingMiddleware<boolean>(
        {
          targetUserUid: cleanUserId,
          targetType,
          adminUid,
          adminEmail,
          reason: 'Super Admin Force Unlock Command',
        },
        async (ctx) => {
          const res = await executeUnlockAccount(ctx.targetUserUid, ctx.targetType);
          return res.success;
        }
      );

      if (unlockSuccess) {
        addToast(
          `Force Unlock recorded by Admin [${adminUid.substring(0, 10)}...]. User "${cleanUserId}" subscription_status set to ACTIVE!`,
          'success'
        );
        setUnlockTargetInput('');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('[SuperAdminDashboard] Error in unlockAccount:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown Firestore communication error';
      addToast(
        `Failed to unlock account for "${userId}". Error: ${errorMessage}`,
        'error'
      );
      return false;
    } finally {
      setIsUnlockingAccount(false);
    }
  };

  // State to hold users retrieved in real-time from Firestore
  const [retrievedFirestoreUsers, setRetrievedFirestoreUsers] = useState<any[]>([]);

  // Retrieve all users from Firestore
  useEffect(() => {
    let isSubscribed = true;
    const unsub = subscribeToCollection('users', (docs) => {
      if (!isSubscribed) return;
      if (docs && docs.length > 0) {
        setRetrievedFirestoreUsers(docs);
      }
    });

    return () => {
      isSubscribed = false;
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  interface FirestoreUserRow {
    uid: string;
    id?: string | number;
    fullName: string;
    phone: string;
    email: string;
    role: string;
    subscriptionStatus: string;
    creationDate: string;
  }

  // Unified list of all users from Firestore + local state for table display
  const allFirestoreUsersList = useMemo<FirestoreUserRow[]>(() => {
    const map = new globalThis.Map<string, FirestoreUserRow>();

    // Root super admin
    map.set('super_admin_root', {
      uid: auth.currentUser?.uid || 'super_admin_root',
      fullName: auth.currentUser?.displayName || 'Fitness Future Owner',
      phone: '+91 98XXXXXXXX',
      email: auth.currentUser?.email || 'owner@fitnessfuture.in',
      role: 'super_admin',
      subscriptionStatus: 'ACTIVE',
      creationDate: '2024-01-01',
    });

    // Tenants (Franchise Gym Admins)
    tenants.forEach(t => {
      const uid = `admin_${t.gym_id || (t as any).id}`;
      map.set(uid, {
        uid,
        id: t.gym_id,
        fullName: t.admin_name || t.gym_name || 'Gym Admin',
        phone: t.phone_number || '+91 98290 00000',
        email: t.email_id,
        role: 'admin',
        subscriptionStatus: (t.subscription_status === 'Active' ? 'ACTIVE' : t.subscription_status === 'Trial' ? 'TRIAL' : 'LOCKED'),
        creationDate: (t.created_at || '2025-01-15').split('T')[0],
      });
    });

    // Members
    members.forEach(m => {
      const uid = `member_${m.id}`;
      map.set(uid, {
        uid,
        id: m.id,
        fullName: m.name,
        phone: m.phone || '+91 98290 12345',
        email: m.email,
        role: 'member',
        subscriptionStatus: ((m as any).accountLocked ? 'LOCKED' : m.status === 'Active' ? 'ACTIVE' : m.status === 'Expired' ? 'EXPIRED' : 'PENDING'),
        creationDate: (m.joinDate || '2025-01-01').split('T')[0],
      });
    });

    // Merged with direct Firestore `users` documents
    retrievedFirestoreUsers.forEach(u => {
      const uid = String(u.uid || u.id || '');
      if (!uid) return;
      const existing = map.get(uid);
      const rawStatus = String(u.subscription_status || u.subscriptionStatus || (u.account_locked ? 'LOCKED' : u.status === 'Active' ? 'ACTIVE' : existing?.subscriptionStatus || 'ACTIVE')).toUpperCase();
      map.set(uid, {
        uid,
        id: u.id || uid,
        fullName: u.fullName || u.name || existing?.fullName || 'User',
        phone: u.phone || u.phoneNumber || existing?.phone || '+91 98XXXXXXXX',
        email: u.email || existing?.email || '',
        role: u.role || existing?.role || 'member',
        subscriptionStatus: rawStatus,
        creationDate: (u.createdAt || u.creationDate || existing?.creationDate || '2025-01-01').split('T')[0],
      });
    });

    return Array.from(map.values());
  }, [retrievedFirestoreUsers, members, tenants]);

  const [whatsappCustomTemplate, setWhatsappCustomTemplate] = useState<string>(
    `*🛡️ Fitness Future OS: Passwordless Active! *\nHello {name}! The Admin has admitted you to the "Fitness Future OS" portal.\nSince password security can be weak, we use a fully secure passwordless experience instead.\n\nClick the secure Magic Link below to enroll your fingerprint or FaceID directly:\n🔗 *https://fitnessfuture.os/vault-activation?id={token}*`
  );
  const [apiNodes, setApiNodes] = useState([
    { name: 'Google Cloud Storage', key: 'gcs', status: 'ONLINE', latency: '42ms', desc: 'SaaS tenant assets, avatar media and profile uploads' },
    { name: 'Supabase Central Auth', key: 'supabase', status: 'ONLINE', latency: '15ms', desc: 'Secure database user authentication & secure session checks' },
    { name: 'SendGrid SMTP OTP Gateway', key: 'sendgrid', status: 'ONLINE', latency: '128ms', desc: 'Admin two-factor email OTP login verification' },
    { name: 'n8n Workflow Webhooks', key: 'n8n', status: 'ONLINE', latency: '24ms', desc: 'Automated multi-system triggers and background webhooks' },
    { name: 'WhatsApp Business Cloud API', key: 'whatsapp', status: 'ONLINE', latency: '210ms', desc: 'Instant OTP alerts and passwordless enrollment distribution' },
  ]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // --- CORE SAAS ENGINES SEQUENTIAL AUTOMATION STATE ---
  const [isSaaSAutoRunning, setIsSaaSAutoRunning] = useState(false);
  const [saasCurrentStep, setSaasCurrentStep] = useState<'idle' | 'biometric' | 'kitchen' | 'titan' | 'optimized'>('idle');
  const [saasBiometricProgress, setSaasBiometricProgress] = useState(0);
  const [saasKitchenCalories, setSaasKitchenCalories] = useState(0);
  const [saasTitanJointAngle, setSaasTitanJointAngle] = useState(0);
  const [saasAutoLogs, setSaasAutoLogs] = useState<string[]>([]);
  
  // Custom interactive state parameters
  const [selectedLocation, setSelectedLocation] = useState<string>('fitness_future_01');
  const [isSimulatingStream, setIsSimulatingStream] = useState(false);
  const [liveTransactions, setLiveTransactions] = useState<SaasLiveTransaction[]>([]);

  // Subscription Pricing Tier matrix configurations
  const [pricingTiers, setPricingTiers] = useState([
    { id: 'tier_starter', name: 'Starter Base', price: 99, features: { aiDiet: true, faceId: false, audioCoach: false, liveCrowd: false }, activeTenants: 0 },
    { id: 'tier_scale', name: 'Scale Core', price: 199, features: { aiDiet: true, faceId: true, audioCoach: true, liveCrowd: false }, activeTenants: 0 },
    { id: 'tier_singularity', name: 'VIP Full OS', price: 499, features: { aiDiet: true, faceId: true, audioCoach: true, liveCrowd: true }, activeTenants: 0 }
  ]);

  // Active pricing matrix modifier values (customizable by super admin)
  const [globalPlatformFeeMarkup, setGlobalPlatformFeeMarkup] = useState<number>(0); // slider percent

  // Diagnostic Admission test simulator setup
  const [testUser, setTestUser] = useState({ name: '', email: '', phone: '' });
  const [isTestOnboarding, setIsTestOnboarding] = useState(false);
  const [testLogs, setTestLogs] = useState<{ step: number; title: string; txt: string; status: 'pending' | 'active' | 'success' | 'fail' }[]>([
    { step: 1, title: 'Database User Account Trigger', txt: 'Ready for activation', status: 'pending' },
    { step: 2, title: 'Automated Message Dispatch', txt: 'Awaiting webhook dispatch instructions', status: 'pending' },
    { step: 3, title: 'Passkeys WebAuthn Key Generation', txt: 'Ready for device sensor validation handshake', status: 'pending' },
  ]);
  const [whatsappMockReceived, setWhatsappMockReceived] = useState<string | null>(null);
  const [deviceSensorActive, setDeviceSensorActive] = useState(false);
  const [registeredBiometricsInStore, setRegisteredBiometricsInStore] = useState<boolean>(false);
  const [deviceScanProgress, setDeviceScanProgress] = useState(0);

  // Geographic nodes data
  const geographicNodes = useMemo<CyberLocation[]>(() => [
    { id: 'fitness_future_01', name: 'Fitness Future HQ', region: 'Primary Headquarters', status: 'ONLINE', membersCount: 0, mrr: 0, coords: { x: 230, y: 120 } }
  ], []);

  // Sync historical audit logs with state
  useEffect(() => {
    const logs = JSON.parse(localStorage.getItem('neural_audit_logs') || '[]');
    setAuditLogs(logs);
  }, []);

  // Live transaction stream stays connected to real transactions only (no demo generator)
  useEffect(() => {
    if (!isSimulatingStream) return;
    return () => {};
  }, [isSimulatingStream]);

  // Handle Admission Simulator Progression Trigger
  const triggerAdmitMemberSimulator = () => {
    if (!testUser.name || !testUser.phone || !testUser.email) return;
    setIsTestOnboarding(true);
    setRegisteredBiometricsInStore(false);
    setWhatsappMockReceived(null);
    setDeviceScanProgress(0);

    // Initial logs setup
    setTestLogs([
      { step: 1, title: 'Supabase User Account Trigger', txt: 'Executing supabase.auth.admin.createUser() payload...', status: 'active' },
      { step: 2, title: 'n8n Message Generation & Dispersal', txt: 'Awaiting trigger codes...', status: 'pending' },
      { step: 3, title: 'Passkeys WebAuthn Key Generation', txt: 'Awaiting device authentication protocols...', status: 'pending' },
    ]);

    // Timeline steps for visual immersion
    setTimeout(() => {
      // Step 1 Finish -> Step 2 Active
      setTestLogs(prev => [
        { ...prev[0], txt: 'User created in authDB schema successfully (UUID: ' + Math.random().toString(36).substring(2, 11) + ')', status: 'success' },
        { ...prev[1], txt: 'Compiling payload matrix: ' + JSON.stringify({ to: testUser.phone, link: `https://thesingularity.os/member-vault?token=${Math.random().toString(36).substring(7)}` }), status: 'active' },
        prev[2]
      ]);

      // Populate mock WhatsApp receive screen by replacing placeholders dynamically
      const formattedMsg = whatsappCustomTemplate
        .replace(/{name}/g, testUser.name)
        .replace(/{token}/g, Math.random().toString(36).substring(7));
      setWhatsappMockReceived(formattedMsg);
    }, 1500);

    setTimeout(() => {
      // Step 2 Finish -> Step 3 Active
      setTestLogs(prev => [
        prev[0],
        { ...prev[1], txt: 'WhatsApp API Status code 200: MESSAGE_DISPATCHED (Ref: WA-' + Math.floor(Math.random() * 8999 + 1000) + ')', status: 'success' },
        { ...prev[2], txt: 'Awaiting member biometric terminal trigger on their target smartphone...', status: 'active' }
      ]);
      setDeviceSensorActive(true);
    }, 3200);
  };

  // Process scanning of the biometric sensor on member's simulated smartphone
  const simulateSensorScan = () => {
    if (!deviceSensorActive) return;
    let currentVal = 0;
    const interval = setInterval(() => {
      currentVal += 15;
      if (currentVal >= 100) {
        setDeviceScanProgress(100);
        interval && clearInterval(interval);
        setTimeout(() => {
          setDeviceSensorActive(false);
          setRegisteredBiometricsInStore(true);
          setTestLogs(prev => [
            prev[0],
            prev[1],
            { ...prev[2], txt: 'WebAuthn Public Key parsed & bound in tenant database ledger securely!', status: 'success' }
          ]);

          // Programmatically add the test user Rohit Kumar to list of members!
          const newId = Math.max(0, ...members.map(m => m.id)) + 1;
          const tokenStr = Math.random().toString(36).substring(7);
          const newMember = {
            id: newId,
            name: testUser.name,
            email: testUser.email,
            phone: testUser.phone,
            joinDate: new Date().toISOString().split('T')[0],
            packageId: 1, // Default package
            status: 'Active',
            avatar: `https://i.pravatar.cc/150?u=${newId}`,
            whatsappConsent: true,
            biometricCredentials: [
              {
                credentialId: `cred-${tokenStr}`,
                publicKey: "PUBLIC_KEY_OK",
                algorithm: "ES256",
                label: "FaceID",
                createdAt: new Date().toISOString()
              }
            ],
            xp: 150,
            level: 1,
            achievements: ["Bio-Certified"],
            hrv: 72,
            lbm: 58,
            health_score: 92,
            bio_age: 24,
            walletBalance: 1000,
            assigned_tests: [],
            medical_history: { conditions: [], pastInjuries: '', medications: '', lifestyle: {} },
            physical_metrics: { height: 175, weight: 70, body_fat: 14, muscle_mass: 32, target_weight: 72, body_type: 'Mesomorph', activity_level: 'Moderate' },
            height: 175,
            weight: 70,
            bodyFat: 14,
            muscleMass: 32,
            onboardingCompleted: true,
            automation_settings: { remind_12hrs_before: true, auto_renewal: true, ai_coaching: true, sync_id: '' }
          };
          addMember(newMember as any);
        }, 500);
      } else {
        setDeviceScanProgress(currentVal);
      }
    }, 150);
  };

  // --- START CORE SAAS SEQUENTIAL AUTOMATION PROTOCOL ---
  const startCoreSaaSAutomation = () => {
    if (isSaaSAutoRunning) return;
    setIsSaaSAutoRunning(true);
    setSaasCurrentStep('biometric');
    setSaasBiometricProgress(0);
    setSaasKitchenCalories(0);
    setSaasTitanJointAngle(20);
    setSaasAutoLogs([
      "🔄 [OS] Starting core automation sequence...",
      "📡 [Biometrics] Establishing connection with beacons...",
    ]);

    // Phase 1: Biometric Access (takes 2 seconds)
    let bioVal = 0;
    const bioInterval = setInterval(() => {
      bioVal += 10;
      setSaasBiometricProgress(bioVal);
      if (bioVal === 40) {
        setSaasAutoLogs(prev => [
          ...prev,
          "👁️ [Biometrics] Scanning live infrared facial nodes...",
        ]);
      }
      if (bioVal === 80) {
        setSaasAutoLogs(prev => [
          ...prev,
          "🔑 [Biometrics] Passkey authenticated (WebAuthn API Handshake OK).",
        ]);
      }
      if (bioVal >= 100) {
        clearInterval(bioInterval);
        setSaasAutoLogs(prev => [
          ...prev,
          "✅ [Biometrics] Autonomous turnstile gates unlocked and synchronized!",
          "🔄 [OS] Activating Phase 2: Kitchen Chief Diet AI (Kitchen Chief UI)...",
        ]);
        
        // Transition to Phase 2: Kitchen Chief after 600ms
        setTimeout(() => {
          setSaasCurrentStep('kitchen');
          setSaasAutoLogs(prev => [
            ...prev,
            "🥗 [Kitchen Chief] Querying user metabolic rate biomarkers...",
          ]);
          
          let calVal = 1000;
          const calInterval = setInterval(() => {
            calVal += 150;
            setSaasKitchenCalories(calVal);
            if (calVal === 1450) {
              setSaasAutoLogs(prev => [
                ...prev,
                "📊 [Kitchen Chief] BMR and blood profile analysis successful.",
              ]);
            }
            if (calVal === 2050) {
              setSaasAutoLogs(prev => [
                ...prev,
                "🍖 [Kitchen Chief] Target Macros assigned: 165g Protein, 220g Carbs, 65g Fats.",
              ]);
            }
            if (calVal >= 2500) {
              clearInterval(calInterval);
              setSaasAutoLogs(prev => [
                ...prev,
                "✅ [Kitchen Chief] Diet plan compiled and transmitted to kitchen beacon.",
                "🔄 [OS] Activating Phase 3: Titan Vision skeletal Pose AR Analyzer...",
              ]);

              // Transition to Phase 3: Titan Vision after 600ms
              setTimeout(() => {
                setSaasCurrentStep('titan');
                setSaasAutoLogs(prev => [
                  ...prev,
                  "📹 [Titan Vision] Launching pose-mapping frame-skipping algorithm...",
                ]);

                let angleDirection = 1;
                let angleVal = 30;
                let cnt = 0;
                const angleInterval = setInterval(() => {
                  angleVal += 10 * angleDirection;
                  if (angleVal >= 90) angleDirection = -1;
                  if (angleVal <= 30) angleDirection = 1;
                  setSaasTitanJointAngle(angleVal);
                  cnt += 1;

                  if (cnt === 3) {
                    setSaasAutoLogs(prev => [
                      ...prev,
                      "🦴 [Titan Vision] Analyzing skeletal joint torque angles: " + angleVal + "°",
                    ]);
                  }
                  if (cnt === 6) {
                    setSaasAutoLogs(prev => [
                      ...prev,
                      "🏋️ [Titan Vision] Lifting form secure: Joint load torque optimized.",
                    ]);
                  }
                  if (cnt >= 10) {
                    clearInterval(angleInterval);
                    setSaasAutoLogs(prev => [
                      ...prev,
                      "✅ [Titan Vision] Real-time protective torque calibration absolute. <0.1% error margin.",
                      "🌟 [Success] All three core SaaS engines (Biometrics, Kitchen Chief, and Titan Vision) successfully synchronized in autopilot mode!",
                    ]);
                    setSaasCurrentStep('optimized');
                    setIsSaaSAutoRunning(false);
                  }
                }, 300);

              }, 800);
            }
          }, 150);

        }, 800);
      }
    }, 200);
  };

  // Switch billing tiers toggles
  const handleToggleTierFeature = (tierIndex: number, featureKey: 'aiDiet' | 'faceId' | 'audioCoach' | 'liveCrowd') => {
    const updated = [...pricingTiers];
    updated[tierIndex].features[featureKey] = !updated[tierIndex].features[featureKey];
    setPricingTiers(updated);
  };

  // Compute stats metrics dynamically based on current selections
  const computedMRR = useMemo(() => {
    const defaultTotal = geographicNodes.reduce((acc, current) => acc + current.mrr, 0);
    // Apply global platform fee percentage markup if modified
    return Math.round(defaultTotal * (1 + globalPlatformFeeMarkup / 100));
  }, [globalPlatformFeeMarkup, geographicNodes]);

  if (showOnboarding) {
    return (
      <div className="p-6">
        <SaaSAdminOnboarding 
          onOnboardComplete={() => setShowOnboarding(false)} 
          onBackToDashboard={() => setShowOnboarding(false)} 
        />
      </div>
    );
  }

  // Find info of the currently selected node
  const selectedNodeInfo = geographicNodes.find(g => g.id === selectedLocation) || geographicNodes[0];

  return (
    <div className="p-6 space-y-8 pb-12">
      
      {/* 1. MASTER TELEMETRY HEADER STATUS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-purple-950/40 text-purple-400 border border-purple-500/30 text-[9px] font-black uppercase tracking-widest rounded-md flex items-center gap-1.5">
              <Crown className="w-3 h-3 animate-pulse" /> SaaS Global Core Root Access
            </span>
            <span className="px-3 py-1 bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 text-[9px] font-mono tracking-widest rounded-md">
              SINGULARITY CORE : v4.9.15
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 uppercase tracking-tight">
            Super SaaS Matrix Control
          </h1>
          <p className="text-xs text-gray-400 uppercase tracking-[0.15em] mt-1">
            Global Tenant Audits, Passive Payment Routing, and Automation Hub diagnostics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-stretch lg:self-auto">
          <button
            onClick={handleDownloadLogsCsv}
            disabled={isExportingCsv}
            className="px-5 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-cyan-500/50 text-cyan-300 text-xs font-black uppercase tracking-wider rounded-2xl active:scale-95 transition-all shadow-lg flex items-center gap-2 justify-center cursor-pointer disabled:opacity-50"
            title="Export force_unlock_logs Firestore collection into CSV format for archival purposes"
          >
            <Download className={`w-4 h-4 text-cyan-400 ${isExportingCsv ? 'animate-bounce' : ''}`} />
            <span>{isExportingCsv ? 'Exporting CSV...' : 'Download Logs (CSV)'}</span>
          </button>

          <button 
            onClick={() => setShowOnboarding(true)}
            className="px-6 py-4 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 hover:from-cyan-300 hover:via-indigo-400 hover:to-purple-500 text-black text-xs font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-[0_0_30px_rgba(6,182,212,0.25)] flex items-center gap-2 justify-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Provision New Gym Franchise Lease</span>
          </button>
        </div>
      </div>

      {/* 1.5 NAVIGATION TABS: MATRIX TELEMETRY, AUDIT LOGS, USERS DIRECTORY, GOVERNANCE */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/90 border border-zinc-800 p-2.5 rounded-3xl shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveDashboardTab('three_tier')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeDashboardTab === 'three_tier'
                ? 'bg-gradient-to-r from-fuchsia-500 via-amber-500 to-cyan-500 text-black shadow-lg shadow-fuchsia-500/25 ring-2 ring-fuchsia-400/40'
                : 'bg-zinc-900 text-fuchsia-300 hover:text-white border border-fuchsia-500/30'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3-Tier Architecture Engine</span>
          </button>

          <button
            onClick={() => setActiveDashboardTab('matrix')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeDashboardTab === 'matrix'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Matrix Dashboard</span>
          </button>

          <button
            onClick={() => setActiveDashboardTab('audit_logs')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeDashboardTab === 'audit_logs'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50'
                : 'bg-zinc-900 text-amber-300 hover:text-amber-200 border border-amber-500/30'
            }`}
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Audit Logs</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono font-bold text-amber-200 border border-amber-400/30">
              force_unlock_logs
            </span>
          </button>

          <button
            onClick={() => setActiveDashboardTab('users')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeDashboardTab === 'users'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Directory & Locks</span>
          </button>

          <button
            onClick={() => setActiveDashboardTab('roles')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeDashboardTab === 'roles'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/40'
                : 'bg-zinc-900 text-purple-300 hover:text-white border border-purple-500/30'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Admin Roles</span>
            <span className="ml-1 px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono font-bold text-purple-200 border border-purple-400/30">
              RBAC
            </span>
          </button>

          <button
            onClick={() => setActiveDashboardTab('governance')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeDashboardTab === 'governance'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Master Governance</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-zinc-400 hidden lg:flex items-center gap-2 px-3">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Firestore: force_unlock_logs</span>
        </div>
      </div>

      {activeDashboardTab === 'three_tier' ? (
        <ThreeTierArchitectureEngine setCurrentView={setCurrentView} />
      ) : activeDashboardTab === 'audit_logs' ? (
        <ForceUnlockAuditLogsTab setCurrentView={setCurrentView} />
      ) : activeDashboardTab === 'users' ? (
        <div className="space-y-6">
          <SuperAdminFirestoreUsersPanel setCurrentView={setCurrentView} />
        </div>
      ) : activeDashboardTab === 'roles' ? (
        <div className="space-y-6">
          <AdminRoleManagement setCurrentView={setCurrentView} />
        </div>
      ) : activeDashboardTab === 'governance' ? (
        <div className="space-y-6">
          <SuperAdminMasterGovernance setCurrentView={setCurrentView} />
        </div>
      ) : (
        <>
          {/* 2. STATS OVERVIEW DECK */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-black border border-white/5 rounded-3xl p-6 relative overflow-hidden flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Active Hub Leases</span>
            <h3 className="text-3xl font-black text-white">{availableGyms.length}</h3>
            <p className="text-[9px] text-green-400 font-mono mt-1">● 100% Core Synchronized</p>
          </div>
          <Globe className="w-10 h-10 text-cyan-400 opacity-30" />
        </div>

        <div className="bg-black border border-white/5 rounded-3xl p-6 relative overflow-hidden flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Global SaaS MRR</span>
            <h3 className="text-3xl font-black text-green-400">
              {getCurrencySymbol()}{(computedMRR / 1000).toFixed(1)}k
            </h3>
            <p className="text-[9px] text-yellow-500 font-mono mt-1">Based on global branch fees</p>
          </div>
          <DollarSign className="w-10 h-10 text-green-400 opacity-30" />
        </div>

        <div className="bg-black border border-white/5 rounded-3xl p-6 relative overflow-hidden flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Active Gym Members</span>
            <h3 className="text-3xl font-black text-white">
              {geographicNodes.reduce((acc, c) => acc + c.membersCount, 0)}
            </h3>
            <p className="text-[9px] text-purple-400 font-mono mt-1">⚡ Dynamic Bio-Sync Enrolled</p>
          </div>
          <Users className="w-10 h-10 text-purple-400 opacity-30" />
        </div>

        <div className="bg-black border border-white/5 rounded-3xl p-6 relative overflow-hidden flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black">AI Gateway Uptime</span>
            <h3 className="text-3xl font-black text-white">99.994%</h3>
            <p className="text-[9px] text-cyan-400 font-mono mt-1">✓ Cloud Webhooks Active</p>
          </div>
          <Activity className="w-10 h-10 text-emerald-400 opacity-30" />
        </div>
      </div>

      {/* 2.05 ADMIN STATS WIDGET: RECHARTS LINE CHART SUMMARIZING DAILY ACTIONS, FORCE UNLOCKS & ACTIVE ADMINS */}
      <AdminStatsWidget onOpenAuditLogs={() => setActiveDashboardTab('audit_logs')} />

      {/* 2.1 PLATFORM SUBSCRIPTION RATIO & STATUS OVERVIEW (RECHARTS VISUALIZATION) */}
      <SubscriptionOverview setCurrentView={setCurrentView} />

      {/* 2.15 FIRESTORE RETRIEVED ALL USERS DIRECTORY TABLE */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 lg:p-8 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-white italic uppercase tracking-tight">
                Firestore All Users Directory
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE CLOUD FIRESTORE
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Real-time user accounts retrieved directly from Firestore with one-click Force Unlock capability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">
              Total Users: <strong className="text-white">{allFirestoreUsersList.length}</strong>
            </span>
          </div>
        </div>

        {/* The Table displaying Full Name, Phone, Role, Subscription Status, Creation Date, and Force Unlock button */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/60">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-[10px] font-black uppercase tracking-widest text-gray-400">
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Subscription Status</th>
                <th className="py-3.5 px-4">Creation Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {allFirestoreUsersList.map(u => (
                <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-[11px] font-black text-cyan-400">
                      {u.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div>{u.fullName}</div>
                      <div className="text-[10px] font-mono text-gray-500">{u.email}</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-300">
                    {u.phone}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                      u.subscriptionStatus === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : u.subscriptionStatus === 'LOCKED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {u.subscriptionStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-400">
                    {u.creationDate}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => unlockAccount(u.uid, u.role)}
                      disabled={isUnlockingAccount}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 ml-auto cursor-pointer disabled:opacity-50"
                      title="Force Unlock user in Firestore and set subscription_status to ACTIVE"
                    >
                      <Zap className="w-3 h-3" />
                      <span>Force Unlock</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2.2 FIRESTORE GLOBAL USERS DIRECTORY, FORCE-UNLOCK & GLOBAL MEMBERSHIP EXPIRATION CONTROL */}
      <SuperAdminFirestoreUsersPanel setCurrentView={setCurrentView} />

      {/* 2.5 MASTER GOVERNANCE: ALL ADMINS & MEMBERS UNLOCKER, PACKAGE ENGINE, PORTAL FIXER & ALL BOARDS */}
      <SuperAdminMasterGovernance setCurrentView={setCurrentView} />

      {/* 2.6 ADMIN ACTIVITY & AUDIT LOG (IMMUTABLE ADMINISTRATIVE ACTION RECORD WITH TIMESTAMPS & ADMIN USER IDS) */}
      <AdminActivityLog setCurrentView={setCurrentView} />

      {/* 2.7 CHRONOLOGICAL FORCE UNLOCK AUDIT LOGS TABLE (QUERIES force_unlock_logs) */}
      <ForceUnlockAuditLogsTab setCurrentView={setCurrentView} />

      {/* 3. DUAL COLUMN: CYBER GRID MAP & LIVE BILLING STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Cybernetic Regional Map Grid */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                <Map className="w-5 h-5 text-cyan-400" /> Geographic Software Telemetry
              </h2>
              <p className="text-xs text-gray-400">Live active franchise node distribution map (Rajasthan Hubs)</p>
            </div>
            <div className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-lg text-cyan-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
              <span>4 ACTIVE COGNITIVE NODES</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* SVG Visual Matrix (Coords Map) */}
            <div className="md:col-span-7 bg-black rounded-3xl p-4 border border-white/5 h-72 relative flex items-center justify-center overflow-hidden select-none">
              
              {/* Circuit Grid Aesthetics */}
              <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-40"></div>
              
              {/* Dynamic Coordinate Map Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {geographicNodes.map((node, i) => (
                  <g key={node.id}>
                    {/* Render connection path to central HQ if not HQ itself */}
                    {node.id !== 'fitness_future_01' && (
                      <line 
                        x1="230" y1="120" 
                        x2={node.coords.x} y2={node.coords.y} 
                        stroke="#06b6d4" strokeWidth="1" strokeDasharray="5,5" 
                        className="opacity-40"
                      />
                    )}
                    {/* Ping ripple effect on online node */}
                    {node.status === 'ONLINE' && (
                      <circle cx={node.coords.x} cy={node.coords.y} r="12" fill="none" stroke="#22c55e" strokeWidth="1" className="animate-ping" opacity="0.3"></circle>
                    )}
                    {node.status === 'LOAD_HEAVY' && (
                      <circle cx={node.coords.x} cy={node.coords.y} r="14" fill="none" stroke="#eab308" strokeWidth="1" className="animate-pulse" opacity="0.4"></circle>
                    )}
                  </g>
                ))}
              </svg>

              {/* Geo Node Pins */}
              {geographicNodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedLocation(node.id)}
                  style={{ left: `${node.coords.x}px`, top: `${node.coords.y}px` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-full border transition-all z-20 ${
                    selectedLocation === node.id 
                      ? 'bg-cyan-500 text-black border-white shadow-[0_0_20px_#06b6d4]' 
                      : 'bg-zinc-900 border-white/10 hover:border-cyan-400 text-gray-400 hover:text-white'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  
                  {/* Floating badge for node names */}
                  <span className="absolute left-1/2 -translate-x-1/2 top-7 px-1.5 py-0.5 bg-black/95 text-white text-[8px] font-black uppercase rounded border border-white/10 tracking-widest whitespace-nowrap">
                    {node.name.replace('Fitness Future ', '')}
                  </span>
                </button>
              ))}

              <div className="absolute bottom-3 right-3 text-[9px] font-mono text-gray-500">
                ZOOM LEVEL: 1.4X (RAJ)
              </div>
            </div>

            {/* Config & Metrics Panel of Selected Node */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-zinc-900/60 p-5 rounded-3xl border border-white/5 space-y-3">
                <span className="text-[10px] text-cyan-400 font-black tracking-widest uppercase block border-b border-white/5 pb-2">
                  SELECTED TELEMETRY NODE
                </span>
                <div>
                  <h4 className="text-white font-black text-sm">{selectedNodeInfo.name}</h4>
                  <p className="text-xs text-gray-400 font-mono italic mt-0.5">{selectedNodeInfo.region}</p>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Node Status:</span>
                    <span className={`font-black ${
                      selectedNodeInfo.status === 'ONLINE' ? 'text-green-400' :
                      selectedNodeInfo.status === 'LOAD_HEAVY' ? 'text-yellow-400' : 'text-cyan-400'
                    }`}>
                      ● {selectedNodeInfo.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Database Size:</span>
                    <span className="font-mono text-white">4.8 GB</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Active Handshakes:</span>
                    <span className="font-mono text-white text-xs">{selectedNodeInfo.membersCount} Profiles</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Calculated MRR:</span>
                    <span className="font-mono text-green-400 font-bold">{getCurrencySymbol()}{selectedNodeInfo.mrr.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <button 
                    onClick={() => {
                      const match = availableGyms.find(g => g.gymId === selectedNodeInfo.id);
                      if (match) setCurrentGym(match);
                    }}
                    className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-center font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                  >
                    Control Active Console
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Live Billing & SaaS Revenue Streams */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-xl flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div>
                <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400 animate-pulse" /> Live SaaS Revenue Stream
                </h2>
                <p className="text-xs text-gray-400">Real-time payment logs streaming of all active gyms globally</p>
              </div>
              <button 
                onClick={() => setIsSimulatingStream(!isSimulatingStream)}
                className={`p-2 rounded-xl border transition-all text-xs font-bold font-mono uppercase ${
                  isSimulatingStream ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-zinc-900 border-white/5 text-gray-500'
                }`}
                title="Toggle Real-time simulation flow"
              >
                {isSimulatingStream ? '• STREAM ON' : 'STREAM MUTED'}
              </button>
            </div>

            <div className="space-y-3 mt-4 h-80 overflow-y-auto pr-1">
              {liveTransactions.map((tx) => (
                <div key={tx.id} className="bg-black/50 border border-white/5 p-3 rounded-2xl flex justify-between items-center hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-green-400 font-mono">
                      {tx.channel}
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">{tx.member}</div>
                      <div className="text-[10px] text-gray-500 truncate max-w-[170px]">{tx.gymName}</div>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-xs font-black text-green-400 font-mono">
                      +{getCurrencySymbol()}{tx.amount}
                    </span>
                    <div className="text-[9px] text-gray-500 font-mono">{tx.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 font-mono text-[9px] text-gray-500 uppercase tracking-widest flex justify-between items-center">
            <span>Direct to bank settle: ACTIVE</span>
            <span>B2B Settlement Engine OK</span>
          </div>

        </div>

      </div>

      {/* 4. SAAS PRICING MATRIX SCALING CONFIGURATOR */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-purple-400" /> B2B Price Matrix Configurator
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Super Admin controls pricing tiers globally. Toggle active SaaS platform features and markups live.
            </p>
          </div>

          {/* Slider Markup */}
          <div className="w-full md:w-64 bg-zinc-900 p-4 rounded-2xl border border-white/5 space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-purple-400">
              <span>Markup Adjustment:</span>
              <span>+{globalPlatformFeeMarkup}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={globalPlatformFeeMarkup}
              onChange={(e) => setGlobalPlatformFeeMarkup(parseInt(e.target.value))}
              className="w-full accent-purple-500 bg-black h-1 rounded-lgappearance-none cursor-pointer" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          {pricingTiers.map((tier, tierIdx) => {
            const markupAddedPrice = Math.round(tier.price * (1 + globalPlatformFeeMarkup / 100));
            return (
              <div key={tier.id} className="relative bg-black rounded-3xl p-6 border border-white/5 space-y-6 flex flex-col justify-between">
                
                {/* Visual Glow Header Accent */}
                {tier.id === 'tier_singularity' && (
                  <div className="absolute inset-x-0 -top-px h-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-t-3xl"></div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-black text-sm uppercase tracking-wide">{tier.name}</h4>
                      <p className="text-[10px] text-purple-400 uppercase tracking-widest font-mono mt-1">{tier.activeTenants} Tenants Active</p>
                    </div>
                    {tier.id === 'tier_singularity' && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-purple-500/30 text-[8px] text-purple-300 font-black uppercase tracking-widest rounded">
                        RECOMMENDED
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1 pt-2">
                    <span className="text-3xl font-black text-white font-mono">{getCurrencySymbol()}{markupAddedPrice}</span>
                    <span className="text-xs text-gray-500">/ month per tenant</span>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">AVAILABLE FEAT LIST TIER</span>

                    {/* Checkbox active parameters */}
                    <div className="space-y-2.5">
                      <button 
                        onClick={() => handleToggleTierFeature(tierIdx, 'aiDiet')}
                        className="w-full flex items-center justify-between text-xs text-left"
                      >
                        <span className="text-gray-300">Regional AI Diet Algorithm</span>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-all ${tier.features.aiDiet ? 'bg-green-500 flex justify-end' : 'bg-zinc-800 flex justify-start'}`}>
                          <div className="w-3 h-3 rounded-full bg-white"></div>
                        </div>
                      </button>

                      <button 
                        onClick={() => handleToggleTierFeature(tierIdx, 'faceId')}
                        className="w-full flex items-center justify-between text-xs text-left"
                      >
                        <span className="text-gray-300">BioSync Passwordless API</span>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-all ${tier.features.faceId ? 'bg-green-500 flex justify-end' : 'bg-zinc-800 flex justify-start'}`}>
                          <div className="w-3 h-3 rounded-full bg-white"></div>
                        </div>
                      </button>

                      <button 
                        onClick={() => handleToggleTierFeature(tierIdx, 'audioCoach')}
                        className="w-full flex items-center justify-between text-xs text-left"
                      >
                        <span className="text-gray-300">Adaptive Voice Trainer Coach</span>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-all ${tier.features.audioCoach ? 'bg-green-500 flex justify-end' : 'bg-zinc-800 flex justify-start'}`}>
                          <div className="w-3 h-3 rounded-full bg-white"></div>
                        </div>
                      </button>

                      <button 
                        onClick={() => handleToggleTierFeature(tierIdx, 'liveCrowd')}
                        className="w-full flex items-center justify-between text-xs text-left"
                      >
                        <span className="text-gray-300">Titan-Vision Camera Analytics</span>
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-all ${tier.features.liveCrowd ? 'bg-green-500 flex justify-end' : 'bg-zinc-800 flex justify-start'}`}>
                          <div className="w-3 h-3 rounded-full bg-white"></div>
                        </div>
                      </button>
                    </div>

                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button 
                    onClick={() => addToast(`Applied global parameter updates to [${tier.name}]. Configuration policy compiled.`, 'success')}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-center text-xs text-gray-300 hover:text-white transition-all font-bold uppercase tracking-wider"
                  >
                    Save Tier Parameters
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* 5. INTERACTIVE PASSWORDLESS ADMISSION DIAGNOSTIC SANDBOX */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-cyan-950/40 text-cyan-400 border border-cyan-500/20 text-[9px] font-black uppercase tracking-widest rounded-md">
                Master Diagnostics Lab
              </span>
              <span className="px-2.5 py-0.5 bg-purple-950/40 text-purple-400 border border-purple-500/20 text-[9px] font-mono tracking-widest rounded-md">
                SUPABASE AUTH + WebAuthn PASSKEYS API
              </span>
            </div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              Passwordless & Bio-Sync Automation Testbed
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Verify how n8n sends magic OTP links and stores generated FaceID/Passkeys credentials globally.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
          
          {/* Settings / Inputs Column */}
          <div className="lg:col-span-4 bg-zinc-900 p-6 rounded-3xl border border-white/5 space-y-4">
            <span className="text-[10px] text-cyan-400 font-black tracking-widest uppercase block border-b border-white/5 pb-2">
              01/ Register Test Member parameters
            </span>
            
            <div className="space-y-3">
              <div>
                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Full Name:</label>
                <input 
                  type="text" 
                  value={testUser.name}
                  onChange={(e) => setTestUser({ ...testUser, name: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors mt-1 font-bold"
                  placeholder="Amit Shekhawat" 
                />
              </div>

              <div>
                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">WhatsApp Recipient Mobile:</label>
                <input 
                  type="text" 
                  value={testUser.phone}
                  onChange={(e) => setTestUser({ ...testUser, phone: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors mt-1 font-mono"
                  placeholder="+91 98XXXXXXXX" 
                />
              </div>

              <div>
                <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Member Primary Email:</label>
                <input 
                  type="text" 
                  value={testUser.email}
                  onChange={(e) => setTestUser({ ...testUser, email: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors mt-1 font-mono"
                  placeholder="amit@singularity.com" 
                />
              </div>
            </div>

            <button
              onClick={triggerAdmitMemberSimulator}
              disabled={isTestOnboarding}
              className="mt-6 w-full py-3 bg-gradient-to-r from-cyan-400 to-indigo-500 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] active:scale-95 disabled:opacity-50"
            >
              🚀 Initialize Bio-Admission Onboarding
            </button>
          </div>

          {/* n8n Live Pipeline Terminal logs */}
          <div className="lg:col-span-5 bg-black p-6 rounded-3xl border border-white/5 font-mono text-[10px] space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" /> WebAuthn Execution Pipelines
                </span>
                <span className="text-[8px] text-green-500 animate-pulse">● SYS_READY</span>
              </div>

              <div className="space-y-3">
                {testLogs.map((log) => (
                  <div key={log.step} className={`p-3 rounded-xl border leading-relaxed ${
                    log.status === 'success' ? 'bg-green-950/20 border-green-500/20 text-green-400' :
                    log.status === 'active' ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300 animate-pulse' : 'bg-zinc-950 border-white/5 text-gray-500'
                  }`}>
                    <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 select-none">
                      <span>STEP 0{log.step}</span>
                      <span className={log.status === 'success' ? 'text-green-400' : log.status === 'active' ? 'text-cyan-400' : 'text-gray-500'}>
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="font-sans font-black text-xs text-white">{log.title}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{log.txt}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Handshake status parameters */}
            <div className="p-3 bg-white/5 whitespace-pre border border-white/5 rounded-xl font-mono text-[9px] text-gray-500 uppercase tracking-wide">
              <span>LEDGER BOUND: {registeredBiometricsInStore ? 'YES (PUBLICKEY_OK)' : 'NO (AWAITING)'}</span>
              <br/><span>CRYPTOGRAPHIC SECURED MATRIX: ACTIVE</span>
            </div>
          </div>

          {/* Member's Phone Screen */}
          <div className="lg:col-span-3 flex justify-center">
            <div className="w-full max-w-[240px] aspect-[9/18] bg-neutral-900 rounded-[2rem] p-3 border-4 border-neutral-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 h-4 w-20 bg-neutral-800 rounded-b-xl z-20"></div>

              <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/40 via-neutral-950 to-neutral-950 rounded-[1.5rem] border border-white/5 p-2 flex flex-col justify-between">
                
                {/* Notification Container / chat */}
                <div className="overflow-hidden space-y-2">
                  <div className="flex justify-between items-center text-[7px] text-gray-500 font-mono pt-1 border-b border-white/5 pb-1 select-none">
                    <span>Future-OS</span>
                    <span>18:15</span>
                  </div>

                  {/* WhatsApp Receiver Bubbles */}
                  {whatsappMockReceived ? (
                    <div className="p-2 bg-[#056062] rounded-lg rounded-tl-none font-sans text-[8px] text-white leading-relaxed whitespace-pre-line border border-[#0b8a8d]/30 relative shadow-md">
                      {whatsappMockReceived}
                      <span className="absolute bottom-1 right-1 text-[5px] text-gray-300 font-mono">18:15 ✓✓</span>
                    </div>
                  ) : (
                    <div className="text-center text-[8px] text-gray-600 font-sans py-8">
                      Awaiting webhook trigger...
                    </div>
                  )}

                  {/* Device Biometrics trigger scan bubble */}
                  {deviceSensorActive && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={simulateSensorScan}
                      className="bg-zinc-900 border border-cyan-500/40 p-3 rounded-xl text-center space-y-2 cursor-pointer active:scale-95 transition-all"
                    >
                      <span className="text-[8px] text-cyan-400 font-black uppercase tracking-widest block font-sans">
                        Biometric Scanner Handshake
                      </span>
                      <div className="flex items-center justify-center relative">
                        {/* Fingerprint indicator layout circles */}
                        <div className="w-10 h-10 rounded-full border border-cyan-500/20 flex items-center justify-center relative">
                          <span className="text-cyan-400 text-lg animate-pulse">Fingerprint</span>
                          
                          {/* Radial scanned progress visual border */}
                          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle 
                              cx="20" cy="20" r="18" 
                              fill="none" 
                              stroke="#06b6d4" 
                              strokeWidth="2" 
                              strokeDasharray={`${deviceScanProgress * 1.1}, 110`}
                            />
                          </svg>
                        </div>
                      </div>
                      <p className="text-[7px] text-gray-400 font-sans leading-tight font-black uppercase tracking-widest">
                        {deviceScanProgress === 0 ? 'TAP FINGER TO SCAN' : `SCANNING ${deviceScanProgress}%`}
                      </p>
                    </motion.div>
                  )}

                  {registeredBiometricsInStore && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-green-950/20 border border-green-500/30 p-3 rounded-xl text-center text-green-400 space-y-1.5"
                    >
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-[8px] font-black uppercase tracking-widest block font-sans">BIO-SYNC ENROLLED!</span>
                      <p className="text-[7px] text-gray-300 font-sans">
                        Device public keys bound. Future logins will bypass password checks successfully.
                      </p>
                    </motion.div>
                  )}
                </div>

                <div className="bg-neutral-900 border border-white/5 p-1 rounded-full text-[8px] text-gray-600 flex justify-between px-2 select-none">
                  <span>Enter password bypass...</span>
                  <span className="text-cyan-400 font-bold select-none text-[8px]">FaceID ON</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 5.1: LIVE INTERACTIVE TEMPLATE DESIGNER & INTEGRATIONS STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Custom text template creator */}
        <div className="lg:col-span-6 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <span className="px-2.5 py-1 bg-indigo-950/45 text-indigo-400 border border-indigo-500/35 text-[9px] font-black uppercase tracking-widest rounded-md">
              SaaS Dynamic Content Engine
            </span>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2 mt-2">
              <MessageCircle className="w-5 h-5 text-indigo-400" /> WhatsApp Template Customizer
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Customize the message dispatched by the WhatsApp API hook. Use variables like <span className="text-cyan-400 font-mono">{`{name}`}</span> or <span className="text-cyan-400 font-mono">{`{token}`}</span>.
            </p>
          </div>

          <div className="space-y-4">
            <textarea
              value={whatsappCustomTemplate}
              onChange={(e) => setWhatsappCustomTemplate(e.target.value)}
              className="w-full h-44 bg-black border border-white/10 rounded-2xl p-4 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono leading-relaxed"
              placeholder="Type template..."
            />
            <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
              <span>Supports interactive translation tags</span>
              <button 
                onClick={() => {
                  setWhatsappCustomTemplate(
                    `*🛡️ Fitness Future OS: Passwordless Active! *\nHello {name}! The Admin has admitted you to the "Fitness Future OS" portal.\nSince password security can be weak, we use a fully secure passwordless experience instead.\n\nClick the secure Magic Link below to enroll your fingerprint or FaceID directly:\n🔗 *https://fitnessfuture.os/vault-activation?id={token}*`
                  );
                }}
                className="text-indigo-400 hover:underline font-bold"
              >
                Reset Default Template
              </button>
            </div>
          </div>
        </div>

        {/* Right: API Integration Status Nodes */}
        <div className="lg:col-span-6 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <span className="px-2.5 py-1 bg-cyan-950/45 text-cyan-400 border border-cyan-500/35 text-[9px] font-black uppercase tracking-widest rounded-md">
              Gateway Services Status
            </span>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2 mt-2">
              <Shield className="w-5 h-5 text-cyan-400 animate-pulse" /> Edge Node Health Monitor
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Live status representation of third party core integrations. Toggle health status to Process failsafe routing.
            </p>
          </div>

          <div className="space-y-3.5">
            {apiNodes.map((node, index) => (
              <div key={node.key} className="bg-black/55 border border-white/5 p-3 rounded-2xl flex justify-between items-center hover:border-white/10 transition-all">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{node.name}</span>
                    <span className="text-[8px] font-mono text-zinc-500">Latency: {node.latency}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-snug">{node.desc}</p>
                </div>

                <button
                  onClick={() => {
                    const copy = [...apiNodes];
                    copy[index].status = copy[index].status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
                    setApiNodes(copy);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black tracking-wider border transition-all shrink-0 ${
                    node.status === 'ONLINE'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/15 border-red-500/30 text-red-500'
                  }`}
                >
                  ● {node.status}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 5.2: GLOBAL LEASE MULTI-TENANT DIRECTORY */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none font-sans"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest rounded-md">
                Commercial Matrix
              </span>
              <span className="px-2.5 py-0.5 bg-indigo-950/40 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono tracking-widest rounded-md font-sans">
                ACTIVE TENANT LEDGER (Supabase + localStore)
              </span>
            </div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" /> Active B2B Multi-Tenant Lease Directory
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Super Admin has master override authority to suspend, upgrade, trial or delete sovereign client partitions live.
            </p>
          </div>

          <button 
            onClick={() => setShowOnboarding(true)}
            className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-black text-xs font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy Custom Tenant Partition</span>
          </button>
        </div>

        {/* Quick Firestore Account Unlock Gatekeeper */}
        <div className="bg-black/60 border border-emerald-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <Unlock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Direct Firestore Account Unlock Gatekeeper</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  subscription_status → 'ACTIVE'
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Instantly unlocks any user, member, or tenant in Firestore, sets subscription_status to 'ACTIVE', and logs the action.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={unlockTargetInput}
              onChange={(e) => setUnlockTargetInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && unlockTargetInput.trim()) {
                  unlockAccount(unlockTargetInput);
                }
              }}
              placeholder="Enter User ID, member_#, or email..."
              className="bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-full md:w-64"
            />
            <button
              onClick={() => unlockAccount(unlockTargetInput)}
              disabled={isUnlockingAccount || !unlockTargetInput.trim()}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-gray-500 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>{isUnlockingAccount ? 'Unlocking...' : 'Unlock Account'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {tenants.map((tenant) => (
            <div key={tenant.gym_id} className="relative bg-black rounded-3xl p-6 border border-white/5 space-y-5 flex flex-col justify-between">
              
              {/* Active Glow Accent based on status */}
              <div className={`absolute inset-x-0 -top-px h-1 rounded-t-3xl ${
                tenant.subscription_status === 'Active' ? 'bg-emerald-500' :
                tenant.subscription_status === 'Trial' ? 'bg-indigo-500' : 'bg-red-500'
              }`}></div>

              <div className="space-y-3.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-black text-base uppercase tracking-tight leading-none">{tenant.gym_name}</h4>
                    <span className="text-[9px] text-zinc-500 font-mono mt-1 block">ID: {tenant.gym_id}</span>
                  </div>
                  <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border ${
                    tenant.subscription_status === 'Active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                    tenant.subscription_status === 'Trial' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                    'bg-red-500/15 border-red-500/30 text-red-500'
                  }`}>
                    {tenant.subscription_status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-300 font-sans pt-2 border-t border-white/5">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 uppercase text-[9px] font-semibold">Admin email:</span>
                    <span className="font-mono text-zinc-300 text-[11px] truncate max-w-[155px]" title={tenant.email_id}>{tenant.email_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 uppercase text-[9px] font-semibold">UPI Account:</span>
                    <span className="font-mono text-zinc-300 text-[11px] text-green-400">{tenant.upi_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 uppercase text-[9px] font-semibold">Location Map:</span>
                    <span className="text-zinc-300 truncate max-w-[155px]" title={tenant.location}>{tenant.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 uppercase text-[9px] font-semibold">Gateway ID:</span>
                    <span className="font-mono text-zinc-300 text-[11px] text-cyan-400">{tenant.whatsapp_phone_number_id}</span>
                  </div>
                  <div className="flex justify-between pt-1 font-mono text-[9px] text-zinc-500 uppercase">
                    <span>Provisioned Date:</span>
                    <span>{new Date(tenant.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Status selectors & Action Switches */}
              <div className="pt-3 border-t border-white/5 space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Change Lease Subscription State:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Trial', 'Active', 'Delinquent'] as const).map((statusVal) => (
                      <button
                        key={statusVal}
                        onClick={() => updateTenantStatus(tenant.gym_id, statusVal)}
                        className={`py-1 rounded text-[9px] font-black uppercase transition-all ${
                          tenant.subscription_status === statusVal
                            ? statusVal === 'Active' ? 'bg-emerald-500 text-black font-black' :
                              statusVal === 'Trial' ? 'bg-indigo-500 text-black font-black' :
                              'bg-red-500 text-black font-black'
                            : 'bg-zinc-900 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {statusVal}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => unlockAccount(tenant.gym_id, 'tenant')}
                    disabled={isUnlockingAccount}
                    className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-center font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                    title="Unlock and set subscription_status to ACTIVE in Firestore"
                  >
                    <Unlock className="w-3 h-3" />
                    <span>Unlock (ACTIVE)</span>
                  </button>
                  <button 
                    onClick={() => {
                      const match = availableGyms.find(g => g.gymId === tenant.gym_id || g.gymId === 'fitness_future_01');
                      if (match) setCurrentGym(match);
                      addToast(`Switched Core control console context to: [${tenant.gym_name}]`, 'success');
                    }}
                    className="flex-1 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-center font-bold text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                  >
                    Console
                  </button>
                  <button 
                    onClick={() => {
                      deleteTenant(tenant.gym_id);
                      addToast(`Partition [${tenant.gym_name}] dismantled by Super Admin.`, 'warning');
                    }}
                    disabled={tenant.gym_id === 'fitness_future_01'}
                    className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-500 text-red-500 hover:text-black border border-red-500/20 rounded-lg text-[9px] font-black uppercase transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                    title="Dismantle Partition Lease"
                  >
                    Dismantle
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* 6. CORE SAAS ENGINES SEQUENTIAL AUTOMATION ENGINE */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-yellow-950/40 text-yellow-400 border border-yellow-500/20 text-[9px] font-black uppercase tracking-widest rounded-md">
                Master Integrations Hub
              </span>
              <span className="px-2.5 py-0.5 bg-green-950/40 text-green-400 border border-green-500/20 text-[9px] font-mono tracking-widest rounded-md">
                CORE SAAS ENGINE COGNITION AGENT
              </span>
            </div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> Core SaaS Engines Autopilot Control
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Run and synchronize all three primary product engines (Biometrics, Kitchen Chief, & Titan Vision) seamlessly in Autopilot mode.
            </p>
          </div>

          <button
            onClick={startCoreSaaSAutomation}
            disabled={isSaaSAutoRunning}
            className={`px-8 py-4 text-xs font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all flex items-center gap-2 ${
              isSaaSAutoRunning 
                ? 'bg-zinc-850 text-zinc-500 cursor-not-allowed border border-white/5' 
                : 'bg-gradient-to-r from-yellow-400 via-amber-500 to-green-500 hover:from-yellow-300 hover:via-amber-400 hover:to-green-400 text-black shadow-[0_0_30px_rgba(234,179,8,0.3)]'
            }`}
          >
            <RefreshCcw className={`w-4 h-4 ${isSaaSAutoRunning ? 'animate-spin' : ''}`} />
            <span>{isSaaSAutoRunning ? 'Autopilot Active...' : 'EXECUTE AUTOPILOT CYCLE'}</span>
          </button>
        </div>

        {/* 3 Column Engines Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">

          {/* Engine 1: Biometrics Gateway */}
          <div className={`p-6 rounded-3xl border transition-all ${
            saasCurrentStep === 'biometric' 
              ? 'bg-indigo-950/20 border-indigo-500 shadow-[0_0_25px_rgba(99,102,241,0.15)]' 
              : saasBiometricProgress >= 100 
                ? 'bg-black border-green-500/40' 
                : 'bg-black border-white/5 opacity-60'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">SaaS Engine 01</span>
              <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-black tracking-wider ${
                saasCurrentStep === 'biometric' ? 'bg-indigo-500 text-black animate-pulse' :
                saasBiometricProgress >= 100 ? 'bg-green-500/20 text-green-400' : 'bg-zinc-850 text-gray-400'
              }`}>
                {saasCurrentStep === 'biometric' ? 'SCANNING' : saasBiometricProgress >= 100 ? 'SUCCESS' : 'STANDBY'}
              </span>
            </div>
            
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Biometrics Gateway (Bio-Sync Identity)
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">100% password-less beacon access, mapping face IDs and fingerprint metrics.</p>

            {/* Micro Layout Scan Representation */}
            <div className="my-6 flex flex-col items-center justify-center bg-zinc-900/40 rounded-2xl p-4 border border-white/5 relative overflow-hidden h-40">
              {saasCurrentStep === 'biometric' && (
                <div className="absolute top-0 inset-x-0 h-0.5 bg-indigo-400 animate-[bounce_2s_infinite] shadow-[0_0_10px_#818cf8]"></div>
              )}
              
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-indigo-500/30 flex items-center justify-center relative mb-2">
                <Radio className={`w-8 h-8 ${saasCurrentStep === 'biometric' ? 'text-indigo-400 animate-pulse' : 'text-zinc-600'}`} />
                <span className="absolute inset-0 rounded-full border border-indigo-400/20 animate-ping"></span>
              </div>
              
              <span className="text-xs font-mono font-bold text-white mb-1">
                {saasBiometricProgress}% Completeness
              </span>
              <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${saasBiometricProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              STATUS: WebAuthn Keys Indexed
            </div>
          </div>

          {/* Engine 2: Kitchen Chief Nutrition AI */}
          <div className={`p-6 rounded-3xl border transition-all ${
            saasCurrentStep === 'kitchen' 
              ? 'bg-amber-950/20 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.15)]' 
              : saasKitchenCalories >= 2500 
                ? 'bg-black border-green-500/40' 
                : 'bg-black border-white/5 opacity-60'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">SaaS Engine 02</span>
              <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-black tracking-wider ${
                saasCurrentStep === 'kitchen' ? 'bg-amber-500 text-black animate-pulse' :
                saasKitchenCalories >= 2500 ? 'bg-green-500/20 text-green-400' : 'bg-zinc-850 text-gray-400'
              }`}>
                {saasCurrentStep === 'kitchen' ? 'CALCULATING' : saasKitchenCalories >= 2500 ? 'SYNCED' : 'STANDBY'}
              </span>
            </div>
            
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Kitchen Chief (Kitchen Chief Diet AI)
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">AI diet planner matching BMR metabolic rates and daily biometric sensors.</p>

            {/* Micro Layout Kitchen Representation */}
            <div className="my-6 flex flex-col items-center justify-center bg-zinc-900/40 rounded-2xl p-4 border border-white/5 h-40">
              <div className="text-center space-y-1 mb-2">
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {saasKitchenCalories} <span className="text-xs text-white">Kcal</span>
                </div>
                <div className="text-[9px] text-zinc-400 uppercase tracking-widest">Daily Limit Decoded</div>
              </div>

              {/* Nutrition Macros indicator */}
              <div className="w-full grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/5">
                <div className="bg-zinc-950/80 p-1.5 rounded-lg">
                  <div className="text-[9px] font-mono text-amber-400">165g</div>
                  <div className="text-[7px] text-zinc-500 uppercase">Protein</div>
                </div>
                <div className="bg-zinc-950/80 p-1.5 rounded-lg">
                  <div className="text-[9px] font-mono text-cyan-400">220g</div>
                  <div className="text-[7px] text-zinc-500 uppercase">Carbs</div>
                </div>
                <div className="bg-zinc-950/80 p-1.5 rounded-lg">
                  <div className="text-[9px] font-mono text-pink-400">65g</div>
                  <div className="text-[7px] text-zinc-500 uppercase">Fats</div>
                </div>
              </div>
            </div>

            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              ALGO: Med-PaLM BMR Calibrator
            </div>
          </div>

          {/* Engine 3: Titan Vision skeletal Pose AR */}
          <div className={`p-6 rounded-3xl border transition-all ${
            saasCurrentStep === 'titan' 
              ? 'bg-cyan-950/20 border-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.15)]' 
              : saasCurrentStep === 'optimized'
                ? 'bg-black border-green-500/40' 
                : 'bg-black border-white/5 opacity-60'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">SaaS Engine 03</span>
              <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-black tracking-wider ${
                saasCurrentStep === 'titan' ? 'bg-cyan-500 text-black animate-pulse' :
                saasCurrentStep === 'optimized' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-850 text-gray-400'
              }`}>
                {saasCurrentStep === 'titan' ? 'TRACKING POSE' : saasCurrentStep === 'optimized' ? 'OPTIMIZED' : 'STANDBY'}
              </span>
            </div>
            
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Titan Vision (Titan Vision Joint Torque)
            </h3>
            <p className="text-[11px] text-gray-400 mt-1">AI pose-estimation system calculating joint torque forces using computer vision.</p>

            {/* Interactive skeletal animation */}
            <div className="my-6 bg-zinc-900/40 rounded-2xl p-2 border border-white/5 h-40 flex items-center justify-center overflow-hidden">
              <svg className={`${saasCurrentStep === 'titan' ? 'text-cyan-400 font-bold animate-pulse' : 'text-zinc-600'} w-full h-full max-h-[140px] opacity-80`} viewBox="0 0 100 100">
                {/* Head */}
                <circle cx="50" cy="22" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                {/* Spine */}
                <line x1="50" y1="29" x2="50" y2="58" stroke="currentColor" strokeWidth="2" />
                {/* Left Arm Bend */}
                <line x1="50" y1="34" x2="33" y2="42" stroke="currentColor" strokeWidth="2" />
                <line x1="33" y1="42" x2="25" y2="55" stroke="currentColor" strokeWidth="2" />
                {/* Right Arm */}
                <line x1="50" y1="34" x2="67" y2="42" stroke="currentColor" strokeWidth="2" />
                <line x1="67" y1="42" x2="75" y2="55" stroke="currentColor" strokeWidth="2" />
                {/* Spine to Leg connections */}
                <line x1="50" y1="58" x2="40" y2="72" stroke="currentColor" strokeWidth="2" />
                <line x1="40" y1="72" x2="35" y2="88" stroke="currentColor" strokeWidth="2" />
                {/* Right Leg bends dynamically based on saasTitanJointAngle */}
                <line x1="50" y1="58" x2="60" y2="72" stroke="currentColor" strokeWidth="2" />
                <line 
                  x1="60" y1="72" 
                  x2={60 + 15 * Math.sin(((saasTitanJointAngle || 30) * Math.PI) / 180)} 
                  y2={72 + 15 * Math.cos(((saasTitanJointAngle || 30) * Math.PI) / 180)} 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                />
                
                {/* Bounding box visual scan overlays */}
                <rect x="18" y="10" width="64" height="82" fill="none" stroke="#22c55e" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
                <text x="21" y="16" className="text-[6px] fill-emerald-400 font-mono">POSE VERIFIED</text>
                <text x="63" y="85" className="text-[6px] fill-cyan-400 font-mono">{saasTitanJointAngle || 30}°</text>
              </svg>
            </div>

            <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              ALGO: MediaPipe Skeletal Mapping
            </div>
          </div>

        </div>

        {/* Real-time Neon System Automation Logs console */}
        <div className="bg-black/85 border border-white/5 rounded-2xl p-5 font-mono text-xs flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-[10px] text-yellow-400 font-black uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-yellow-400 animate-pulse" /> Autopilot Neural Activity Monitor
            </span>
            <span className="text-[9px] text-zinc-500">
              SYS STATUS: {saasCurrentStep === 'optimized' ? 'COMPLETE_SECURE_OPTIMIZED (🟢 ok)' : isSaaSAutoRunning ? 'COGNITIVE_AUTOPILOT_ENGAGED (🟡 processing)' : 'IDLE (🔴 dormant)'}
            </span>
          </div>

          <div className="h-28 overflow-y-auto space-y-2 text-zinc-450 custom-scrollbar pr-1">
            {saasAutoLogs.length === 0 ? (
              <div className="text-zinc-600 text-xs italic">Awaiting SaaS Autopilot Activation command...</div>
            ) : (
              saasAutoLogs.map((logStr, lIdx) => (
                <div key={lIdx} className="leading-relaxed animate-fade-in text-[11px] text-green-400 flex items-start gap-2 font-mono">
                  <span className="text-cyan-500 font-bold shrink-0">►</span>
                  <span>{logStr}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      </>
      )}

    </div>
  );
};

export default SuperAdminDashboard;
