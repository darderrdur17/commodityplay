import { connection } from "next/server";
import { getSiteFooterContent } from "@/lib/content/accessors";
import { Footer } from "./footer";

export async function FooterWrapper() {
  await connection();
  const content = await getSiteFooterContent();
  return <Footer content={content} />;
}
