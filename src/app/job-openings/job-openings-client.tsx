"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Briefcase, Clock, Building2, ExternalLink, Filter } from "lucide-react";
import { JOB_OPENINGS, JOB_REGIONS, JOB_LEVELS, JOB_SEGMENTS } from "@/data/job-openings";
import { TierGate } from "@/components/tier-gate";
import { Reveal } from "@/components/animations";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface Props {
  userTier: string;
  jobs?: typeof JOB_OPENINGS;
  regions?: typeof JOB_REGIONS;
  levels?: typeof JOB_LEVELS;
  segments?: typeof JOB_SEGMENTS;
  requiredTier?: "PRO" | "ELITE";
}

export function JobOpeningsClient({
  userTier,
  jobs = JOB_OPENINGS,
  regions = JOB_REGIONS,
  levels = JOB_LEVELS,
  segments = JOB_SEGMENTS,
  requiredTier = "ELITE",
}: Props) {
  const [region, setRegion] = useState("All");
  const [level, setLevel] = useState("All");
  const [segment, setSegment] = useState("All");

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (region !== "All" && j.region !== region) return false;
      if (level !== "All" && j.level !== level) return false;
      if (segment !== "All" && j.segment !== segment) return false;
      return true;
    });
  }, [region, level, segment, jobs]);

  const content = (
    <div className="page-container py-8 sm:py-10">
      <section className="rounded-2xl bg-primary-800 px-6 sm:px-8 py-10 mb-8 relative overflow-hidden">
        <Reveal className="relative z-10">
          <div className="pill pill-dark mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Elite · Market Tracker
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
            Market Job Openings
          </h1>
          <p className="text-white/65 text-base sm:text-lg max-w-xl">
            Curated roles across commodity trading firms — updated weekly. Filter by region, level, and segment.
          </p>
          <div className="flex gap-3 mt-6 flex-wrap">
            <div className="glass-card px-4 py-2 text-white text-sm font-semibold">
              {jobs.length} active roles
            </div>
            <div className="glass-card px-4 py-2 text-white text-sm font-semibold">
              5 regions
            </div>
          </div>
        </Reveal>
      </section>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-fg" />
          <span className="text-sm font-semibold text-gray-800">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Region", value: region, set: setRegion, options: regions },
            { label: "Level", value: level, set: setLevel, options: levels },
            { label: "Segment", value: segment, set: setSegment, options: segments },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs text-muted-fg mb-1 block">{f.label}</label>
              <select
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {f.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-fg mb-4">
        {filtered.length} role{filtered.length !== 1 ? "s" : ""} found
      </p>

      <div className="space-y-4">
        {filtered.map((job, i) => (
          <Reveal key={job.id} delay={i * 0.03}>
            <motion.div
              className={`bg-white rounded-xl border p-5 sm:p-6 card-hover ${
                job.featured ? "border-primary-line ring-1 ring-primary-line" : "border-border"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {job.featured && <Badge variant="pro" size="sm">Featured</Badge>}
                    <Badge variant="outline" size="sm">{job.level}</Badge>
                    <Badge variant="secondary" size="sm">{job.type}</Badge>
                  </div>
                  <h2 className="font-serif text-lg font-bold text-gray-900 mb-1">{job.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-fg mb-3">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" /> {job.company}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" /> {job.segment}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{job.description}</p>
                  <ul className="space-y-1">
                    {job.requirements.map((r) => (
                      <li key={r} className="text-xs text-muted-fg flex items-start gap-1.5">
                        <span className="text-primary-400 mt-0.5">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                  {job.salary && (
                    <p className="text-sm font-semibold text-gray-800">{job.salary}</p>
                  )}
                  <p className="text-xs text-muted-fg flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Posted {formatDate(job.posted)}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-primary-400 font-medium">
                    Apply via firm website <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </motion.div>
          </Reveal>
        ))}
      </div>

      <div className="mt-8 text-center p-6 bg-secondary rounded-xl">
        <p className="text-sm text-muted-fg mb-3">
          Want alerts when new roles are posted? Join the job board waitlist.
        </p>
        <Link href="/waitlist">
          <Badge variant="pro" className="cursor-pointer hover:opacity-80">
            Join Waitlist →
          </Badge>
        </Link>
      </div>
    </div>
  );

  return (
    <TierGate requiredTier={requiredTier} userTier={userTier} compact>
      {content}
    </TierGate>
  );
}
