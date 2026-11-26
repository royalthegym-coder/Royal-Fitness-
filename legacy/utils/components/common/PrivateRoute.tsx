import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';

interface PrivateRouteProps {
    children: React.ReactNode;
    isAuthenticated: boolean;
    allowedRoles?: string[];
    userRole?: string;
    redirectPath?: string;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
    children, 
    isAuthenticated, 
    allowedRoles, 
    userRole,
    redirectPath = '/' 
}) => {
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            
            let isAuth = isAuthenticated;
            let role = userRole;

            // In an actual prod Supabase setup, verify using JWT Metadata
            if (user && user.user_metadata?.role) {
                isAuth = true;
                role = user.user_metadata.role;
            }

            if (!isAuth) {
                setAuthorized(false);
            } else if (allowedRoles && role && !allowedRoles.includes(role)) {
                setAuthorized(false);
            } else {
                setAuthorized(true);
            }
            setLoading(false);
        };
        checkAuth();
    }, [isAuthenticated, allowedRoles, userRole]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-black">
                <div className="text-cyan-500 font-mono tracking-widest animate-pulse">FitnessFutureSecuring...</div>
            </div>
        );
    }

    if (!authorized && !isAuthenticated) {
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    if (!authorized) {
        return <div className="text-red-500 p-10 font-bold font-mono border border-red-500/30 rounded-xl bg-red-500/10 text-center m-10">403 UNAUTHORIZED / HYPER VIGILANCE SECURITY TRIGGERED</div>;
    }

    return <>{children}</>;
};
