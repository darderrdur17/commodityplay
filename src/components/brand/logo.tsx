import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  PROMINENT_WORDMARK_STANDALONE,
  PROMINENT_WORDMARK_WRAPPER,
} from "@/lib/layout-constants";
import { BRAND_NAME } from "@/lib/brand";

type LogoVariant =
  | "horizontal"
  | "header"
  | "footer"
  | "login"
  | "mark"
  | "white"
  | "wordmark-tagline"
  | "lockup-dark";

const MARK = { src: "/brand/logo-mark.png", width: 184, height: 184 } as const;
/** Primary blue pill lockup — header, auth, onboarding */
const PRIMARY_LOCKUP = { src: "/brand/header-logo.svg", width: 2000, height: 344 } as const;
/** Footer lockup — gradient pill (2_SVG.svg) */
const FOOTER_LOCKUP = { src: "/brand/footer-logo.svg", width: 2000, height: 344 } as const;

const SOURCES: Record<Exclude<LogoVariant, "lockup-dark">, { src: string; width: number; height: number }> = {
  horizontal: PRIMARY_LOCKUP,
  header: PRIMARY_LOCKUP,
  footer: FOOTER_LOCKUP,
  login: PRIMARY_LOCKUP,
  mark: MARK,
  white: PRIMARY_LOCKUP,
  "wordmark-tagline": PRIMARY_LOCKUP,
};

/** Primary nav wordmark — uses layout-constants for site-wide sizing */
const HEADER_WRAPPER_CLASS = PROMINENT_WORDMARK_WRAPPER;

/** Wide pill badge — ~5.8:1 aspect ratio */
const LOCKUP_LOGO_CLASS =
  "h-9 w-auto sm:h-10 md:h-11 max-w-[min(100%,220px)] sm:max-w-[320px] md:max-w-[380px] object-contain object-left";

const VARIANT_IMAGE_CLASS: Record<Exclude<LogoVariant, "lockup-dark">, string> = {
  header: LOCKUP_LOGO_CLASS,
  footer: cn(LOCKUP_LOGO_CLASS, "sm:max-w-[360px] md:max-w-[420px]"),
  login: LOCKUP_LOGO_CLASS,
  horizontal: LOCKUP_LOGO_CLASS,
  mark: "h-9 w-9 sm:h-10 sm:w-10 object-contain",
  white: LOCKUP_LOGO_CLASS,
  "wordmark-tagline": cn(LOCKUP_LOGO_CLASS, "md:max-w-[420px]"),
};

interface LogoProps {
  variant?: LogoVariant;
  href?: string | false;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  /** Show tagline under the lockup (dark backgrounds only) */
  showTagline?: boolean;
}

/** Icon + wordmark — login / dark panels when PNG lockup is not used */
function LogoLockupDark({
  className,
  showTagline = false,
  priority = false,
}: {
  className?: string;
  showTagline?: boolean;
  priority?: boolean;
}) {
  return (
    <span className={cn("inline-flex flex-col gap-2.5", className)}>
      <Image
        src={PRIMARY_LOCKUP.src}
        alt={BRAND_NAME}
        width={PRIMARY_LOCKUP.width}
        height={PRIMARY_LOCKUP.height}
        priority={priority}
        unoptimized
        className={LOCKUP_LOGO_CLASS}
      />
      {showTagline && (
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">
          Break in. Move up. Stay sharp.
        </span>
      )}
    </span>
  );
}

export function Logo({
  variant = "horizontal",
  href = "/",
  className,
  imageClassName,
  priority = false,
  showTagline = false,
}: LogoProps) {
  if (variant === "lockup-dark") {
    const lockup = (
      <LogoLockupDark className={className} showTagline={showTagline} priority={priority} />
    );
    if (!href) return lockup;
    return (
      <Link href={href} className="inline-flex shrink-0">
        {lockup}
      </Link>
    );
  }

  const { src, width, height } = SOURCES[variant];
  const image = (
    <Image
      src={src}
      alt={BRAND_NAME}
      width={width}
      height={height}
      priority={priority}
      sizes={
        variant === "footer" || variant === "wordmark-tagline"
          ? "(max-width: 640px) 280px, 360px"
          : variant === "header"
            ? "(max-width: 640px) 240px, 360px"
            : "(max-width: 768px) 320px, 520px"
      }
      unoptimized={src.endsWith(".svg")}
      className={cn(VARIANT_IMAGE_CLASS[variant], imageClassName)}
    />
  );
  const img =
    variant === "header" || variant === "white" ? (
      <span className={variant === "header" ? HEADER_WRAPPER_CLASS : PROMINENT_WORDMARK_STANDALONE}>{image}</span>
    ) : (
      image
    );

  if (!href) {
    return <span className={cn("inline-flex items-center", className)}>{img}</span>;
  }

  return (
    <Link href={href} className={cn("inline-flex items-center shrink-0", className)} suppressHydrationWarning>
      {img}
    </Link>
  );
}

export function BrandSearchPrefix({
  className,
  size = 22,
  dark = false,
}: {
  className?: string;
  size?: number;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center flex-shrink-0",
        dark ? "pl-3 pr-2" : "pl-3 pr-2 border-r border-border",
        className
      )}
    >
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
        aria-hidden
      />
    </div>
  );
}

interface BrandedSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "light" | "dark";
  wrapperClassName?: string;
}

export function BrandedSearchInput({
  variant = "light",
  wrapperClassName,
  className,
  ...props
}: BrandedSearchInputProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-lg border",
        isDark ? "border-white/25 bg-white/10 max-w-lg" : "border-border bg-white",
        wrapperClassName
      )}
    >
      <BrandSearchPrefix dark={isDark} />
      <input
        {...props}
        className={cn(
          "flex-1 min-w-0 bg-transparent text-sm focus:outline-none focus:ring-0",
          isDark
            ? "py-3 pr-4 text-white placeholder:text-white/40"
            : "h-10 py-2 pr-4 text-gray-900 placeholder:text-muted-fg",
          className
        )}
      />
    </div>
  );
}
