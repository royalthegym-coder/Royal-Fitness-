import { useEffect } from 'react';
import { subscribeToCollection, subscribeToAuthChanges } from '../../lib/firebase';
import { useDataStore } from '../store/useDataStore';
import { INITIAL_MEMBERS, INITIAL_PACKAGES } from '../../constants';
import { Member, Package } from '../../types';
import { syncToFirebase } from '../../lib/firebase';

export const useFirebaseSync = (currentGymId: string | undefined) => {
    const setMembers = useDataStore(s => s.setMembers);
    const setPackages = useDataStore(s => s.setPackages);

    useEffect(() => {
        let unsubscribeMembers = () => {};
        let unsubscribePackages = () => {};

        // Only subscribe if authenticated
        const unsubscribeAuth = subscribeToAuthChanges(async (user) => {
            // Clean up previous subscriptions before creating new ones
            unsubscribeMembers();
            unsubscribePackages();

            if (!user) {
                setMembers(INITIAL_MEMBERS);
                setPackages(INITIAL_PACKAGES);
                return;
            }

            let isAdmin = false;
            try {
                const { isVerifiedOwnerEmail, resolveUserPortalRole } = await import('../../lib/firebase');
                if (isVerifiedOwnerEmail(user.email)) {
                    isAdmin = true;
                } else {
                    const resolved = await resolveUserPortalRole(user);
                    isAdmin = resolved.role === 'admin' || resolved.role === 'super_admin';
                }
            } catch {
                isAdmin = false;
            }

            if (isAdmin) {
                unsubscribeMembers = subscribeToCollection('members', (data) => {
                    if (data && data.length > 0) {
                        setMembers(data as Member[]);
                    }
                });

                unsubscribePackages = subscribeToCollection('packages', (data) => {
                    if (data && data.length > 0) {
                        setPackages(data as Package[]);
                    }
                });
            } else {
                // Members can read published membership packages
                unsubscribePackages = subscribeToCollection('packages', (data) => {
                    if (data && data.length > 0) {
                        setPackages(data as Package[]);
                    }
                });
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeMembers();
            unsubscribePackages();
        };
    }, [currentGymId, setMembers, setPackages]);
};
