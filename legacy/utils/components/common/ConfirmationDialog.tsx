import React from 'react';
import Modal from './Modal';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-gray-400 mb-6">{message}</p>
      <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-500 transition-colors"
        >
          Confirm
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
