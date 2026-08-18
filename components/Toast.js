'use client';

import { useApp } from '@/context/AppContext';

export default function ToastContainer() {
  const { toasts } = useApp();

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type} toast--visible`}
          role="status"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
