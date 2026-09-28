import type { Metadata } from "next";
import { JobHirerRespondClient } from "./hirer-respond-client";

/**
 * This is a private, token-addressed surface: `[token]` is the secret
 * `JobChatThread.hirerToken` we email to the hirer.
 *
 * Without this directive the page inherits `robots: { index: true, follow: true }`
 * from src/app/layout.tsx, and because the page renders the same generic shell for
 * ANY token value (including ones that do not exist), Googlebot can index an
 * unbounded number of /job-chat/respond/<anything> URLs — all sharing the title
 * "Reply to Candidate" — and a real hirer token can leak into the public index.
 *
 * Do not remove this. The page must never be indexable.
 */
export const metadata: Metadata = {
  title: "Reply to Candidate",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function JobHirerRespondPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <JobHirerRespondClient token={token} />;
}
