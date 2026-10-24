# Site search — specification (proposed, not yet built)

**Status: not built. Nothing in this document exists in the product today.** There is no `/search`
route, no `/api/search`, and no search or filter control on any page — including the glossary, the
admin database browser and the admin referral-codes table.

Written 24 Oct 2026. Build it when the Stripe work and the current ad-hoc items are settled.

---

## 1. What this is, and what it is not

A **search box for people already on the site** — a member looking for "crack spread", a visitor
looking for a glossary definition, someone hunting a specific section by its code.

It is **not** the thing that makes CommodityPlay appear in Google for "CP". That is a crawl and
indexation problem, handled by `sitemap.ts`, `robots.ts` and the canonicals/JSON-LD in
`src/lib/seo.ts`. A sitemap is discovery, not ranking; site search does not influence either.

It is also **not** an admin data browser. Searching referral codes, users or content modules is a
separate surface with different permissions — see §10.

---

## 2. The one invariant

> **Search never widens the access boundary.** A result is only shown if the user could reach the
> same page by browsing. If they cannot open it, they cannot find it.

This is the whole security model, and it must be enforced **server-side, per request, using the
user's real tier** — never by hiding rows in the client, and never by trusting a `tier` value from
the URL or a client component.

Why it matters concretely: only **Chapter A** is a free preview (`preview: true` in
`src/data/playbook.ts`); Chapters B–E are gated. `/playbook` itself 307s to `/login` for an
anonymous visitor. So an anonymous search must not return section titles from B–E — that would leak
paid content through the search box and make the gate decorative.

The tier check is the existing one: `hasAccess(userTier, requiredTier)` in `src/lib/utils.ts`
against `TIER_HIERARCHY`. Do not write a second access rule for search.

---

## 3. Entry point

**Primary: the site header.** A search input that expands from a magnifier icon, present on both
tracks and in the member area. Submitting navigates to `/search?q=<terms>`.

Why a real route rather than a dropdown of live results:

- The results are **linkable and shareable** — a member can send someone `/search?q=crack+spread`.
- **The back button works**, and filters can live in the URL (§5), so a filtered view can be
  bookmarked.
- It gives the site a stable, crawlable search URL — the prerequisite for the `SearchAction` in §9.

Secondary entry point: **the glossary page** gets its own inline filter box, scoped to glossary terms
only. It is a filter over a list already on screen, not a separate search.

Keyboard: `/` focuses the search input from anywhere except inside a text field. `Enter` submits.
`Escape` clears and collapses. The input is a real `<input type="search">` with an accessible label —
not a `div` with a placeholder.

---

## 4. What is searchable

Free text matches across the fields below. Everything is **case- and accent-insensitive**; multi-word
queries are matched per token, so "freight risk" finds an item containing both words even if they are
not adjacent, with an exact-phrase match ranked above it.

| Content type | Fields searched | Fields shown in the result | Source |
|---|---|---|---|
| Playbook chapters | title, subtitle | title, chapter letter, page count | `src/data/playbook.ts` |
| Playbook sections | title, `desc`, `hook`, `paragraphs` | title, section code, chapter, snippet | `src/data/playbook-sections.json` |
| Glossary | term, definition | term, first line of definition | `src/data/glossary.ts` |
| Interview questions | question text, answer body, category | question, category | `src/data/interview-questions-bank.json` |
| Knowledge tests | set title, week label | title, week | `src/data/knowledge-test.ts` |
| Job openings | role title, company, location, description | title, company, location | `src/data/job-openings.ts` |
| Library resources | title, description, type | title, type badge | library content module |
| Case studies | title, company, summary | title, company | `src/data/case-studies-index.json` |
| Mentors | name, current role, firm, expertise | name, role | `src/data/mentors.json` |

**Explicitly not indexed:** other members' data, `User` rows, `MentorQuestion` threads, referral
codes, contact messages, admin audit logs, and anything under `/admin`. Search is over **published
content**, never over people.

### Answering "name, ID, or keyword"

All three are supported, in one box, with no mode switch:

- **Keyword** — the default. Any words from the fields above.
- **Name** — a glossary term, a chapter title, a mentor's name, a company. Same field set.
- **ID** — a **section code** (`A1`, `C4`) or a **chapter letter** (`A`–`E`). These are recognised
  by shape and matched exactly, so `A1` returns that section as the first result rather than every
  item containing the letter "a". A bare `A` is ambiguous with ordinary words, so a single letter is
  treated as a chapter reference **only when it is the entire query**.

