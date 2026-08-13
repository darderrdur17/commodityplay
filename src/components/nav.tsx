"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, isAdmin } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "@/components/brand/logo";

import { NAV_HEIGHT, NAV_OFFSET, NAV_HEIGHT_PX } from "@/lib/layout-constants";

const SIMPLE_LINKS = [
  { label: "Playbook", href: "/playbook" },
  { label: "Glossary", href: "/glossary" },
];

const TRACK_OPTIONS = [
  {
    track: "career" as const,
    label: "Track 1",
    title: "Career Professionals",
    href: "/?track=career",
    icon: Briefcase,
    iconClass: "bg-[#eff6ff] text-[#3280ff]",
    trackClass: "text-[#3280ff]",
    hoverClass: "hover:bg-[#f7faff] group-hover:[&_.track-name]:text-[#3280ff]",
  },
  {
    track: "sales" as const,
    label: "Track 2",
    title: "Sales Professionals",
    href: "/?track=sales",
    icon: Users,
    iconClass: "bg-[#f0fdfb] text-[#0f766e]",
    trackClass: "text-[#0f766e]",
    hoverClass: "hover:bg-[#f0fdfb] group-hover:[&_.track-name]:text-[#0f766e]",
  },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [homeOpen, setHomeOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const homeRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as {
    name?: string | null;
    email?: string | null;
    tier?: string;
    role?: string;
  } | undefined;

  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setHomeOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (homeRef.current && !homeRef.current.contains(e.target as Node)) {
        setHomeOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  const tierVariant = user?.tier === "ELITE" ? "elite" : user?.tier === "PRO" ? "pro" : "starter";
  const tierLabel = isAdmin(user?.role)
    ? "Admin"
    : user?.tier === "ELITE"
      ? "Elite"
      : user?.tier === "PRO"
        ? "Pro"
        : "Starter";

  function closeMenus() {
    setHomeOpen(false);
    setUserMenuOpen(false);
    setMobileOpen(false);
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 overflow-visible",
          "pt-[env(safe-area-inset-top)] bg-white border-b border-[#e4e7ec]",
          scrolled ? "shadow-[0_1px_4px_rgba(0,0,0,0.06)]" : "shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
        )}
      >
        <div
          className="w-full max-w-none px-4 sm:px-8 lg:px-12 grid grid-cols-[1fr_auto_1fr] items-center min-h-0"
          style={{ height: NAV_HEIGHT }}
        >
          <div className="flex items-center min-w-0 min-h-0 h-full max-h-full justify-self-start overflow-hidden pr-1 sm:pr-2">
            <Logo variant="header" priority />
          </div>

          <nav className="hidden md:flex items-center justify-center gap-0.5">
            <div ref={homeRef} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen(false);
                  setHomeOpen((open) => !open);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-[14.5px] font-medium rounded-lg transition-colors",
                  isHome || homeOpen
                    ? "text-[#3280ff] bg-[#f0f6ff] font-semibold"
                    : "text-[#4a5568] hover:text-[#3280ff] hover:bg-[#f0f6ff]"
                )}
              >
                Home
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 text-[#a0aec0] transition-transform",
                    homeOpen && "rotate-180 text-[#3280ff]"
                  )}
                />
              </button>

              <AnimatePresence>
                {homeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 min-w-[260px] bg-white border border-[#e4e7ec] rounded-[14px] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.13),0_4px_12px_-4px_rgba(0,0,0,0.06)] p-2 z-[300]"
                  >
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 rotate-45 w-[11px] h-[11px] bg-white border-l border-t border-[#e4e7ec]" />
                    <p className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[#b0bec5] px-3.5 py-2">
                      Your track
                    </p>
                    {TRACK_OPTIONS.map((option, index) => (
                      <React.Fragment key={option.track}>
                        {index > 0 && <div className="h-px bg-[#f0f2f5] mx-2 my-1" />}
                        <Link
                          href={option.href}
                          onClick={closeMenus}
                          className={cn(
                            "group flex items-center gap-3.5 px-3.5 py-3 rounded-[10px] transition-colors",
                            option.hoverClass
                          )}
                        >
                          <span
                            className={cn(
                              "w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0",
                              option.iconClass
                            )}
                          >
                            <option.icon className="w-[19px] h-[19px]" strokeWidth={1.8} />
                          </span>
                          <span className="flex flex-col gap-0.5">
                            <span className={cn("text-[10px] font-bold tracking-[0.08em] uppercase", option.trackClass)}>
                              {option.label}
                            </span>
                            <span className="track-name text-[14.5px] font-semibold text-[#1a202c] leading-tight transition-colors">
                              {option.title}
                            </span>
                          </span>
                        </Link>
                      </React.Fragment>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {SIMPLE_LINKS.map((link) => {
              const active =
                pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-4 py-2.5 text-[14.5px] font-medium rounded-lg transition-colors whitespace-nowrap",
                    active
                      ? "text-[#3280ff] bg-[#f0f6ff] font-semibold"
                      : "text-[#4a5568] hover:text-[#3280ff] hover:bg-[#f0f6ff]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center justify-end">
            {session ? (
              <div ref={userRef} className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setHomeOpen(false);
                    setUserMenuOpen((open) => !open);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] hover:bg-[#f4f5f7] transition-colors"
                >
                  <div className="w-[34px] h-[34px] rounded-full bg-[#3280ff] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <Badge
                    variant={isAdmin(user?.role) ? "danger" : (tierVariant as "elite" | "pro" | "starter")}
                    size="sm"
                    className={cn(
                      !isAdmin(user?.role) &&
                        user?.tier === "ELITE" &&
                        "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
                    )}
                  >
                    {tierLabel}
                  </Badge>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-[#a0aec0] transition-transform shrink-0",
                      userMenuOpen && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-[calc(100%+10px)] min-w-[210px] bg-white border border-[#e4e7ec] rounded-xl shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12)] p-2 z-[300]"
                    >
                      <p className="px-3.5 pt-2.5 pb-1 text-[13px] font-semibold text-[#1a202c] truncate">
                        {user?.name || "Member"}
                      </p>
                      <p className="px-3.5 pb-2.5 text-[11.5px] text-[#718096] border-b border-[#f0f2f5] mb-1 truncate">
                        {user?.email}
                      </p>
                      <Link
                        href="/account"
                        onClick={closeMenus}
                        className="block px-3.5 py-2.5 text-[13.5px] font-medium text-[#4a5568] rounded-[7px] hover:bg-[#f0f6ff] hover:text-[#3280ff] transition-colors"
                      >
                        My Account
                      </Link>
                      <Link
                        href="/dashboard"
                        onClick={closeMenus}
                        className="block px-3.5 py-2.5 text-[13.5px] font-medium text-[#4a5568] rounded-[7px] hover:bg-[#f0f6ff] hover:text-[#3280ff] transition-colors"
                      >
                        My Progress
                      </Link>
                      <Link
                        href="/account"
                        onClick={closeMenus}
                        className="block px-3.5 py-2.5 text-[13.5px] font-medium text-[#4a5568] rounded-[7px] hover:bg-[#f0f6ff] hover:text-[#3280ff] transition-colors"
                      >
                        Settings
                      </Link>
                      {isAdmin(user?.role) && (
                        <Link
                          href="/admin"
                          onClick={closeMenus}
                          className="block px-3.5 py-2.5 text-[13.5px] font-medium text-red-600 rounded-[7px] hover:bg-red-50 transition-colors"
                        >
                          Admin Panel
                        </Link>
                      )}
                      <div className="h-px bg-[#f0f2f5] my-1 mx-1.5" />
                      <button
                        type="button"
                        onClick={() => {
                          closeMenus();
                          signOut({ callbackUrl: "/" });
                        }}
                        className="block w-full text-left px-3.5 py-2.5 text-[13.5px] font-medium text-[#e53e3e] rounded-[7px] hover:bg-[#fff5f5] hover:text-[#c53030] transition-colors"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-[#4a5568]">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">Join Free</Button>
                </Link>
              </div>
            )}
          </div>

          <button
            type="button"
            className="md:hidden justify-self-end p-2 rounded-lg hover:bg-[#f4f5f7] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed left-0 right-0 z-40 bg-white border-b border-[#e4e7ec] overflow-hidden overflow-y-auto"
            style={{
              top: NAV_OFFSET,
              maxHeight: `calc(100dvh - ${NAV_HEIGHT_PX}px - env(safe-area-inset-top, 0px))`,
            }}
          >
            <nav className="page-container py-4 flex flex-col gap-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#b0bec5] mb-1">
                Your track
              </p>
              {TRACK_OPTIONS.map((option) => (
                <Link
                  key={option.track}
                  href={option.href}
                  className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#f0f6ff] min-h-[44px] flex items-center gap-3"
                >
                  <span className={cn("text-[10px] font-bold uppercase tracking-wide", option.trackClass)}>
                    {option.label}
                  </span>
                  <span>{option.title}</span>
                </Link>
              ))}
              <div className="h-px bg-[#e4e7ec] my-2" />
              {SIMPLE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center",
                    pathname === link.href || pathname.startsWith(`${link.href}/`)
                      ? "bg-[#f0f6ff] text-[#3280ff]"
                      : "text-gray-700 hover:bg-[#f4f5f7]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-[#e4e7ec] my-2" />
              {session ? (
                <>
                  <Link
                    href="/account"
                    className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#f4f5f7] min-h-[44px] flex items-center"
                  >
                    My Account
                  </Link>
                  <Link
                    href="/dashboard"
                    className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#f4f5f7] min-h-[44px] flex items-center"
                  >
                    My Progress
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#e53e3e] hover:bg-[#fff5f5] text-left min-h-[44px]"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="w-full">Join Free</Button>
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
      )}
    </>
  );
}
