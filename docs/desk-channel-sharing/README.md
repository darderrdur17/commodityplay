# Desk Channel sharing — Mentor Connect Q&A

## Dual consent (implemented)

Member questions and mentor answers stay **private by default**. Anonymous Desk Channel sharing requires **both** parties to opt in:

| Step | Who | When | Field |
| --- | --- | --- | --- |
| 1 | **Member** | Submitting a Mentor Connect question | `memberShareOptIn` |
| 2 | **Mentor** | Submitting their answer | `mentorShareOptIn` |

If either party does not opt in, the Q&A remains private (member still receives the answer on Mentor Connect / email).

When **both** opt in, the Q&A is flagged as a **Desk Channel candidate** — but nothing is published automatically.

### Current behaviour

- Member checkbox on web (`/mentor-connect`) and mobile Mentor Connect form
- Mentor checkbox on practitioner inbox (`/mentor-connect/inbox`)
- UI copy explains admin review is required before Desk Channel publication
- Desk Channel page (`/desk-channel`) still uses **admin-curated CMS content** only

### Helper

`isDeskChannelShareCandidate(memberShareOptIn, mentorShareOptIn)` in `src/lib/mentor-share-consent.ts`

---

## Admin review queue (pending)

> **Status:** Planned — not implemented yet.

When both consents are true, surface the Q&A in Admin for Frances to review:

- [ ] Admin tab or filter: **Desk Channel candidates** (`memberShareOptIn AND mentorShareOptIn AND answered`)
- [ ] Show segment, anonymous member ID, question, answer, consent timestamps
- [ ] Actions: **Approve**, **Reject**, **Edit before publish**

Frances can still manually add Q&As to Desk Channel via Admin → Desk Channel CMS until this queue exists.

---

## Publish to Desk Channel (pending)

> **Status:** Planned — not implemented yet.

On admin **Approve**:

- [ ] Copy Q&A into Desk Channel library (CMS module or approved-questions table)
- [ ] Allow category/tag assignment and light redaction before go-live
- [ ] Mark source question as published (e.g. `deskChannelStatus: APPROVED`) to avoid duplicate review

---

## Related code

- Consent helper: `src/lib/mentor-share-consent.ts`
- Member submit API: `src/app/api/mentor-connect/route.ts`
- Mentor answer API: `src/app/api/mentor-connect/inbox/[id]/route.ts`
- Member UI: `src/components/mentor-connect/mentor-ask-panel.tsx`
- Mentor UI: `src/app/mentor-connect/inbox/mentor-inbox-client.tsx`
- Desk Channel CMS: `src/app/admin/editors/desk-channel-editor.tsx`
- Schema: `MentorQuestion.memberShareOptIn` (DB column `isPublic`), `MentorQuestion.mentorShareOptIn`
