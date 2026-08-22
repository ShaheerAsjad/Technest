'use client';

import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex w-full bg-[#070708] text-white selection:bg-[#FF6600]/30 overflow-hidden">
      
      {/* LEFT HALF — Architectural Image / Welcome Message */}
      <div className="hidden lg:flex w-[45%] relative flex-col justify-end p-12 overflow-hidden border-r border-white/5">
        {/* We use a dark gradient overlay on top of an abstract architectural background */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?q=80&w=1200&auto=format&fit=crop')" }} 
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#070708] via-[#070708]/80 to-transparent" />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent to-[#070708]" />
        
        {/* TechNest Logo Watermark */}
        <div className="absolute top-10 left-10 z-20 flex items-center gap-3 opacity-80">
          <div className="w-8 h-8 rounded border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md text-[#FF6600] font-bold text-lg shadow-[0_0_15px_rgba(255,102,0,0.2)]">
            T
          </div>
          <span className="font-bold tracking-widest uppercase text-sm">TechNest</span>
        </div>

        <div className="relative z-20 max-w-md">
          <div className="w-12 h-1 bg-[#FF6600] mb-6 rounded-full shadow-[0_0_10px_#FF6600]" />
          <h1 className="text-5xl font-light mb-4 leading-tight tracking-tight">
            Welcome<br />
            <span className="font-bold">Back</span>
          </h1>
          <p className="text-[#A3A3A3] text-sm leading-relaxed max-w-sm">
            Glad to see you again.<br />
            Let's continue where you left off and explore the next generation of tech.
          </p>
          <div className="mt-20 text-xs text-[#5A5A5A]">
            © 2026 TechNest. All rights reserved.
          </div>
        </div>
      </div>

      {/* RIGHT HALF — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        
        {/* Subtle ambient glows */}
        <div className="absolute top-[20%] left-[30%] w-96 h-96 bg-[#FF6600]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[20%] w-72 h-72 bg-[#00D9FF]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[420px] relative z-10">
          {/* Glass Card */}
          <div className="bg-[#121214]/80 backdrop-blur-2xl border border-white/[0.04] p-10 rounded-[28px] shadow-2xl">
            
            {/* Hexagon Icon Header */}
            <div className="flex flex-col items-center mb-10">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6 shadow-inner">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(255,102,0,0.5))' }}>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Login</h2>
              <p className="text-[#A3A3A3] text-sm">Login to your account to continue</p>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#E7E7E7] ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5A5A5A] group-focus-within:text-[#FF6600] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                  </div>
                  <input 
                    type="email" 
                    placeholder="you@example.com"
                    className="w-full bg-[#0D0D0E] border border-white/[0.05] rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder-[#5A5A5A] focus:outline-none focus:border-[#FF6600]/40 focus:ring-1 focus:ring-[#FF6600]/40 transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#E7E7E7] ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#5A5A5A] group-focus-within:text-[#FF6600] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full bg-[#0D0D0E] border border-white/[0.05] rounded-xl py-3.5 pl-11 pr-11 text-sm text-white placeholder-[#5A5A5A] focus:outline-none focus:border-[#FF6600]/40 focus:ring-1 focus:ring-[#FF6600]/40 transition-all shadow-inner"
                  />
                  <button type="button" className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#5A5A5A] hover:text-[#E7E7E7] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <Link href="#" className="text-xs text-[#FF6600] hover:text-[#FF8533] transition-colors font-medium">
                  Forgot Password?
                </Link>
              </div>

              {/* Login Button */}
              <button 
                type="submit"
                className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF8533] to-[#FF6600] text-black font-semibold rounded-xl py-3.5 mt-2 transition-all hover:scale-[1.02] shadow-[0_4px_20px_rgba(255,102,0,0.25)] hover:shadow-[0_4px_25px_rgba(255,102,0,0.4)]"
              >
                Login
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-1"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-8">
              <div className="flex-grow border-t border-white/[0.05]"></div>
              <span className="flex-shrink-0 mx-4 text-xs text-[#5A5A5A]">or continue with</span>
              <div className="flex-grow border-t border-white/[0.05]"></div>
            </div>

            {/* Social Logins */}
            <div className="flex justify-center gap-4">
              <button type="button" className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center hover:bg-white/[0.06] transition-colors group">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#A3A3A3] group-hover:text-white transition-colors">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
              <button type="button" className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center hover:bg-white/[0.06] transition-colors group">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#A3A3A3] group-hover:text-white transition-colors"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.15 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.62 1.52-1.58 2.96-2.53 4.08zM12.03 7.25C11.97 4.04 14.53 1.33 17.5 1c.21 3.23-2.67 6.01-5.47 6.25z"/></svg>
              </button>
              <button type="button" className="w-12 h-12 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center hover:bg-white/[0.06] transition-colors group">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-[#A3A3A3] group-hover:text-white transition-colors"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
              </button>
            </div>

            {/* Footer Links */}
            <div className="mt-8 text-center text-xs text-[#A3A3A3]">
              Don't have an account? <Link href="/sign-up" className="text-[#FF6600] font-medium hover:text-[#FF8533] transition-colors">Sign up</Link>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-8 text-[#5A5A5A] text-[10px]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Your data is secure with us
          </div>
        </div>
      </div>
    </div>
  );
}
