"use client";

import { useState } from "react";
import { Check, Tag, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SALES_ACCENT,
  SALES_FEATURE_LINE,
  SALES_HERO_GREEN,
  SALES_INK,
  SALES_LIGHT_MINT,
  SALES_MUTE,
} from "@/lib/sales-brand-colors";
import {
  ACCOUNT_INTELLIGENCE_MOCK,
  MARKET_NUDGES_MOCK,
  PREP_LIBRARY_MOCK,
} from "@/data/sales-feature-mocks";

/**
 * Mock panels for the three sales-track feature sections.
 *
 * These are *pictures of the product* — sample nudges, sample topics, example
 * accounts — so their copy lives in `sales-feature-mocks.ts`, not the landing CMS.
 * The editable words for these sections are the eyebrow / headline / lede / point
 * rows in `landingContent.salesFeatures`.
 *
 * The only real interaction is the "Link to account" select, which mirrors the
 * product's confirmation line. Nothing leaves the page.
 */

const cardBase =
  "rounded-[14px] border bg-white p-5 sm:p-[22px] shadow-[0_18px_44px_-26px_rgba(6,95,70,0.35)]";
const cardStyle = { borderColor: SALES_FEATURE_LINE } as const;

function EyebrowLine({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] mb-2.5"
      style={{ color: SALES_MUTE }}
    >
      {children}
    </p>
  );
}

