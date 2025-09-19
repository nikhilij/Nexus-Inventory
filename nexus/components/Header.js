"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { 
  HiMenu, 
  HiX, 
  HiSearch, 
  HiBell, 
  HiUser, 
  HiChevronDown,
  HiLogout,
  HiCog,
  HiHome,
  HiCube,
  HiClipboardList,
  HiTruck,
  HiChartBar,
  HiSparkles
} from "react-icons/hi";
import { HiMagnifyingGlass, HiCommandLine } from "react-icons/hi2";

export default function Header({
    user = null,
    company = null,
    // Default nav includes public items first, app pages are marked `protected`
    navItems = [
        { key: 'about', label: 'About', href: '/about', icon: HiSparkles },
        { key: 'platform', label: 'Platform', href: '/platform', icon: HiCube },
        { key: 'services', label: 'Services', href: '/services', icon: HiTruck },
        { key: 'contact', label: 'Contact', href: '/contact', icon: HiUser },
        { key: 'dashboard', label: 'Dashboard', href: '/', protected: true, icon: HiHome },
        { key: 'products', label: 'Products', href: '/products', protected: true, icon: HiCube },
        { key: 'inventory', label: 'Inventory', href: '/inventory', protected: true, icon: HiClipboardList },
        { key: 'orders', label: 'Orders', href: '/orders', protected: true, icon: HiTruck },
        { key: 'suppliers', label: 'Suppliers', href: '/suppliers', protected: true, icon: HiUser },
        { key: 'reports', label: 'Reports', href: '/reports', protected: true, icon: HiChartBar },
        { key: 'settings', label: 'Settings', href: '/settings', protected: true, icon: HiCog },
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
        <header role="banner" className="relative z-50 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200/80 backdrop-blur-xl shadow-sm">
            {/* Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/20 to-teal-50/30 animate-gradient-x"></div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    <button
                        aria-label="Open menu"
                        aria-expanded={mobileOpen}
                        aria-controls="mobile-nav"
                        onClick={() => { setMobileOpen(v => !v); onOpenSidebar(); }}
                        ref={hamburgerRef}
                        className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-slate-700 hover:text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:hidden shadow-sm"
                    >
                        {mobileOpen ? (
                            <HiX className="w-5 h-5" />
                        ) : (
                            <HiMenu className="w-5 h-5" />
                        )}
                    </button>

                    <Link href="/" aria-label="Home" className="flex items-center group">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
                                    <HiSparkles className="w-4 h-4 text-white animate-pulse" />
                                </div>
                                <div className="absolute inset-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600 opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent">
                                    Nexus
                                </span>
                                <span className="text-xs text-slate-500 -mt-1">Inventory</span>
                            </div>
                        </div>
                    </Link>

                    {company?.name && (
                        <div className="ml-2 px-3 py-1 rounded-full bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200/50 text-sm font-medium text-slate-700 shadow-sm" aria-live="polite">
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-300 animate-pulse"></div>
                                    <span className="text-slate-500">Loading...</span>
                                </div>
                            ) : (
                                company.name
                            )}
                        </div>
                    )}
                </div>

                {/* Center Navigation */}
                <div className="flex-1 flex items-center justify-center gap-8">
                    <nav role="navigation" aria-label="Primary" className="hidden lg:block">
                        <ul className="flex items-center gap-1 list-none m-0 p-0">
                            {navItems.filter(i => !(i.protected && !isAuthenticated)).map(item => (
                                <li key={item.key}>
                                    <Link
                                        href={item.href || '#'}
                                        onClick={() => onNavSelect(item.key)}
                                        className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 transform hover:scale-105"
                                    >
                                        {item.icon && (
                                            <item.icon className="w-4 h-4 group-hover:text-blue-600 transition-colors duration-200" />
                                        )}
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {isAuthenticated && (
                        <form role="search" onSubmit={submitSearch} className="hidden md:flex items-center gap-2 bg-gradient-to-r from-slate-50 to-white border border-slate-200/80 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md min-w-[300px]">
                            <HiMagnifyingGlass className="w-4 h-4 text-slate-400" />
                            <input
                                id="header-search"
                                ref={searchRef}
                                type="search"
                                placeholder="Search products, orders, suppliers..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                aria-label="Search"
                                className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
                            />
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                <HiCommandLine className="w-3 h-3" />
                                <span>/</span>
                            </div>
                        </form>
                    )}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <div className="hidden sm:flex items-center gap-2">
                                <button
                                    onClick={() => onQuickAction('create_product')}
                                    aria-label="Create product"
                                    className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <HiCube className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                                    <span>Product</span>
                                </button>
                                <button
                                    onClick={() => onQuickAction('create_order')}
                                    aria-label="Create purchase order"
                                    className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 text-slate-700 text-sm font-medium hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transform hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    <HiClipboardList className="w-4 h-4 group-hover:text-blue-600 transition-colors duration-200" />
                                    <span>Order</span>
                                </button>
                            </div>

                            <div className="relative">
                                <button
                                    aria-label={`Notifications (${unreadNotifications})`}
                                    aria-haspopup="true"
                                    aria-expanded={notifOpen}
                                    onClick={() => setNotifOpen(v => !v)}
                                    className="relative p-3 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/50 hover:from-slate-100 hover:to-slate-50 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    <HiBell className="w-5 h-5 text-slate-600" />
                                    {unreadNotifications > 0 && (
                                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse shadow-lg" aria-live="polite">
                                            {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                        </span>
                                    )}
                                </button>
                                {notifOpen && (
                                    <div role="dialog" aria-label="Notifications" className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl py-4 z-50">
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                                        </div>
                                        <div className="px-4 py-3">
                                            <div className="text-sm text-slate-600 mb-2">
                                                {unreadNotifications > 0 ? `${unreadNotifications} unread notifications` : 'No new notifications'}
                                            </div>
                                            <Link href="/notifications" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                                View all notifications →
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <button
                                    aria-haspopup="true"
                                    aria-expanded={userOpen}
                                    onClick={() => setUserOpen(v => !v)}
                                    aria-label="Open user menu"
                                    className="flex items-center gap-2 p-2 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/50 hover:from-slate-100 hover:to-slate-50 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-200" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                                            {user ? user.name?.[0] : <HiUser className="w-4 h-4" />}
                                        </div>
                                    )}
                                    <HiChevronDown className="w-4 h-4 text-slate-500" />
                                </button>

                                {userOpen && (
                                    <ul role="menu" className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50">
                                        <li role="menuitem">
                                            <Link href="/account" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-slate-900 transition-all duration-200">
                                                <HiUser className="w-4 h-4" />
                                                <span>Account Settings</span>
                                            </Link>
                                        </li>
                                        <li role="menuitem">
                                            <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-slate-900 transition-all duration-200">
                                                <HiCog className="w-4 h-4" />
                                                <span>Preferences</span>
                                            </Link>
                                        </li>
                                        <hr className="my-2 border-slate-100" />
                                        <li role="menuitem">
                                            <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200">
                                                <HiLogout className="w-4 h-4" />
                                                <span>Sign Out</span>
                                            </button>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/login"
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            {/* Mobile nav panel */}
            {mobileOpen && (
                <div id="mobile-nav" ref={mobilePanelRef} className="lg:hidden absolute inset-x-0 top-full bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-xl" role="dialog" aria-label="Mobile menu">
                    <nav role="navigation" aria-label="Mobile Primary">
                        <ul className="list-none p-6 space-y-3">
                            {navItems.filter(i => !(i.protected && !isAuthenticated)).map(item => (
                                <li key={item.key}>
                                    <Link
                                        href={item.href || '#'}
                                        onClick={() => { onNavSelect(item.key); setMobileOpen(false); }}
                                        className="group flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-slate-900 transition-all duration-200"
                                    >
                                        {item.icon && (
                                            <item.icon className="w-5 h-5 group-hover:text-blue-600 transition-colors duration-200" />
                                        )}
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                            {!isAuthenticated && (
                                <>
                                    <li>
                                        <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-slate-900 transition-all duration-200 font-medium">
                                            Sign in
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/signup" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg">
                                            Sign up
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </nav>

                    {isAuthenticated && (
                        <>
                            <div className="px-6 py-4 border-t border-slate-100 space-y-3">
                                <div className="text-sm font-semibold text-slate-900">Quick actions</div>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => onQuickAction('create_product')} 
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg"
                                    >
                                        <HiCube className="w-4 h-4" />
                                        Product
                                    </button>
                                    <button 
                                        onClick={() => onQuickAction('create_order')} 
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-all duration-200"
                                    >
                                        <HiClipboardList className="w-4 h-4" />
                                        Order
                                    </button>
                                </div>
                            </div>

                            <div className="px-6 py-4 border-t border-slate-100 space-y-3">
                                <div className="text-sm font-semibold text-slate-900">Account</div>
                                <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 text-sm text-slate-700 hover:text-slate-900 transition-colors duration-200">
                                    <HiUser className="w-4 h-4" />
                                    Profile & Settings
                                </Link>
                                <button onClick={onSignOut} className="flex items-center gap-3 text-sm text-red-600 hover:text-red-700 transition-colors duration-200">
                                    <HiLogout className="w-4 h-4" />
                                    Sign out
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}