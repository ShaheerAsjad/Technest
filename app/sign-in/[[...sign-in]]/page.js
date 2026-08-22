'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="auth-page">
      
      {/* LEFT HALF — Architectural Image / Welcome Message */}
      <div className="auth-left">
        <div className="auth-left-bg" />
        <div className="auth-left-overlay-t" />
        <div className="auth-left-overlay-r" />
        
        {/* TechNest Logo Watermark */}
        <div className="auth-brand">
          <div className="auth-brand-logo">T</div>
          <span className="auth-brand-name">TechNest</span>
        </div>

        <div className="auth-left-content">
          <div className="auth-orange-line" />
          <h1 className="auth-left-title">
            Welcome<br />
            <strong>Back</strong>
          </h1>
          <p className="auth-left-sub">
            Glad to see you again.<br />
            Let's continue where you left off.
          </p>
          <div className="auth-left-copy">
            © 2026 TechNest. All rights reserved.
          </div>
        </div>
      </div>

      {/* RIGHT HALF — Clerk Authentication Component */}
      <div className="auth-right">
        {/* Ambient glowing Orbs */}
        <div className="auth-glow-orb-1" />
        <div className="auth-glow-orb-2" />

        <div className="auth-card-wrap flex justify-center items-center">
          <SignIn 
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            appearance={{
              elements: {
                rootBox: 'w-full flex justify-center',
                card: 'bg-[#121214]/85 backdrop-blur-2xl border border-white/[0.06] rounded-[28px] shadow-2xl p-8 text-white w-full max-w-[440px]',
                headerTitle: 'text-2xl font-bold text-white text-center',
                headerSubtitle: 'text-sm text-[#A3A3A3] text-center',
                socialButtonsBlockButton: 'bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.07] text-white rounded-xl py-3 font-medium transition-all',
                socialButtonsBlockButtonText: 'text-white font-medium text-sm',
                dividerLine: 'bg-white/[0.06]',
                dividerText: 'text-[#5A5A5A] text-xs',
                formFieldLabel: 'text-xs font-medium text-[#E7E7E7]',
                formFieldInput: 'bg-[#0D0D0E] border border-white/[0.06] rounded-xl text-white py-3 px-4 focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]/50 transition-all',
                formButtonPrimary: 'bg-gradient-to-r from-[#FF8533] to-[#FF6600] text-black font-bold rounded-xl py-3.5 hover:scale-[1.02] shadow-[0_4px_20px_rgba(255,102,0,0.3)] transition-all',
                footerActionLink: 'text-[#FF6600] hover:text-[#FF8533] font-semibold',
                identityPreviewText: 'text-white',
                formResendCodeLink: 'text-[#FF6600]',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
