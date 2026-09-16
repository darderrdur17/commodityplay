import type { JobOpening } from "@/data/job-openings";

function listingIdentityKey(job: Pick<JobOpening, "id" | "title" | "company">) {
  return `${job.id}::${job.title.trim().toLowerCase()}::${job.company.trim().toLowerCase()}`;
}

/** Seed hirer only if this CMS row is still the same listing (id + title + company). */
export function isUneditedSeedJobListing(
  job: Pick<JobOpening, "id" | "title" | "company">,
  seed?: Pick<JobOpening, "id" | "title" | "company">
): boolean {
  if (!seed) return false;
  return listingIdentityKey(job) === listingIdentityKey(seed);
}

function seedHirerNameIfSameListing(job: JobOpening, fallback?: JobOpening): string | undefined {
  if (!isUneditedSeedJobListing(job, fallback)) return undefined;
  return fallback?.hirerName;
}

/**
 * Live chat uses this listing's CMS hirerEmail/hirerName.
 * Editing a template into a new role (same id, new title/company) must not keep the seed hirer.
 */
export function withHirerFallback(job: JobOpening, fallback?: JobOpening): JobOpening {
  const cmsEmail = job.hirerEmail?.trim();
  const cmsName = job.hirerName?.trim();
  if (cmsEmail) {
    return {
      ...job,
      hirerEmail: cmsEmail,
      hirerName: cmsName || seedHirerNameIfSameListing(job, fallback),
    };
  }
  if (!isUneditedSeedJobListing(job, fallback) || !fallback?.hirerEmail?.trim()) {
    return {
      ...job,
      hirerEmail: undefined,
      hirerName: cmsName || undefined,
    };
  }
  return {
    ...job,
    hirerEmail: fallback.hirerEmail,
    hirerName: cmsName || fallback.hirerName,
  };
}
