# CommodityPlay — documentation index

Start here. These are the **living** docs — they describe the system as it is today. Everything else
in this folder is a dated design artifact, kept for history.

## Living docs

| Doc | Read it when you need to… |
|---|---|
| [`../README.md`](../README.md) | …get the project running for the first time |
| [`architecture.md`](./architecture.md) | …understand how the pieces fit together |
| [`environment.md`](./environment.md) | …set up env vars, or debug "why is this blank in production" |
| [`billing-and-pricing.md`](./billing-and-pricing.md) | …touch anything about plans, prices or Stripe |
| [`payments-go-live.md`](./payments-go-live.md) | …turn paid checkout on (or off), or verify it after a launch |
| [`runbook.md`](./runbook.md) | …build, deploy, verify a change, or debug a failed build |

## Historical artifacts

Dated design documents. Useful for *why*, unreliable for *what* — several describe designs that were
later changed or removed.

| Doc | Date | Status |
|---|---|---|
| `revamp-prd-2026-10-08.md` | 8 Oct 2026 | The revamp PRD. Largely current. |
| `revamp-architecture-2026-10-08.md` | 8 Oct 2026 | The revamp architecture. Largely current. |
| `class-diagram.mermaid` / `sequence-diagram.mermaid` | 8 Oct 2026 | Diagrams from the above. |
| `deploy-to-vercel-guide.md` | 1 Oct 2026 | Setup walkthrough. Superseded by `runbook.md`. |
| `audit-security-and-admin-design.md` | 29 Sep 2026 | ⚠️ **Its CRITICAL finding is fixed.** Describes a demo-account admin escalation that no longer exists. |
| `prd-admin-access-control.md` | 29 Sep 2026 | Design for the admin allowlist that is now implemented. |
| `vercel-build-and-merge-checklist.md` | 29 Sep 2026 | ⚠️ **Stale.** Describes the `security/audit-2026-09-26` branch. |
| `cursor-prompt-remaining-work.md` | 27 Sep 2026 | Historical task list. |
| `desk-channel-sharing/README.md` | — | Feature notes. |
| `production-demo-access/README.md` | — | Feature notes. |

## Conventions for adding docs

- **Living docs describe the present tense.** If you change behaviour, change the doc in the same PR.
- **Historical docs are frozen.** Add a new dated file rather than rewriting one — the *why* is the
  value, and a rewritten history doc destroys it.
- **Never put a secret or an env-var value in a doc.** This repo is **public**. Values belong in the
  environment; docs name the variable and say what breaks without it.
- **Never restate a price as if it were the source.** `src/data/pricing-shared.ts` is authoritative.
  `billing-and-pricing.md` shows current amounts only as a clearly-labelled snapshot, because the
  arithmetic is what needs explaining — the numbers will drift.
- **When a doc contradicts the code, the code wins.** Then fix the doc.
