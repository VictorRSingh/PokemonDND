import React, { ReactNode } from "react";

interface ModalProps {
  modal_id: string;
  modalTitle: string;
  showModal: boolean;
  setShowModal: (showModal: boolean) => void;
  children: ReactNode;
  actionButton?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  modal_id,
  modalTitle,
  showModal,
  setShowModal,
  children,
  actionButton
}) => {
  if (!showModal) return null;
  return (
    <div>
      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 text-black p-4"
        id={modal_id}
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
      >
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white p-6 rounded-xl shadow-xl">
          <h1 className="text-xl font-bold mb-4">{modalTitle}</h1>
          <div className="mb-6">{children}</div>
          <div className="flex justify-end">
            <div className="flex gap-x-2">
                {actionButton}
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
