"use client";

import React from "react";
import {
  DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT,
  type AccountIntelligenceContent,
} from "@/data/account-intelligence-content";
import { normalizeAccountIntelligencePayload } from "@/lib/content/account-intelligence-schema";
import { EditorField, EditorSection, inputClass, textareaClass } from "./shared";

export function AccountIntelligenceEditor({
  payload,
  onChange,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
}) {
  const content = normalizeAccountIntelligencePayload(payload ?? DEFAULT_ACCOUNT_INTELLIGENCE_CONTENT);

  function patch(partial: Partial<AccountIntelligenceContent>) {
    onChange({ ...content, ...partial });
  }

  function patchContinue(partial: Partial<AccountIntelligenceContent["continueSection"]>) {
    onChange({
      ...content,
      continueSection: { ...content.continueSection, ...partial },
    });
  }

  return (
    <div className="space-y-4">
      <EditorSection title="Page Header" defaultOpen>
        <EditorField label="Eyebrow">
          <input
            className={inputClass}
            value={content.eyebrow}
            onChange={(e) => patch({ eyebrow: e.target.value })}
          />
        </EditorField>
        <EditorField label="Title">
          <input
            className={inputClass}
            value={content.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </EditorField>
        <EditorField label="Description">
          <textarea
            className={textareaClass}
            rows={3}
            value={content.description}
            onChange={(e) => patch({ description: e.target.value })}
          />
        </EditorField>
      </EditorSection>

      <EditorSection title="Accounts Section">
        <EditorField label="My Accounts heading">
          <input
            className={inputClass}
            value={content.myAccountsHeading}
            onChange={(e) => patch({ myAccountsHeading: e.target.value })}
          />
        </EditorField>
        <EditorField label="Empty state message">
          <textarea
            className={textareaClass}
            rows={2}
            value={content.emptyStateMessage}
            onChange={(e) => patch({ emptyStateMessage: e.target.value })}
          />
        </EditorField>
      </EditorSection>

      <EditorSection title="Continue Section">
        <EditorField label="Heading">
          <input
            className={inputClass}
            value={content.continueSection.heading}
            onChange={(e) => patchContinue({ heading: e.target.value })}
          />
        </EditorField>
        <EditorField label="Prep Library button">
          <input
            className={inputClass}
            value={content.continueSection.prepLibraryButton}
            onChange={(e) => patchContinue({ prepLibraryButton: e.target.value })}
          />
        </EditorField>
        <EditorField label="Market Nudges button">
          <input
            className={inputClass}
            value={content.continueSection.marketNudgesButton}
            onChange={(e) => patchContinue({ marketNudgesButton: e.target.value })}
          />
        </EditorField>
      </EditorSection>
    </div>
  );
}
