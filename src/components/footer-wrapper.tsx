import { connection } from "next/server";
import { getSiteFooterContent } from "@/lib/content/accessors";
import { Footer } from "./footer";

export async function FooterWrapper() {
  await connection();
  const content = await getSiteFooterContent();
  const { operatorNotifyEmails: _operatorNotifyEmails, ...publicContent } = content;
  return <Footer content={{ ...publicContent, operatorNotifyEmails: [] }} />;
}
