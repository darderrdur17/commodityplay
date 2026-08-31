/** Member consent at question submit (DB column: isPublic). */
export function parseMemberShareOptIn(body: {
  memberShareOptIn?: boolean;
  isPublic?: boolean;
}): boolean {
  if (typeof body.memberShareOptIn === "boolean") return body.memberShareOptIn;
  if (typeof body.isPublic === "boolean") return body.isPublic;
  return false;
}

/** Both parties opted in — eligible for future Desk Channel admin review. */
export function isDeskChannelShareCandidate(
  memberShareOptIn: boolean,
  mentorShareOptIn: boolean
): boolean {
  return memberShareOptIn && mentorShareOptIn;
}
