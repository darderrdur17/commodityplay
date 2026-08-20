import type { AccountStatus, BookmarkSource } from "@prisma/client";

export const FOREST_GREEN = "#1a3d36";

export interface TrackedAccountRecord {
  id: string;
  name: string;
  deskType: string;
  status: AccountStatus;
  notes: string | null;
  lastTouch: string | null;
  nextStep: string | null;
  createdAt: string;
  updatedAt: string;
  bookmarks: AccountBookmarkRecord[];
}

export interface AccountBookmarkRecord {
  id: string;
  accountId: string;
  sourceType: BookmarkSource;
  sourceId: string;
  sourceTitle: string;
  createdAt: string;
}

export const ACCOUNT_STATUS_OPTIONS: {
  value: AccountStatus;
  label: string;
  badgeClass: string;
}[] = [
  {
    value: "ACTIVE_DISCUSSION",
    label: "Active discussion",
    badgeClass: "bg-green-100 text-green-800",
  },
  {
    value: "FIRST_CONTACT",
    label: "First contact",
    badgeClass: "bg-teal-100 text-teal-800",
  },
  {
    value: "STALLED",
    label: "Stalled",
    badgeClass: "bg-red-100 text-red-700",
  },
  {
    value: "RESEARCHING",
    label: "Researching",
    badgeClass: "bg-gray-100 text-gray-600",
  },
];

export function getAccountStatusMeta(status: AccountStatus) {
  return (
    ACCOUNT_STATUS_OPTIONS.find((option) => option.value === status) ??
    ACCOUNT_STATUS_OPTIONS[3]
  );
}

export function serializeTrackedAccount(
  account: {
    id: string;
    name: string;
    deskType: string;
    status: AccountStatus;
    notes: string | null;
    lastTouch: string | null;
    nextStep: string | null;
    createdAt: Date;
    updatedAt: Date;
    bookmarks?: {
      id: string;
      accountId: string;
      sourceType: BookmarkSource;
      sourceId: string;
      sourceTitle: string;
      createdAt: Date;
    }[];
  }
): TrackedAccountRecord {
  return {
    id: account.id,
    name: account.name,
    deskType: account.deskType,
    status: account.status,
    notes: account.notes,
    lastTouch: account.lastTouch,
    nextStep: account.nextStep,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
    bookmarks: (account.bookmarks ?? []).map((bookmark) => ({
      id: bookmark.id,
      accountId: bookmark.accountId,
      sourceType: bookmark.sourceType,
      sourceId: bookmark.sourceId,
      sourceTitle: bookmark.sourceTitle,
      createdAt: bookmark.createdAt.toISOString(),
    })),
  };
}
