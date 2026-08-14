import { PricingRedirect } from "./pricing-redirect";

export const metadata = {
  title: "Pricing",
  robots: { index: false, follow: true },
};

export default function PricingPage() {
  return <PricingRedirect />;
}
