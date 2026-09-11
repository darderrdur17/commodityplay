"use client";

import { usePathname } from "next/navigation";
import { NAV_OFFSET } from "@/lib/layout-constants";

const HIDE_CHROME_PREFIXES = ["/mentor-apply"];

function shouldHideSiteChrome(pathname: string) {
  return HIDE_CHROME_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** Wraps nav/main/footer so selected routes (mentor sign-up) can omit site chrome. */
export function SiteChrome({
  nav,
  footer,
  children,
}: {
  nav: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome = shouldHideSiteChrome(pathname);

  return (
    <>
      {hideChrome ? null : nav}
      <main className="flex-1" style={hideChrome ? undefined : { paddingTop: NAV_OFFSET }}>
        {children}
      </main>
      {hideChrome ? null : footer}
    </>
  );
}
