'use client';

import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useApp } from '@/context/AppContext';

export default function SignUpPage() {
    const { theme } = useApp();
    const isDark = theme === 'dark';

    return (
        <div style={{
            width: '100%',
            minHeight: 'calc(100vh - 80px)',
            display: 'flex',
            backgroundColor: isDark ? '#070708' : '#f8f9fa',
            transition: 'background-color 0.3s ease',
            overflow: 'hidden'
        }}>
            <style jsx global>{`
                input::placeholder {
                    color: ${isDark ? '#a1a1aa !important' : '#71717a !important'};
                    opacity: 1 !important;
                }
                input {
                    color: ${isDark ? '#ffffff !important' : '#000000 !important'};
                }
                .cl-card {
                    overflow: visible !important;
                    height: auto !important;
                    padding-bottom: 24px !important;
                }
                .cl-footer div, .cl-footer span {
                    color: ${isDark ? '#d4d4d8 !important' : '#3f3f46 !important'};
                }
                .cl-footerActionLink {
                    color: #f97316 !important;
                }
                @media (max-width: 900px) {
                    .signup-left-banner {
                        display: none !important;
                    }
                }
            `}</style>

            {/* Left Side Banner */}
            <div className="signup-left-banner" style={{
                flex: '1',
                position: 'relative',
                backgroundImage: 'url("https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '60px',
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: isDark
                        ? 'linear-gradient(to top, rgba(7,7,8,0.96) 0%, rgba(7,7,8,0.5) 60%, rgba(7,7,8,0.2) 100%)'
                        : 'linear-gradient(to top, rgba(20,24,33,0.9) 0%, rgba(20,24,33,0.4) 60%, rgba(20,24,33,0.1) 100%)',
                    transition: 'background 0.3s ease'
                }} />
                <div style={{ position: 'relative', zIndex: 2, color: '#ffffff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ width: '8px', height: '8px', backgroundColor: '#f97316', borderRadius: '50%', marginRight: '8px' }} />
                        <span style={{ color: '#f97316', fontWeight: '600', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '1px' }}>TechNest Ecosystem</span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 10px 0', lineHeight: '1.2' }}>
                        Join TechNest.
                    </h1>
                    <p style={{ color: '#d4d4d8', fontSize: '1rem', maxWidth: '400px', margin: 0, lineHeight: '1.5' }}>
                        Create your account and get access to premium tech gear and exclusive deals.
                    </p>
                </div>
            </div>

            {/* Right Side: Sign Up Box */}
            <div style={{
                flex: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                backgroundColor: isDark ? '#070708' : '#f8f9fa',
            }}>
                <div style={{ width: '100%', maxWidth: '420px', display: 'flex', justifyContent: 'center' }}>
                    <SignUp
                        path="/sign-up"
                        routing="path"
                        signInUrl="/sign-in"
                        appearance={{
                            baseTheme: isDark ? dark : undefined,
                            variables: isDark ? {
                                colorPrimary: '#f97316',
                                colorBackground: '#121214',
                                colorInputBackground: '#1c1c21',
                                colorInputText: '#ffffff',
                                colorText: '#ffffff',
                                colorTextSecondary: '#d4d4d8',
                            } : {
                                colorPrimary: '#f97316',
                            },
                            elements: {
                                rootBox: { width: '100%', display: 'flex', justifyContent: 'center' },
                                card: isDark ? {
                                    backgroundColor: '#121214',
                                    border: '1px solid #27272a',
                                    borderRadius: '1.5rem',
                                    boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
                                    width: '100%',
                                    padding: '24px'
                                } : {
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e4e4e7',
                                    borderRadius: '1.5rem',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                                    width: '100%',
                                    padding: '24px'
                                },
                                headerTitle: { color: isDark ? '#ffffff' : '#09090b', fontWeight: '700', fontSize: '1.5rem' },
                                headerSubtitle: { color: isDark ? '#a1a1aa' : '#71717a', fontSize: '0.875rem' },
                                socialButtonsBlockButton: isDark ? {
                                    backgroundColor: '#18181b',
                                    border: '1px solid #3f3f46',
                                    color: '#ffffff',
                                    borderRadius: '0.75rem'
                                } : {
                                    borderRadius: '0.75rem'
                                },
                                socialButtonsBlockButtonText: { color: isDark ? '#ffffff' : '#09090b', fontWeight: '600' },
                                formButtonPrimary: {
                                    backgroundColor: '#f97316',
                                    color: '#ffffff',
                                    fontWeight: '600',
                                    borderRadius: '0.75rem'
                                },
                                formFieldInput: isDark ? {
                                    backgroundColor: '#1c1c21',
                                    border: '1px solid #3f3f46',
                                    color: '#ffffff',
                                    borderRadius: '0.75rem'
                                } : {
                                    borderRadius: '0.75rem'
                                },
                                formFieldLabel: { color: isDark ? '#d4d4d8' : '#3f3f46', fontWeight: '500' },
                                footerActionLink: { color: '#f97316', fontWeight: '600' },
                                dividerLine: { backgroundColor: isDark ? '#27272a' : '#e4e4e7' },
                                dividerText: { color: '#71717a' },
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
