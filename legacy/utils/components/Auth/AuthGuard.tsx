import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { auth, resolveUserPortalRole } from '../../../lib/firebase';

export const AuthGuard = ({ children, requiredRoles }: { children: React.ReactNode, requiredRoles: string[] }) => {
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && requiredRoles.includes(user.user_metadata?.role)) {
                setAuthorized(true);
                setLoading(false);
                return;
            }
            if (auth?.currentUser) {
                const resolved = await resolveUserPortalRole(auth.currentUser, 'admin');
                if (requiredRoles.includes(resolved.role)) {
                    setAuthorized(true);
                    setLoading(false);
                    return;
                }
            }
            setAuthorized(false);
            setLoading(false);
        };
        checkAuth();
    }, [requiredRoles]);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-black">
            <div className="text-cyan-500 font-mono tracking-widest animate-pulse">FitnessFutureSecuring...</div>
        </div>
    );
    
    return authorized ? <>{children}</> : <div className="text-red-500 p-10 font-bold">UNAUTHORIZED / ACCESS DENIED</div>;
};
