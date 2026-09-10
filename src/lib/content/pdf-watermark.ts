import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

/** Skip stamping huge files so the asset route stays within function time. */
export const MAX_WATERMARK_BYTES = 12 * 1024 * 1024;

export const PDF_COPYRIGHT_FOOTER = "Copyright reserved";

export interface WatermarkMember {
  name?: string | null;
  email?: string | null;
}

export function isPaidContentTier(tier: string | null | undefined): boolean {
  return tier === "PRO" || tier === "ELITE";
}

export function isPdfAsset(fileName: string, mimeType: string): boolean {
  const mime = mimeType.toLowerCase();
  const name = fileName.toLowerCase();
  return mime.includes("pdf") || name.endsWith(".pdf");
}

/**
 * Paid PDFs (Pro/Elite) get a member license stamp at serve time.
 * Copyright footer is applied separately to every PDF under the size cap.
 * CMS uploads stay original on disk.
 */
export function shouldWatermarkPaidPdf(input: {
  fileName: string;
  mimeType: string;
  requiredTier: string;
  isPublicUnpaid: boolean;
  byteLength: number;
  member: WatermarkMember;
}): boolean {
  if (input.isPublicUnpaid) return false;
  if (!isPaidContentTier(input.requiredTier)) return false;
  if (!isPdfAsset(input.fileName, input.mimeType)) return false;
  if (input.byteLength === 0 || input.byteLength > MAX_WATERMARK_BYTES) return false;
  const hasIdentity = Boolean(input.member.name?.trim() || input.member.email?.trim());
  return hasIdentity;
}

/** Any PDF under the size cap gets a copyright footer; paid files also get the license stamp. */
export function shouldStampPdfFooter(input: {
  fileName: string;
  mimeType: string;
  byteLength: number;
}): boolean {
  if (!isPdfAsset(input.fileName, input.mimeType)) return false;
  return input.byteLength > 0 && input.byteLength <= MAX_WATERMARK_BYTES;
}

export function formatMemberWatermarkLine(member: WatermarkMember, licensedAt = new Date()): string {
  const who = [member.name?.trim(), member.email?.trim()].filter(Boolean).join(" · ");
  const date = licensedAt.toISOString().slice(0, 10);
  return `Licensed to ${who || "CommodityPlay member"} · ${date} · CommodityPlay.`;
}

/** Helvetica / WinAnsi cannot draw arbitrary Unicode — fold to ASCII for a stable stamp. */
export function sanitizeWatermarkText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function stampPaidPdfWatermark(
  bytes: Uint8Array,
  member: WatermarkMember,
  licensedAt = new Date(),
  options: { includeLicense?: boolean } = {}
): Promise<Uint8Array> {
  const includeLicense = options.includeLicense ?? true;
  const licenseLine = includeLicense
    ? sanitizeWatermarkText(formatMemberWatermarkLine(member, licensedAt))
    : "";
  const copyrightLine = sanitizeWatermarkText(PDF_COPYRIGHT_FOOTER);
  if (!copyrightLine && !licenseLine) return bytes;

  try {
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const footerSize = 7;
      const footerColor = rgb(0.42, 0.45, 0.52);

      if (copyrightLine) {
        const copyrightWidth = font.widthOfTextAtSize(copyrightLine, footerSize);
        page.drawText(copyrightLine, {
          x: Math.max(18, (width - copyrightWidth) / 2),
          y: 10,
          size: footerSize,
          font,
          color: footerColor,
          opacity: 0.78,
        });
      }

      if (licenseLine) {
        const footerWidth = font.widthOfTextAtSize(licenseLine, footerSize);
        page.drawText(licenseLine, {
          x: Math.max(18, (width - footerWidth) / 2),
          y: copyrightLine ? 22 : 14,
          size: footerSize,
          font,
          color: footerColor,
          opacity: 0.72,
        });

        const diagonalSize = Math.min(16, Math.max(10, width / 42));
        page.drawText(licenseLine, {
          x: width * 0.12,
          y: height * 0.38,
          size: diagonalSize,
          font,
          color: rgb(0.55, 0.58, 0.62),
          opacity: 0.11,
          rotate: degrees(32),
        });
      }
    }

    return new Uint8Array(await pdf.save({ useObjectStreams: false }));
  } catch {
    return bytes;
  }
}