Note the corpus has no user-visible numeric IDs today. Section codes are the only identifier-shaped
thing a member can realistically know, which is why they get the exact-match shortcut.

---

## 5. Filters

Filters live in the URL as query parameters, so a filtered result set is shareable and survives a
refresh. All filters are additive; clearing them returns to the unfiltered set.

| Filter | Param | Values | Default |
|---|---|---|---|
| Content type | `type` | `chapter`, `section`, `glossary`, `interview`, `test`, `job`, `library`, `case-study`, `mentor` | all |
| Track | `track` | `career`, `sales` | all |
| Access | `access` | `available`, `all` | `available` |

Two rules on these:

- **Content-type filter chips show counts** — "Glossary (12)" — and a type with zero matches is
  **hidden**, not shown greyed out. A chip that leads to an empty page is worse than no chip.
- **The `access` filter can never reveal gated content.** It only offers `available` (what the user
  can open) or `all` (which, for a user without the tier, is identical to `available`). It exists so
  an entitled member can narrow to their tier, not so anyone can peek.

---

## 6. Sorting

One control, four options, in the URL as `sort`:

| `sort` | Behaviour |
|---|---|
| `relevance` *(default)* | Weighted: title match > `desc`/`hook` match > body match; exact-phrase > all-tokens; section code exact match always first. Ties break by content type, then by chapter/section order. |
| `newest` | Content `updatedAt` / publish order, descending. Only meaningful for jobs and tests; other types fall back to relevance. |
| `title` | A–Z on the displayed title, locale-aware. |
| `type` | Groups by content type in the order of the filter table, then relevance within each group. |

There is **no "oldest"** and no user-configurable direction — a second dimension nobody asked for,
and every extra state is another thing to keep correct in the URL.

---

## 7. Results display

- **Result count and the query echoed back**: `23 results for "crack spread"`.
- **Grouped by content type** by default (Playbook, Glossary, Interview questions, …), each group
  with its own heading and count. This is more useful than a flat list because the types are not
  comparable — a 40-page section and a two-line glossary entry do not belong in the same ranked list.
- **Each result is a card**: title as the link, a **one-line snippet with the matched terms
  highlighted**, and a small metadata line (content type, chapter/section code, track, read time).
- **Snippets are server-rendered text**, not raw HTML. Highlight by wrapping matched tokens in
  `<mark>` **after** escaping the source text — never by injecting the source with the query
  substituted in.
- **Locked results** (§2) are simply absent. The site does not tease paid content through search,
  and does not show a padlock row: an unopenable result is noise, not a prompt.
- **Pagination** at 20 per page, with `page` in the URL. Deliberately the same discipline as the
  admin referral-codes list: a bounded page, an explicit `orderBy` with a stable tiebreaker, and no
  unbounded result set.
- Results are **keyboard navigable**, each card a single tab stop, and the result count is announced
  politely (`aria-live="polite"`) once results arrive.

---

## 8. When nothing matches

The empty state is a **dead end only if it says "no results" and stops.** It should:

1. Say plainly: **`No results for "crack spræd"`** — echoing the query is what lets a user spot their
   own typo.
2. If a **near-miss exists**, offer it: *"Did you mean **crack spread**?"* — a single edit-distance
   suggestion, clicked to re-run. One suggestion, not a list of guesses.
3. If the query matched something the user **cannot access**, say so honestly without naming it:
   *"Some matching content is available on a higher plan."* This is the one place gated content is
   acknowledged — as a fact about the query, never as a title.
4. Offer **the browse routes** as real links: the playbook hub, the glossary A–Z, job openings. A
   no-match state is a navigation failure, and the fix is to give them somewhere to go.
5. Offer **a shorter query**: if the query had more than two tokens, suggest dropping to the most
   distinctive one.

Never show an empty state that is just whitespace, and never auto-redirect to a "close enough" page —
silently substituting a different result for what was asked reads as a bug.

---

## 9. What this unlocks

Once `/search` exists and is reachable, add the `SearchAction` to the `WebSite` entity in
`src/lib/seo.ts`:

