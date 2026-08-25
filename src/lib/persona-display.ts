import { PERSONA_LABELS } from "@/lib/utils";

type Track = "CAREER" | "SALES" | string | null | undefined;

/** Persona label for account / dashboard — sales defaults to Vendor; career only after resume quiz. */
export function resolveMemberPersonaLabel(
  track: Track,
  persona: string | null | undefined,
  resumePersonaDone: boolean
): string | null {
  if (track === "SALES") {
    return PERSONA_LABELS.VENDOR.label;
  }
  if (resumePersonaDone && persona && PERSONA_LABELS[persona]) {
    return PERSONA_LABELS[persona].label;
  }
  return null;
}

export function resolveMemberPersonaInfo(
  track: Track,
  persona: string | null | undefined,
  resumePersonaDone: boolean
): { label: string; color: string; bg: string } | null {
  if (track === "SALES") {
    return PERSONA_LABELS.VENDOR;
  }
  if (resumePersonaDone && persona && PERSONA_LABELS[persona]) {
    return PERSONA_LABELS[persona];
  }
  return null;
}
