'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="w-full min-h-[calc(100vh-160px)] flex items-center justify-center py-16 px-4 bg-[#070708]">
      <div className="flex justify-center items-center w-full max-w-md">
        <SignIn 
          path="/sign-in" 
          routing="path" 
          signUpUrl="/sign-up" 
          appearance={{
            elements: {
              rootBox: 'w-full flex justify-center',
              card: 'shadow-2xl rounded-2xl border border-white/10 w-full',
            }
          }}
        />
      </div>
    </div>
  );
}
