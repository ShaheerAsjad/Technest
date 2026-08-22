'use client';

import Link from 'next/link';

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

      {/* RIGHT HALF — Glassmorphic Login Form */}
      <div className="auth-right">
        
        {/* Ambient glowing Orbs */}
        <div className="auth-glow-orb-1" />
        <div className="auth-glow-orb-2" />

        <div className="auth-card-wrap">
          {/* Glass Card */}
          <div className="auth-glass-card">
            
            {/* Hexagon Icon Header */}
            <div className="auth-card-header">
              <div className="auth-icon-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6600" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(255,102,0,0.5))' }}>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <h2 className="auth-card-title">Login</h2>
              <p className="auth-card-sub">Login to your account to continue</p>
            </div>

            <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
              {/* Email Input */}
              <div className="auth-field-group">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-rel">
                  <div className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                  </div>
                  <input 
                    type="email" 
                    placeholder="you@example.com"
                    className="auth-input"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="auth-field-group">
                <label className="auth-label">Password</label>
                <div className="auth-input-rel">
                  <div className="auth-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="auth-input"
                  />
                  <button type="button" className="auth-toggle-pwd" aria-label="Toggle password visibility">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
                  </button>
                </div>
              </div>

              <div className="auth-forgot-row">
                <Link href="#" className="auth-forgot-link">
                  Forgot Password?
                </Link>
              </div>

              {/* Login Button */}
              <button type="submit" className="auth-submit-btn">
                Login
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or continue with</span>
              <div className="auth-divider-line" />
            </div>

            {/* Social Logins */}
            <div className="auth-social-row">
              <button type="button" className="auth-social-btn" aria-label="Google sign in">
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
              <button type="button" className="auth-social-btn" aria-label="Apple sign in">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.15 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.62 1.52-1.58 2.96-2.53 4.08zM12.03 7.25C11.97 4.04 14.53 1.33 17.5 1c.21 3.23-2.67 6.01-5.47 6.25z"/></svg>
              </button>
              <button type="button" className="auth-social-btn" aria-label="GitHub sign in">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>
              </button>
            </div>

            {/* Footer Links */}
            <div className="auth-footer-text">
              Don't have an account? <Link href="/sign-up" className="auth-footer-link">Sign up</Link>
            </div>
          </div>
          
          <div className="auth-secure-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Your data is secure with us
          </div>
        </div>
      </div>
    </div>
  );
}
