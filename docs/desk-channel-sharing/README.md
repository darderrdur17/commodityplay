# Desk Channel sharing — Mentor Connect Q&A

## Dual consent (implemented)

Member questions and mentor answers stay **private by default**. Anonymous Desk Channel sharing requires **both** parties to opt in:

| Step | Who | When | Field |
| --- | --- | --- | --- |
| 1 | **Member** | Submitting a Mentor Connect question | `memberShareOptIn` |
| 2 | **Mentor** | Submitting their answer | `mentorShareOptIn` |

If either party does not opt in, the Q&A remains private (member still receives the answer on Mentor Connect / email).

When **both** opt in and the question is answered, it appears in **Admin → Q&A → Desk Channel queue**.

### Current behaviour

- Member checkbox on web (`/mentor-connect`) and mobile Mentor Connect form
- Mentor checkbox on practitioner inbox (`/mentor-connect/inbox`)
- Admin Q&A cards show member + mentor consent on every item (manual review on Answered / All)
- Desk Channel queue filter lists dual-consent candidates only

## Admin review queue (implemented)

Admin → **Q&A** → **Desk Channel queue**:

- [x] Filter: dual consent + answered + not yet published/rejected
- [x] Show segment, member, question, answer, both consent flags
- [x] Category picker (Trading / Ops / Risk / Tools / Career)
- [x] **Publish to Desk Channel** — copies anonymous Q&A into Desk Channel CMS
- [x] **Keep private** — reject; stays off Desk Channel

Frances can still review **All / Answered** and scan consent lines without using the queue.

## Publish to Desk Channel (implemented)

On admin **Publish**:

- [x] Append Q&A to Desk Channel CMS (`desk-channel` module), anonymous practitioner attribution
- [x] Category/tag from admin picker
- [x] Mark source question `deskChannelStatus: published` so it leaves the queue

On **Keep private**: `deskChannelStatus: rejected`.

---

## Related code

- Consent helper: `src/lib/mentor-share-consent.ts`
- Publish helper: `src/lib/desk-channel-publish.ts`
- Admin queue API: `src/app/api/admin/mentor/[id]/desk-channel/route.ts`
- Member submit API: `src/app/api/mentor-connect/route.ts`
- Mentor answer API: `src/app/api/mentor-connect/inbox/[id]/route.ts`
- Member UI: `src/components/mentor-connect/mentor-ask-panel.tsx`
- Mentor UI: `src/app/mentor-connect/inbox/mentor-inbox-client.tsx`
- Admin UI: `src/app/admin/admin-client.tsx` (Q&A tab)
- Desk Channel CMS: `src/app/admin/editors/desk-channel-editor.tsx`
- Schema: `MentorQuestion.memberShareOptIn` (DB column `isPublic`), `mentorShareOptIn`, `deskChannelStatus`
