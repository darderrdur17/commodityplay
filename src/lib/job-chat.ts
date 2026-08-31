export const MAX_JOB_CHAT_EXCHANGES = 3;

export type JobChatRole = "candidate" | "hirer";

export interface JobChatMessage {
  role: JobChatRole;
  text: string;
  createdAt: string;
}

export function parseJobChatMessages(raw: unknown): JobChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is JobChatMessage =>
      Boolean(item) &&
      typeof item === "object" &&
      (item as JobChatMessage).role !== undefined &&
      typeof (item as JobChatMessage).text === "string" &&
      typeof (item as JobChatMessage).createdAt === "string"
  );
}

export function countCandidateMessages(messages: JobChatMessage[]): number {
  return messages.filter((m) => m.role === "candidate").length;
}

export function lastMessage(messages: JobChatMessage[]): JobChatMessage | null {
  return messages.length ? messages[messages.length - 1]! : null;
}

export function isAwaitingHirerReply(messages: JobChatMessage[]): boolean {
  const last = lastMessage(messages);
  return last?.role === "candidate";
}

export function canCandidateSend(messages: JobChatMessage[], exchangeCount: number): boolean {
  if (exchangeCount >= MAX_JOB_CHAT_EXCHANGES) return false;
  if (countCandidateMessages(messages) >= MAX_JOB_CHAT_EXCHANGES) return false;
  if (messages.length === 0) return true;
  return !isAwaitingHirerReply(messages);
}

export function canHirerReply(messages: JobChatMessage[], exchangeCount: number): boolean {
  if (exchangeCount >= MAX_JOB_CHAT_EXCHANGES) return false;
  return isAwaitingHirerReply(messages);
}

export function isConversationComplete(messages: JobChatMessage[], exchangeCount: number): boolean {
  return exchangeCount >= MAX_JOB_CHAT_EXCHANGES;
}

export function canOfferInterview(
  messages: JobChatMessage[],
  exchangeCount: number,
  interviewOffered: boolean
): boolean {
  if (interviewOffered) return false;
  return isConversationComplete(messages, exchangeCount);
}

export function jobChatRespondUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return `${base}/job-chat/respond/${token}`;
}
