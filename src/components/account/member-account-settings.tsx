"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Building2, Briefcase, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MemberAccountSettings({
  initialEmail,
  initialCompany,
  initialProfession,
}: {
  initialEmail: string;
  initialCompany: string | null;
  initialProfession: string | null;
}) {
  const { update } = useSession();
  const [email, setEmail] = useState(initialEmail);
  const [company, setCompany] = useState(initialCompany ?? "");
  const [profession, setProfession] = useState(initialProfession ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company, profession }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save profile");
        return;
      }
      setEmail(data.email);
      setCompany(data.company ?? "");
      setProfession(data.profession ?? "");
      await update();
      setSuccess("Profile saved.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-serif text-lg font-bold text-gray-900">Personal info</h2>
        <p className="text-xs text-muted-fg mt-1">Update your contact details. Track and billing stay read-only below.</p>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Mail className="w-4 h-4 text-muted-fg mt-3 shrink-0" />
          <Input
            label="Email Address - Work or School"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex items-start gap-3">
          <Building2 className="w-4 h-4 text-muted-fg mt-3 shrink-0" />
          <Input
            label="Company Name"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="flex items-start gap-3">
          <Briefcase className="w-4 h-4 text-muted-fg mt-3 shrink-0" />
          <Input
            label="Profession"
            type="text"
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            placeholder="Optional"
          />
        </div>
        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{success}</p>
        )}
        <Button type="submit" loading={saving} disabled={!email.trim()}>
          Save profile
        </Button>
      </div>
    </form>
  );
}
