'use client';

import { AppProvider } from '@/context/AppContext';
import ToastContainer from '@/components/Toast';

export default function Providers({ children }) {
  return (
    <AppProvider>
      {children}
      <ToastContainer />
    </AppProvider>
  );
}
