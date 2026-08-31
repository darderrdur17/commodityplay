"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Building2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function MentorAccountSettings({
  initialEmail,
  initialCompany,
}: {
  initialEmail: string;
  initialCompany: string | null;
}) {
  const { update } = useSession();
  const [email, setEmail] = useState(initialEmail);
  const [company, setCompany] = useState(initialCompany ?? "");
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
        body: JSON.stringify({ email, company }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save profile");
        return;
      }
      setEmail(data.email);
      setCompany(data.company ?? "");
      await update();
      setSuccess("Saved. New member requests will be emailed to this address.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-border overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-serif text-lg font-bold text-gray-900">Profile</h2>
        <p className="text-xs text-muted-fg mt-1">
          Update where request notifications are sent. Company is only visible to you.
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Mail className="w-4 h-4 text-muted-fg mt-3 shrink-0" />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            hint="Member questions and reminders are sent here."
          />
        </div>
        <div className="flex items-start gap-3">
          <Building2 className="w-4 h-4 text-muted-fg mt-3 shrink-0" />
          <Input
            label="Company name"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Optional"
            hint="Stays private — not shown to members or on Mentor Connect."
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
