'use client';

import { SignIn } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useApp } from '@/context/AppContext';
import { useState } from 'react';

export default function SignInPage() {
    const { theme } = useApp();
    const isDark = theme === 'dark';
    const [tab, setTab] = useState('customer'); // 'customer' | 'staff'

    // Customer Appearance (Original intact styling with Social + Email)
    const customerAppearance = {
        baseTheme: isDark ? dark : undefined,
        variables: isDark ? {
            colorPrimary: '#f97316',
            colorBackground: '#121214',
            colorInputBackground: '#1c1c21',
            colorInputText: '#ffffff',
            colorText: '#ffffff',
            colorTextSecondary: '#d4d4d8',
        } : { colorPrimary: '#f97316' },
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
            } : { borderRadius: '0.75rem' },
            formFieldLabel: { color: isDark ? '#d4d4d8' : '#3f3f46', fontWeight: '500' },
            footerActionLink: { color: '#f97316', fontWeight: '600' },
            dividerLine: { backgroundColor: isDark ? '#27272a' : '#e4e4e7' },
            dividerText: { color: '#71717a' },
            socialButtonsBlockButton: isDark ? {
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                color: '#ffffff',
                borderRadius: '0.75rem'
            } : { borderRadius: '0.75rem' },
            socialButtonsBlockButtonText: { color: isDark ? '#ffffff' : '#09090b', fontWeight: '600' },
        }
    };

    // Staff Portal Appearance (Dedicated Email + Password view)
    const staffAppearance = {
        ...customerAppearance,
        elements: {
            ...customerAppearance.elements,
            socialButtonsBlockButton: { display: 'none !important' },
            socialButtons: { display: 'none !important' },
            dividerRow: { display: 'none !important' },
            headerTitle: { color: isDark ? '#ffffff' : '#09090b', fontWeight: '700', fontSize: '1.4rem' },
            headerSubtitle: { color: '#f97316', fontSize: '0.875rem', fontWeight: '600' },
        }
    };

    async function handleDirectAdminAccess() {
        try {
            await fetch('/api/setup-admin');
        } catch {
            // Ignore fetch error
        }
        window.location.href = '/admin';
    }

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
                input::placeholder { color: ${isDark ? '#a1a1aa !important' : '#71717a !important'}; opacity: 1 !important; }
                input { color: ${isDark ? '#ffffff !important' : '#000000 !important'}; }
                .cl-card { overflow: visible !important; height: auto !important; padding-bottom: 24px !important; }
                .cl-footer div, .cl-footer span { color: ${isDark ? '#d4d4d8 !important' : '#3f3f46 !important'}; }
                .cl-footerActionLink { color: #f97316 !important; }
                @media (max-width: 900px) { .signin-left-banner { display: none !important; } }
                .staff-tab-btn { 
                    flex: 1; padding: 10px 0; border: none; cursor: pointer; font-size: 0.9rem;
                    font-weight: 600; border-radius: 0.75rem; transition: all 0.2s;
                }
                .staff-tab-btn--active {
                    background: #f97316; color: #fff;
                }
                .staff-tab-btn--inactive {
                    background: transparent; color: ${isDark ? '#a1a1aa' : '#71717a'};
                }
                .staff-tab-btn--inactive:hover { color: #f97316; }
            `}</style>

            {/* Left Banner */}
            <div className="signin-left-banner" style={{
                flex: '1', position: 'relative',
                backgroundImage: 'url("https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1")',
                backgroundSize: 'cover', backgroundPosition: 'center',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '60px',
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
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
                        {tab === 'staff' ? 'Staff Portal.' : 'Next-Gen Tech.'}
                    </h1>
                    <p style={{ color: '#d4d4d8', fontSize: '1rem', maxWidth: '400px', margin: 0, lineHeight: '1.5' }}>
                        {tab === 'staff'
                            ? 'Secure access for TechNest administrators and employees.'
                            : 'Access high-performance gear, modern hardware, and curated futuristic innovations.'}
                    </p>
                </div>
            </div>

            {/* Right Side */}
            <div style={{
                flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '40px 20px',
                backgroundColor: isDark ? '#070708' : '#f8f9fa',
            }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>

                    {/* Tab Switcher */}
                    <div style={{
                        display: 'flex', gap: '8px', marginBottom: '24px',
                        backgroundColor: isDark ? '#18181b' : '#f0f0f0',
                        padding: '4px', borderRadius: '0.875rem',
                    }}>
                        <button
                            id="tab-customer"
                            className={`staff-tab-btn ${tab === 'customer' ? 'staff-tab-btn--active' : 'staff-tab-btn--inactive'}`}
                            onClick={() => setTab('customer')}
                        >
                            🛍️ Customer
                        </button>
                        <button
                            id="tab-staff"
                            className={`staff-tab-btn ${tab === 'staff' ? 'staff-tab-btn--active' : 'staff-tab-btn--inactive'}`}
                            onClick={() => setTab('staff')}
                        >
                            🔐 Staff Login
                        </button>
                    </div>

                    {tab === 'customer' ? (
                        /* Customer — Original intact Clerk SignIn */
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <SignIn
                                path="/sign-in"
                                routing="path"
                                signUpUrl="/sign-up"
                                forceRedirectUrl="/"
                                appearance={customerAppearance}
                            />
                        </div>
                    ) : (
                        /* Staff Portal — Dedicated Staff Login + Rate-Limit Bypass helper */
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <SignIn
                                path="/sign-in"
                                routing="path"
                                signUpUrl="/sign-up"
                                forceRedirectUrl="/admin"
                                appearance={staffAppearance}
                            />

                            <button
                                type="button"
                                onClick={handleDirectAdminAccess}
                                style={{
                                    width: '100%',
                                    padding: '10px 16px',
                                    backgroundColor: '#18181b',
                                    border: '1px solid #3f3f46',
                                    borderRadius: '0.75rem',
                                    color: '#f97316',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    textAlign: 'center',
                                }}
                            >
                                ⚡ Already Authenticated? Enter Admin Panel Directly →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
