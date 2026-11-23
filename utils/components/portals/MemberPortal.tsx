import React from 'react';
import { signOutFirebaseUser } from '../../../lib/firebase';
import { useSessionStore } from '../../../lib/session';
import { useData } from '../../context/DataProvider';
import CleanMemberPortal from '../suite/CleanMemberPortal';

/**
 * Member portal. Data is limited by firestore.rules to the member's own member record,
 * invoices, payments, attendance plus the gym's packages / workout & diet templates.
 */
export const MemberPortal: React.FC = () => {
  const memberId = useSessionStore((s) => s.profile?.memberId ?? null);
  const { members, isHydrating } = useData();
  const me = members.find((m) => m.id === memberId);

  if (memberId == null || (!isHydrating && !me)) {
    return (
      <div className="min-h-screen w-screen bg-[#09090B] flex items-center justify-center p-4 text-zinc-200">
        <div className="max-w-sm text-center space-y-3">
          <p className="text-sm">Your login is active, but your gym hasn't linked it to a membership record yet.</p>
          <p className="text-xs text-zinc-500">Ask the front desk to link your account in “Team & Access”.</p>
          <button type="button" onClick={() => void signOutFirebaseUser()} className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 text-sm font-semibold">
            Sign out
          </button>
        </div>
      </div>
    );
  }
  if (!me) {
    return <div className="min-h-screen w-screen bg-[#09090B] flex items-center justify-center text-xs text-zinc-500">Loading your membership…</div>;
  }
  return <CleanMemberPortal member={me} onExit={() => void signOutFirebaseUser()} />;
};

export default MemberPortal;