/** Select + the product's confirmation line. Preview only — nothing is sent. */
function LinkToAccount({ label, options }: { label: string; options: string[] }) {
  const [value, setValue] = useState("");
  const selectId = `link-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <>
      <p
        className="text-[10px] font-bold uppercase tracking-[0.12em] mt-3 mb-1.5"
        style={{ color: SALES_MUTE }}
      >
        {label}
      </p>
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="w-full rounded-lg border bg-white px-3 py-2.5 pr-8 text-[13px] appearance-none"
        style={{
          borderColor: SALES_FEATURE_LINE,
          color: SALES_INK,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23354' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
        }}
      >
        <option value="">Select an account</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <p
        aria-live="polite"
        className={cn("text-[12px] font-semibold mt-2 items-center gap-1.5", value ? "flex" : "hidden")}
        style={{ color: SALES_HERO_GREEN }}
      >
        <Check className="w-3.5 h-3.5" aria-hidden />
        {value ? `Linked to ${value} (preview only)` : ""}
      </p>
    </>
  );
}

export function MarketNudgesMock() {
  const mock = MARKET_NUDGES_MOCK;

  return (
    <div className={cardBase} style={cardStyle} aria-label="Sales Market Nudges preview">
      <EyebrowLine>
        <Zap className="w-3.5 h-3.5" aria-hidden />
        {mock.heading}
      </EyebrowLine>

      <div className="flex gap-2 mb-4 flex-wrap">
        {mock.tabs.map((tab) => (
          <span
            key={tab.label}
            className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
            style={
              tab.active
                ? { backgroundColor: SALES_LIGHT_MINT, color: SALES_HERO_GREEN }
                : { backgroundColor: "#eef2f1", color: "#5a6b66" }
            }
          >
            {tab.label}
          </span>
        ))}
      </div>

      {mock.nudges.map((nudge, index) => (
        <div
          key={`${nudge.date}-${index}`}
          className="rounded-[10px] border p-4 mb-3 last:mb-0"
          style={{ borderColor: SALES_FEATURE_LINE }}
        >
          <p className="text-[13.5px] font-bold mb-2.5" style={{ color: SALES_INK }}>
            {nudge.date}
          </p>
          {nudge.rows.map((row) => (
            <div key={row.label} className="flex gap-2.5 text-[13px] leading-[1.55] mb-1.5">
              <b
                className="text-[12px] font-bold min-w-[46px] pt-px shrink-0"
                style={{ color: row.accent ? SALES_HERO_GREEN : SALES_ACCENT }}
              >
                {row.label}
              </b>
              <span style={{ color: row.accent ? SALES_HERO_GREEN : SALES_INK }}>{row.text}</span>
            </div>
          ))}
          <LinkToAccount label={mock.linkLabel} options={mock.accountOptions} />
        </div>
      ))}
    </div>
  );
}

export function PrepLibraryMock() {
  const mock = PREP_LIBRARY_MOCK;

  return (
    <div className={cardBase} style={cardStyle} aria-label="Prep Library preview">
      <div
        className="inline-block rounded-[10px] border px-[18px] py-2.5 mb-3.5"
        style={{ borderColor: SALES_FEATURE_LINE }}
      >
        <strong className="block text-[24px] font-extrabold leading-[1.1]" style={{ color: SALES_HERO_GREEN }}>
          {mock.statValue}
        </strong>
        <span className="text-[12px]" style={{ color: SALES_MUTE }}>
          {mock.statLabel}
        </span>
      </div>

      <p
        className="text-[10.5px] font-bold uppercase tracking-[0.14em] mt-4 mb-2"
        style={{ color: SALES_MUTE }}
      >
        {mock.month}
      </p>

      {mock.topics.map((topic, index) => (
        <div
          key={topic.title}
          className="rounded-[10px] border p-4 mb-3 last:mb-0"
          style={{ borderColor: SALES_FEATURE_LINE }}
        >
          <div className="flex items-center gap-2 flex-wrap mb-2.5">
            <h3 className="text-[14.5px] font-bold leading-[1.35] flex-[1_1_220px]" style={{ color: SALES_INK }}>
              {topic.title}
            </h3>
            <span className="text-[10px] font-bold tracking-[0.06em] px-2 py-1 rounded-[5px] bg-amber-100 text-amber-800">
              Example
            </span>
            <span
              className="text-[10px] font-bold tracking-[0.06em] px-2 py-1 rounded-[5px]"
              style={{ backgroundColor: SALES_LIGHT_MINT, color: SALES_HERO_GREEN }}
            >
              {topic.category}
            </span>
          </div>
          <ul className="mb-2.5">
            {topic.bullets.map((bullet) => (
              <li
                key={bullet}
                className="relative pl-4 text-[13px] leading-[1.55] mb-1.5"
                style={{ color: SALES_INK }}
              >
                <span className="absolute left-0" style={{ color: SALES_ACCENT }} aria-hidden>
                  —
                </span>
                {bullet}
              </li>
            ))}
          </ul>
          {topic.unusedNote && (
            <p className="text-[12px] italic mb-2.5" style={{ color: SALES_MUTE }}>
              {topic.unusedNote}
            </p>
          )}
          {index === 0 && <LinkToAccount label={mock.linkLabel} options={mock.accountOptions} />}
        </div>
      ))}
    </div>
  );
}

export function AccountIntelligenceMock() {
  const mock = ACCOUNT_INTELLIGENCE_MOCK;

  return (
    <div className={cardBase} style={cardStyle} aria-label="Account Intelligence preview">
      <div className="flex items-center justify-between gap-2.5 mb-3.5 flex-wrap">
        <h3 className="text-[15px] font-bold" style={{ color: SALES_INK }}>
          {mock.heading}
        </h3>
        <span
          className="text-[12px] font-semibold rounded-md px-3.5 py-2 text-white"
          style={{ backgroundColor: SALES_HERO_GREEN }}
        >
          {mock.addLabel}
        </span>
      </div>

      {mock.accounts.map((account) => (
        <div
          key={account.name}
          className="rounded-[10px] border p-4 mb-3 last:mb-0"
          style={{ borderColor: SALES_FEATURE_LINE }}
        >
          <div
            className="flex justify-between gap-2.5 items-start pb-3 mb-3 border-b"
            style={{ borderColor: SALES_FEATURE_LINE }}
          >
            <div>
              <b className="block text-[15px] font-bold" style={{ color: SALES_INK }}>
                {account.name}
              </b>
              <small className="text-[12.5px]" style={{ color: SALES_MUTE }}>
                {account.desk}
              </small>
            </div>
            <span className="text-[11px] font-semibold rounded-full px-2.5 py-1 bg-green-100 text-green-800 whitespace-nowrap">
              {account.status}
            </span>
          </div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em] mb-2"
            style={{ color: SALES_MUTE }}
          >
            {account.fromLabel}
          </p>
          <div className="flex gap-2 flex-wrap">
            {account.pins.map((pin, index) => (
              <span
                key={pin}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                style={
                  index === 0
                    ? { backgroundColor: "#fef3e2", color: "#9a4a0b" }
                    : { backgroundColor: SALES_LIGHT_MINT, color: SALES_HERO_GREEN }
                }
              >
                <Tag className="w-3 h-3" aria-hidden />
                {pin}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

