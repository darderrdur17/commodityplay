import { FaqClient } from "./faq-client";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: "FAQ",
  description: `Frequently asked questions about ${BRAND_NAME} plans, billing, and access.`,
};

export default function FaqPage() {
  return <FaqClient />;
}
