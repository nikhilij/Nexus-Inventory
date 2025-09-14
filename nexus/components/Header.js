"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Header({
    user = null,
    company = null,
    // Default nav includes public items first, app pages are marked `protected`
    navItems = [
        { key: 'about', label: 'About', href: '/about' },
        { key: 'platform', label: 'Platform', href: '/platform' },
        { key: 'services', label: 'Services', href: '/services' },
        { key: 'contact', label: 'Contact', href: '/contact' },
        { key: 'dashboard', label: 'Dashboard', href: '/', protected: true },
        { key: 'products', label: 'Products', href: '/products', protected: true },
        { key: 'inventory', label: 'Inventory', href: '/inventory', protected: true },
        { key: 'orders', label: 'Orders', href: '/orders', protected: true },
        { key: 'suppliers', label: 'Suppliers', href: '/suppliers', protected: true },
        { key: 'reports', label: 'Reports', href: '/reports', protected: true },
        { key: 'settings', label: 'Settings', href: '/settings', protected: true },
    ],
    unreadNotifications = 0,
    onSignOut = () => { },
    onOpenSidebar = () => { },
    onSearch = () => { },
    onQuickAction = () => { },
    onNavSelect = () => { },
    onSwitchCompany = () => { },
    isAuthenticated = false,
    isLoading = false,
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const [query, setQuery] = useState("");
    const searchRef = useRef(null);
    const mobilePanelRef = useRef(null);
    const hamburgerRef = useRef(null);

    // Keyboard shortcut: focus search on '/' (only when authenticated)
    useEffect(() => {
        if (!isAuthenticated) return;
        function onKey(e) {
            if (e.key === '/' && document.activeElement !== searchRef.current) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isAuthenticated]);

    // Close mobile panel on Escape and trap focus when open (simple)
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'Escape') {
                if (mobileOpen) {
                    setMobileOpen(false);
                    hamburgerRef.current?.focus();
                }
                if (notifOpen) setNotifOpen(false);
                if (userOpen) setUserOpen(false);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [mobileOpen, notifOpen, userOpen]);

    // Simple focus trap: keep focus inside mobilePanel when open
    useEffect(() => {
        if (!mobileOpen || !mobilePanelRef.current) return;
        const panel = mobilePanelRef.current;
        const focusable = panel.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        function onKey(e) {
            if (e.key !== 'Tab') return;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
            }
        }
        panel.addEventListener('keydown', onKey);
        first?.focus();
        return () => panel.removeEventListener('keydown', onKey);
    }, [mobileOpen]);

    function submitSearch(e) {
        e?.preventDefault();
        if (query.trim() === '') return;
        onSearch(query.trim());
    }

    return (
        <header role="banner" className="site-header">

            <div className="header-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Left side */}
                <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                        aria-label="Open menu"
                        aria-expanded={mobileOpen}
                        aria-controls="mobile-nav"
                        onClick={() => { setMobileOpen(v => !v); onOpenSidebar(); }}
                        ref={hamburgerRef}
                    >
                        ☰
                    </button>

                    <Link href="/" aria-label="Home" className="logo-link">
                        <div className="logo" aria-hidden>{company?.logoUrl ? <img src={company.logoUrl} alt="" style={{ height: 24 }} /> : <strong>Nexus</strong>}</div>
                    </Link>

                    <div className="company-name" aria-live="polite">
                        {isLoading ? 'Loading company…' : (company?.name ?? 'Company')}
                    </div>

                    {/* optional env badge */}
                </div>

                {/* Center */}
                <div className="header-center" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <nav role="navigation" aria-label="Primary" className="primary-nav">
                        <ul style={{ display: 'flex', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
                            {navItems.filter(i => !(i.protected && !isAuthenticated)).map(item => (
                                <li key={item.key}>
                                    <Link href={item.href || '#'} onClick={() => onNavSelect(item.key)}>{item.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {isAuthenticated && (
                        <form role="search" onSubmit={submitSearch} className="search-form" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <label htmlFor="header-search" className="visually-hidden">Search</label>
                            <input
                                id="header-search"
                                ref={searchRef}
                                type="search"
                                placeholder="Search"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                aria-label="Search"
                            />
                            <button type="submit" aria-label="Submit search">🔍</button>
                        </form>
                    )}
                </div>

                {/* Right side */}
                <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Right side controls: show quick-actions, notifications and user menu only to authenticated users */}
                    {isAuthenticated ? (
                        <>
                            <div className="quick-actions">
                                <button onClick={() => onQuickAction('create_product')} aria-label="Create product">+ Product</button>
                                <button onClick={() => onQuickAction('create_order')} aria-label="Create purchase order">+ PO</button>
                            </div>

                            <div className="notifications">
                                <button aria-label={`Notifications (${unreadNotifications})`} aria-haspopup="true" aria-expanded={notifOpen} onClick={() => setNotifOpen(v => !v)}>
                                    🔔 {unreadNotifications > 0 ? <span className="badge" aria-live="polite">{unreadNotifications}</span> : null}
                                </button>
                                {notifOpen && (
                                    <div role="dialog" aria-label="Notifications" className="notif-dropdown">
                                        <div style={{ padding: 8 }}>You have {unreadNotifications} unread notifications</div>
                                        <Link href="/notifications">View all</Link>
                                    </div>
                                )}
                            </div>

                            <div className="user-menu">
                                <button aria-haspopup="true" aria-expanded={userOpen} onClick={() => setUserOpen(v => !v)} aria-label="Open user menu">
                                    {user?.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ height: 28, width: 28, borderRadius: '50%' }} /> : <span className="avatar-placeholder" aria-hidden>{user ? user.name?.[0] : 'U'}</span>}
                                </button>
                                {userOpen && (
                                    <ul role="menu" className="user-dropdown">
                                        <li role="menuitem"><Link href="/account">Account</Link></li>
                                        <li role="menuitem"><Link href="/profile">Profile</Link></li>
                                        <li role="menuitem"><button onClick={() => onSwitchCompany('')}>Switch company</button></li>
                                        <li role="menuitem"><button onClick={onSignOut}>Sign out</button></li>
                                    </ul>
                                )}
                            </div>
                        </>
                    ) : (
                        // Public users: show help + auth CTAs
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="help">
                                <Link href="/docs" aria-label="Help and documentation">❓</Link>
                            </div>
                            <div className="auth-ctas">
                                <Link href="/login"><button>Sign in</button></Link>
                                <Link href="/signup"><button>Sign up</button></Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile nav panel */}
            {mobileOpen && (
                <div id="mobile-nav" ref={mobilePanelRef} className="mobile-panel" role="dialog" aria-label="Mobile menu">
                    <nav role="navigation" aria-label="Mobile Primary">
                        <ul style={{ listStyle: 'none', padding: 8 }}>
                            {navItems.filter(i => !(i.protected && !isAuthenticated)).map(item => (
                                <li key={item.key}>
                                    <Link href={item.href || '#'} onClick={() => { onNavSelect(item.key); setMobileOpen(false); }}>{item.label}</Link>
                                </li>
                            ))}
                            {!isAuthenticated && (
                                <>
                                    <li><Link href="/login" onClick={() => setMobileOpen(false)}>Sign in</Link></li>
                                    <li><Link href="/signup" onClick={() => setMobileOpen(false)}>Sign up</Link></li>
                                </>
                            )}
                        </ul>
                    </nav>

                    {isAuthenticated && (
                        <>
                            <div style={{ padding: 8 }}>
                                <div>Quick actions</div>
                                <button onClick={() => onQuickAction('create_product')}>+ Product</button>
                                <button onClick={() => onQuickAction('create_order')}>+ PO</button>
                            </div>

                            <div style={{ padding: 8 }}>
                                <div>Account</div>
                                <Link href="/profile">Profile</Link>
                                <button onClick={onSignOut}>Sign out</button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}