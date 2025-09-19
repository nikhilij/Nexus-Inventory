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
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const searchRef = useRef(null);
    const mobilePanelRef = useRef(null);

    // Focus search on key press
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === '/' && document.activeElement !== searchRef.current) {
                e.preventDefault();
                searchRef.current?.focus();
            }
        }

        if (isAuthenticated) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isAuthenticated]);

    // Close mobile panel on Escape
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                setMobileOpen(false);
                setUserMenuOpen(false);
                setNotificationsOpen(false);
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const submitSearch = (e) => {
        e.preventDefault();
        const query = e.target.search.value;
        if (query.trim()) {
            onSearch(query);
        }
    };

    const handleQuickAction = (action) => {
        onQuickAction(action);
        setMobileOpen(false);
    };

    const filteredNavItems = isAuthenticated 
        ? navItems 
        : navItems.filter(item => !item.protected);

    return (
        <header role="banner" className="relative z-50 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200/80 backdrop-blur-xl shadow-sm">
            {/* Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/20 to-teal-50/30 animate-gradient-x"></div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side */}
                    <div className="flex items-center gap-4">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-all duration-200"
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? (
                                <HiX className="w-5 h-5" />
                            ) : (
                                <HiMenu className="w-5 h-5" />
                            )}
                        </button>

                        <Link href="/" aria-label="Home" className="flex items-center group">
                            <div className="relative flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 via-purple-600 to-teal-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                        <HiSparkles className="w-4 h-4 text-white animate-pulse" />
                                    </div>
                                    <div className="absolute inset-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600 opacity-20 blur-md group-hover:opacity-40 transition-opacity duration-300"></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:via-purple-600 group-hover:to-teal-600 transition-all duration-300">
                                        Nexus
                                    </span>
                                    <span className="text-xs text-slate-500 -mt-1">Inventory</span>
                                </div>
                            </div>
                        </Link>

                        {company && (
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
                    <nav role="navigation" aria-label="Main navigation" className="hidden lg:block">
                        <ul className="flex items-center gap-1">
                            {filteredNavItems.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <li key={item.key}>
                                        <Link
                                            href={item.href}
                                            className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                                            onClick={() => onNavSelect(item.key)}
                                        >
                                            <IconComponent className="w-4 h-4 group-hover:text-blue-600 transition-colors duration-200" />
                                            <span>{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Search (authenticated users only) */}
                    {isAuthenticated && (
                        <form role="search" onSubmit={submitSearch} className="hidden md:flex items-center gap-2 bg-gradient-to-r from-slate-50 to-white border border-slate-200/80 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md min-w-[300px]">
                            <HiMagnifyingGlass className="w-4 h-4 text-slate-400" />
                            <input
                                ref={searchRef}
                                type="search"
                                name="search"
                                placeholder="Search products, orders, customers..."
                                className="flex-1 bg-transparent border-0 outline-none text-sm text-slate-900 placeholder-slate-500"
                                autoComplete="off"
                            />
                            <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 rounded-md px-2 py-1">
                                <HiCommandLine className="w-3 h-3" />
                                <span>/</span>
                            </div>
                        </form>
                    )}

                    {/* Right side */}
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {/* Quick Actions */}
                                <div className="hidden md:flex items-center gap-2">
                                    <button
                                        onClick={() => handleQuickAction('add-product')}
                                        className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                                    >
                                        <HiCube className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
                                        <span>Product</span>
                                    </button>
                                    <button
                                        onClick={() => handleQuickAction('create-order')}
                                        className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200/50 text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 hover:border-blue-200 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                                    >
                                        <HiClipboardList className="w-4 h-4 group-hover:text-blue-600 transition-colors duration-200" />
                                        <span>Order</span>
                                    </button>
                                </div>

                                {/* Notifications */}
                                <div className="relative">
                                    <button
                                        onClick={() => setNotificationsOpen(!notificationsOpen)}
                                        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 transition-all duration-200"
                                        aria-label={`Notifications ${unreadNotifications > 0 ? `(${unreadNotifications} unread)` : ''}`}
                                    >
                                        <HiBell className="w-5 h-5" />
                                        {unreadNotifications > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-lg animate-pulse">
                                                {unreadNotifications > 9 ? '9+' : unreadNotifications}
                                            </span>
                                        )}
                                    </button>

                                    {notificationsOpen && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl py-4 z-50">
                                            <div className="px-4 pb-3 border-b border-slate-100">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
                                                    {unreadNotifications > 0 && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                            {unreadNotifications} new
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-4 py-3 text-sm text-slate-600">
                                                {unreadNotifications > 0 ? `${unreadNotifications} new notifications` : 'No new notifications'}
                                            </div>
                                            <Link href="/notifications" className="block px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                                                View all notifications
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* User Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100/50 transition-all duration-200"
                                        aria-label="User menu"
                                    >
                                        {user?.avatarUrl ? (
                                            <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-lg object-cover ring-2 ring-slate-200" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600">
                                                {user ? user.name?.[0] : <HiUser className="w-4 h-4" />}
                                            </div>
                                        )}
                                        <HiChevronDown className="w-4 h-4 text-slate-500" />
                                    </button>

                                    {userMenuOpen && (
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
                                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/50 transition-all duration-200"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    Sign up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile nav panel */}
            {mobileOpen && (
                <div id="mobile-nav" ref={mobilePanelRef} className="lg:hidden absolute inset-x-0 top-full bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-xl" role="dialog" aria-label="Mobile menu">
                    <nav className="px-4 py-6">
                        <ul className="space-y-2">
                            {filteredNavItems.map((item) => {
                                const IconComponent = item.icon;
                                return (
                                    <li key={item.key}>
                                        <Link
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            className="group flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-slate-900 transition-all duration-200"
                                        >
                                            <IconComponent className="w-5 h-5 group-hover:text-blue-600 transition-colors duration-200" />
                                            <span className="font-medium">{item.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
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
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleQuickAction('add-product')}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium"
                                    >
                                        <HiCube className="w-4 h-4" />
                                        Product
                                    </button>
                                    <button
                                        onClick={() => handleQuickAction('create-order')}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 text-slate-700 text-sm font-medium"
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
            )}
        </header>
    );
}