```ts
potentialAction: {
  "@type": "SearchAction",
  target: { "@type": "EntryPoint", urlTemplate: `${CANONICAL_ORIGIN}/search?q={search_term_string}` },
  "query-input": "required name=search_term_string",
}
```

**Do not add it before the endpoint is live.** A `SearchAction` asserts that the template resolves;
declaring one for a route that 404s is invalid structured data and can earn a manual action instead
of the sitelinks search box it was meant to win. The audit harness currently **fails** if
`SearchAction` appears while there is no search endpoint — that guard exists precisely for this, and
should be inverted in the same change that ships `/search`, not deleted.

---

## 10. Deliberately out of scope

- **Admin search** (referral codes by code/label/member email, users, content modules). Different
  permissions, different data, and a `User` search must never share an index with public content.
  The paginated Admin → Referrals table is the natural place to add a `q` filter, as its own change.
- **Semantic / vector search.** The corpus is roughly 380–480 items across static modules. See §11.
- **Search analytics** (what people search for, what finds nothing). Genuinely valuable — a list of
  zero-result queries is the best content-gap report you can get — but it needs a table, a retention
  policy and a privacy decision. A follow-up, not a first version.
- **Saved searches, alerts, autocomplete-as-you-type.** Autocomplete in particular is a much larger
  surface than it looks (debounce, cancellation, stale responses, ranking) and earns little at this
  corpus size.

---

## 11. Architecture — why no search service

The corpus is small and almost entirely **static**: content lives in `src/data/*.ts|json` modules and
in `ContentModule` rows, not in thousands of user-authored records. Roughly:

| Type | Count |
|---|---|
| Playbook sections | 40 |
| Playbook chapters | 5 |
| Glossary terms | ~150–190 |
| Interview questions | 73 |
| Knowledge tests | ~20 |
| Case studies | 15 |
| Job openings | 10 |
| Mentors | 5 |

That is a few hundred items — comfortably held in memory. So:

- **No Algolia / Typesense / Elasticsearch.** An external index would add a vendor, a sync job, a
  secret and a failure mode, to search under 500 documents.
- **No Postgres full-text search either.** `tsvector` is the right tool at 100k rows, not at 400 —
  and it would need a schema change through `CORE_MIGRATION_SQL`, which is a cost with no payoff here.
- **Build the index from the data modules**, in a plain module (no `server-only`) so the audit
  harness can assert ranking and the access filter directly. Cache it at module scope; it is rebuilt
  on cold start, which is cheap.
- **CMS content must invalidate it.** `ContentModule` rows change through `/admin`, so the index
  cannot be baked at build time only. Rebuild on a version/timestamp check, or key the cache to the
  content revision — the same shape as `sync:cms`, but read-side.
- **Tokenise and rank in-process.** Lowercase, strip diacritics, split on non-alphanumerics, drop a
  small stop-word list. Score by field weight and phrase proximity. No stemmer needed at this size;
  a naive suffix match on ≥4 characters covers the common cases without the surprises a stemmer adds.

The one thing worth getting right now rather than later is the **access filter** (§2), because
retrofitting it after the index exists is how gated content leaks.

---

## 12. How it should be verified

Following the repo's existing gate — extend `scripts/verify-feedback-changes.ts` rather than adding a
runner:

1. **Access invariant, as the primary check.** Build the index for each tier (`STARTER`, `PRO`,
   `ELITE`, anonymous). Assert that the anonymous and STARTER result sets contain **no** Chapter B–E
   section, and that ELITE's does. Then assert the result set is a **subset of the URLs that tier can
   actually open** — this is the check that catches a future leak.
2. **Section-code exact match.** `A1` returns section A1 first; `A` alone returns Chapter A.
3. **Ranking.** A title match outranks a body-only match for the same term.
4. **Filters compose and are URL-driven.** `?q=risk&type=glossary` returns only glossary rows; an
   unknown `type` falls back to all rather than erroring.
5. **Empty state.** A query matching nothing renders the no-match copy with the query echoed, and a
   single-token typo yields exactly one suggestion.
6. **No raw HTML in snippets.** A content string containing `<script>` renders as text.
7. **`SearchAction` appears only once `/search` returns 200** — invert the current guard, do not
   remove it.

Each check should be teeth-tested: break the behaviour deliberately, watch the specific check go red,
restore, and verify the restore by hash. A search test that cannot fail is worse than none, because
it manufactures confidence about the one thing (the access boundary) that must not be wrong.
