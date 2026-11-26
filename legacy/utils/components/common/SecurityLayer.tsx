import React from 'react';

interface SecurityLayerProps {
    children: React.ReactNode;
    className?: string;
}

const SecurityLayer: React.FC<SecurityLayerProps> = ({ children, className }) => {
    return (
        <div className={`relative ${className || ''}`}>
            {children}
        </div>
    );
};

export default SecurityLayer;

