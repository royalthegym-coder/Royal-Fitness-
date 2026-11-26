import React, { useMemo, useState } from 'react';
import {
  User,
  Dumbbell,
  Utensils,
  Receipt,
  CheckSquare,
  Share2,
  MapPin,
  Phone,
  Printer,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { Member, Invoice } from '../../../types';
import { useData } from '../../context/DataProvider';
import { useGym } from '../../context/GymProvider';
import { normalizeSafeExternalUrl } from '../../imageUpload';
import ReceiptTemplate from '../common/ReceiptTemplate';
import { CustomerSocialShowcase } from './SocialConnectHub';

interface CleanMemberPortalProps {
  member: Member;
  onExit: () => void;
  isPreview?: boolean;
}

type PortalTab = 'overview' | 'social' | 'plans' | 'receipts';

export const CleanMemberPortal: React.FC<CleanMemberPortalProps> = ({
  member,
  onExit,
  isPreview = false,
}) => {
  const { packages, invoices, attendanceRecords, workoutTemplates, dietPlans } = useData();
  const { currentGym } = useGym();

  const [activeTab, setActiveTab] = useState<PortalTab>('social');
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);

  const memberPkg = packages.find((p) => p.id === member.packageId);
  const memberInvoices = useMemo(
    () => invoices.filter((i) => i.memberId === member.id),
    [invoices, member.id]
  );
  const memberAttendance = useMemo(
    () => attendanceRecords.filter((a) => a.memberId === member.id),
    [attendanceRecords, member.id]
  );

  const assignedWorkout =
    workoutTemplates.find((w) => member.assignedWorkoutId != null && w.id === member.assignedWorkoutId) ||
    workoutTemplates.find((w) => w.name === member.approvedAiPlan);
  const assignedDiet = dietPlans.find((d) => member.assignedDietId != null && d.id === member.assignedDietId);

  const hMeters = ((member.height || member.physical_metrics?.height || 170) as number) / 100;
  const weightKg = (member.weight || member.physical_metrics?.weight || 70) as number;
  const bmi = hMeters > 0 ? (weightKg / (hMeters * hMeters)).toFixed(1) : '—';
  const safeMapUrl = normalizeSafeExternalUrl(currentGym?.googleLocationUrl || '');

  return (
    <div className="bg-[#09090B] text-zinc-100 min-h-full">
      {/* Clean Member Portal Header */}
      <div className="bg-[#111318] border-b border-white/10 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {currentGym?.logoUrl ? (
            <img
              src={currentGym.logoUrl}
              alt={currentGym.gymName}
              className="w-10 h-10 rounded-xl object-cover border border-white/15 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm flex items-center justify-center shrink-0">
              {(currentGym?.gymName || 'FF').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">
              {currentGym?.gymName || 'Fitness Future'} — Member Portal
            </div>
            <div className="text-xs text-zinc-400 truncate">
              Welcome, {member.name} · {member.status} Member
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-xs font-medium text-zinc-200 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          {isPreview ? 'Back to Dashboard' : 'Sign Out'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-white/10 bg-[#0D0F14] px-4 sm:px-6 py-2.5 flex flex-wrap gap-2">
        {(
          [
            { id: 'social', label: 'Gym & Super Admin Profiles / Videos', icon: Share2 },
            { id: 'overview', label: 'My Membership', icon: User },
            { id: 'plans', label: 'Workout & Diet', icon: Dumbbell },
            { id: 'receipts', label: 'Receipts & Attendance', icon: Receipt },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                active
                  ? 'bg-amber-500 text-zinc-950'
                  : 'bg-zinc-900 text-zinc-300 border border-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        {activeTab === 'social' && <CustomerSocialShowcase />}

        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-zinc-400">Active Plan</div>
                <div className="text-lg font-bold text-white mt-1">
                  {memberPkg?.name || 'Standard Plan'}
                </div>
                <div className="text-xs text-emerald-400 mt-1">{member.status}</div>
              </div>
              <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-zinc-400">Health &amp; BMI</div>
                <div className="text-2xl font-bold text-white mt-1 tabular-nums">{bmi} BMI</div>
                <div className="text-xs text-zinc-400 mt-1 tabular-nums">
                  {weightKg} kg · Goal: {member.fitnessGoal || 'Fitness'}
                </div>
              </div>
              <div className="bg-[#111318] border border-white/10 rounded-xl p-5">
                <div className="text-xs text-zinc-400">Gym Visits Recorded</div>
                <div className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">
                  {memberAttendance.length}
                </div>
                <div className="text-xs text-zinc-400 mt-1">Joined {member.joinDate}</div>
              </div>
            </div>

            {/* Assigned Gym Owner Card */}
            <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Your Registered Gym Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
                <div>
                  <span className="text-zinc-500">Gym Name: </span>
                  <span className="font-semibold text-white">{currentGym?.gymName || 'Fitness Future'}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Gym Owner: </span>
                  <span className="font-semibold text-white">{currentGym?.ownerName || 'Owner'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{currentGym?.phone || 'Contact at front desk'}</span>
                </div>
                <div>
                  <span className="text-zinc-500">UPI ID: </span>
                  <span className="font-medium text-amber-400">
                    {currentGym?.paymentUpiId || currentGym?.upiId || 'Not set'}
                  </span>
                </div>
              </div>
              {safeMapUrl && (
                <a
                  href={safeMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 pt-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Open Gym Google Location
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-amber-400" />
                {assignedWorkout?.name || 'Workout Plan'}
              </h3>
              <p className="text-xs text-zinc-400">{assignedWorkout?.description}</p>
              {(assignedWorkout?.mainWorkout || []).map((day, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-zinc-900/70 border border-white/5 space-y-1.5">
                  <div className="text-xs font-semibold text-amber-400">{day.name}</div>
                  {day.exercises.map((ex, i) => (
                    <div key={i} className="flex justify-between text-xs text-zinc-300">
                      <span>{ex.name}</span>
                      <span className="text-zinc-400 tabular-nums">
                        {ex.sets} × {ex.reps}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                {assignedDiet?.name || 'Nutrition Plan'}
              </h3>
              {assignedDiet && (
                <>
                  <p className="text-xs text-zinc-400 tabular-nums">
                    {assignedDiet.calories} kcal/day · P {assignedDiet.macros.protein}g · C{' '}
                    {assignedDiet.macros.carbs}g · F {assignedDiet.macros.fats}g
                  </p>
                  {assignedDiet.meals.map((meal, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-zinc-900/70 border border-white/5 space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-white">
                        <span>{meal.name}</span>
                        <span className="text-emerald-400 tabular-nums">{meal.time}</span>
                      </div>
                      {meal.items.map((it, i) => (
                        <div key={i} className="text-xs text-zinc-400">
                          {it.food} — {it.portion}
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'receipts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                My Payment Receipts ({memberInvoices.length})
              </h3>
              {memberInvoices.length === 0 ? (
                <p className="text-xs text-zinc-400">No invoices recorded yet.</p>
              ) : (
                memberInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">
                        #{inv.id} · {inv.packageName}
                      </div>
                      <div className="text-xs text-zinc-400 tabular-nums">
                        {inv.date} · ₹{inv.amount.toLocaleString('en-IN')} · {inv.status}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptInvoice(inv)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-amber-400 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Receipt
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="bg-[#111318] border border-white/10 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Recent Check-Ins ({memberAttendance.length})
              </h3>
              {memberAttendance.length === 0 ? (
                <p className="text-xs text-zinc-400">No attendance entries yet.</p>
              ) : (
                memberAttendance.map((att) => (
                  <div
                    key={att.id}
                    className="p-3 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="text-white font-medium tabular-nums">{att.date}</div>
                      <div className="text-zinc-400 tabular-nums">
                        In: {att.checkInTime || att.time} · Out: {att.checkOutTime || 'On floor'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold">
                      {att.zone || 'Main Floor'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {receiptInvoice && (
        <ReceiptTemplate
          invoiceId={String(receiptInvoice.id)}
          memberName={receiptInvoice.memberName}
          memberId={receiptInvoice.memberId}
          memberPhone={member.phone}
          amount={receiptInvoice.amount}
          date={receiptInvoice.date}
          method={receiptInvoice.paymentMethod || 'UPI'}
          items={
            receiptInvoice.items || [
              { description: receiptInvoice.packageName, amount: receiptInvoice.amount, type: 'Membership' },
            ]
          }
          onClose={() => setReceiptInvoice(null)}
        />
      )}
    </div>
  );
};

export default CleanMemberPortal;
