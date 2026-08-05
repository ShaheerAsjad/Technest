'use client';

import { useApp } from '@/context/AppContext';

export default function ToastContainer() {
  const { toasts } = useApp();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type} toast--visible`}>
          {toast.message}
        </div>
      ))}
    </div>
  );
}
