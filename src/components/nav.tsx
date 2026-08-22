"use client";

import { Suspense, useCallback, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, isAdmin } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "@/components/brand/logo";

import { NAV_HEIGHT, NAV_OFFSET, NAV_HEIGHT_PX } from "@/lib/layout-constants";

const NAV_LINKS = [
  { key: "career", label: "Career", href: "/?track=career" },
  { key: "sales", label: "Sales", href: "/?track=sales" },
  { key: "playbook", label: "Playbook", href: "/playbook" },
  { key: "mentor-connect", label: "Mentor Connect", href: "/mentor-connect" },
  { key: "glossary", label: "Glossary", href: "/glossary" },
] as const;

/** Reads the `?track=` query param — isolated in its own Suspense boundary since
 * useSearchParams() opts the calling component out of static rendering. */
function TrackParamWatcher({ onChange }: { onChange: (track: string | null) => void }) {
  const searchParams = useSearchParams();
  const track = searchParams.get("track");

  useEffect(() => {
    onChange(track);
  }, [track, onChange]);

  return null;
}

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeTrackParam, setActiveTrackParam] = useState<string | null>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as {
    name?: string | null;
    email?: string | null;
    tier?: string;
    role?: string;
    isMentor?: boolean;
  } | undefined;
  const myProgressHref = user?.isMentor ? "/mentor-connect/inbox" : "/dashboard";

  const handleTrackParamChange = useCallback((track: string | null) => {
    setActiveTrackParam(track);
  }, []);

  function isLinkActive(key: string, href: string) {
    if (key === "career") return pathname === "/" && activeTrackParam !== "sales";
    if (key === "sales") return pathname === "/" && activeTrackParam === "sales";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
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
    setUserMenuOpen(false);
    setMobileOpen(false);
  }

  return (
    <>
      <Suspense fallback={null}>
        <TrackParamWatcher onChange={handleTrackParamChange} />
      </Suspense>

      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 overflow-visible",
          "pt-[env(safe-area-inset-top)] bg-white border-b border-[#e4e7ec]",
          scrolled ? "shadow-[0_1px_4px_rgba(0,0,0,0.06)]" : "shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
        )}
      >
        <div
          className="w-full max-w-none px-4 sm:px-8 lg:px-12 grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[1fr_auto_1fr] items-center min-h-0 gap-2"
          style={{ height: NAV_HEIGHT }}
        >
          <div className="flex items-center min-w-0 min-h-0 h-full max-h-full justify-self-start overflow-hidden col-start-1 row-start-1">
            <Logo variant="header" priority />
          </div>

          <nav className="hidden md:flex items-center justify-center gap-0.5 md:col-start-2 md:row-start-1">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.key, link.href);
              return (
                <Link
                  key={link.key}
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

          <div className="flex items-center justify-end col-start-2 md:col-start-3 row-start-1 shrink-0">
            <div className="hidden md:flex items-center">
            {session ? (
              <div ref={userRef} className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
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
                        href={myProgressHref}
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
              className="md:hidden p-2 rounded-lg hover:bg-[#f4f5f7] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
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
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className={cn(
                    "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center",
                    isLinkActive(link.key, link.href)
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
                    href={myProgressHref}
                    className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-[#f4f5f7] min-h-[44px] flex items-center"
                  >
                    My Progress
                  </Link>
                  {isAdmin(user?.role) && (
                    <Link
                      href="/admin"
                      className="px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 min-h-[44px] flex items-center"
                    >
                      Admin Panel
                    </Link>
                  )}
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
