
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setContainer(document.body);
    return () => {
      setMounted(false);
      setContainer(null);
    };
  }, []);

  if (!isOpen || !mounted || !container) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with blur and click-to-close */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div 
        className="bg-[#121212] border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-lg transform transition-all relative z-10 flex flex-col max-h-[90vh] animate-scale-in"
        role="dialog" 
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h3 className="text-xl font-black text-white uppercase italic tracking-wider truncate pr-4">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/20 flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    container
  );
};

export default Modal;
