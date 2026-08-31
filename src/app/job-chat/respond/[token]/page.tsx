import { JobHirerRespondClient } from "./hirer-respond-client";

export const metadata = { title: "Reply to Candidate" };

export default async function JobHirerRespondPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <JobHirerRespondClient token={token} />;
}
