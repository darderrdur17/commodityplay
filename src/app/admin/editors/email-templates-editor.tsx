"use client";

import {
  EMAIL_TEMPLATE_GROUPS,
  EMAIL_TEMPLATE_PLACEHOLDERS,
  type EmailCopy,
  type EmailTemplateKey,
  type EmailTemplatesContent,
} from "@/data/email-templates-content";
import { mergeEmailTemplates } from "@/lib/content/email-templates-schema";
import { EditorField, EditorSection, inputClass, textareaClass } from "./shared";

function CopyFields({
  title,
  audience,
  copy,
  placeholders,
  onChange,
}: {
  title: string;
  audience: string;
  copy: EmailCopy;
  placeholders: string[];
  onChange: (updates: Partial<EmailCopy>) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-3 bg-secondary/20">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700">
          To: {audience}
        </span>
      </div>

      <EditorField label="Subject line">
        <input
          className={inputClass}
          value={copy.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
        />
      </EditorField>

      <EditorField label="Heading" hint="The large title inside the email body.">
        <input
          className={inputClass}
          value={copy.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
        />
      </EditorField>

      <EditorField
        label="Intro paragraph"
        hint="Leave blank to remove the paragraph. Start a new paragraph with a blank line."
      >
        <textarea
          className={`${textareaClass} min-h-[88px]`}
          value={copy.intro}
          onChange={(e) => onChange({ intro: e.target.value })}
        />
      </EditorField>

      <EditorField label="Button label" hint="Leave blank to remove the button from the email.">
        <input
          className={inputClass}
          value={copy.buttonLabel}
          onChange={(e) => onChange({ buttonLabel: e.target.value })}
        />
      </EditorField>

      {placeholders.length > 0 && (
        <p className="text-[11px] text-muted-fg">
          Available placeholders:{" "}
          {placeholders.map((name) => (
            <code key={name} className="font-mono text-[11px] bg-white border border-border rounded px-1 mr-1">
              {`{{${name}}}`}
            </code>
          ))}
        </p>
      )}
    </div>
  );
}

export function EmailTemplatesEditor({
  payload,
  onChange,
}: {
  payload: unknown;
  onChange: (p: unknown) => void;
}) {
  const content = mergeEmailTemplates(payload);

  function patchEmail(key: EmailTemplateKey, updates: Partial<EmailCopy>) {
    const next: EmailTemplatesContent = {
      ...content,
      emails: { ...content.emails, [key]: { ...content.emails[key], ...updates } },
    };
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-fg bg-secondary/50 rounded-lg px-3 py-2">
        Wording for the automatic emails the site sends. Changes apply to the next email sent — no
        deploy, and already-sent emails are not affected. The layout, colours and branding stay
        fixed, so a change here can never break an email.
        <br />
        <br />
        Two things you can type anywhere above:{" "}
        <code className="font-mono text-[11px] bg-white border border-border rounded px-1">{"{{placeholder}}"}</code>{" "}
        fills in a real value, and{" "}
        <code className="font-mono text-[11px] bg-white border border-border rounded px-1">**bold**</code>{" "}
        makes text bold. Password-reset and internal admin alert emails are deliberately not editable.
      </p>

      {EMAIL_TEMPLATE_GROUPS.map((group, index) => (
        <EditorSection
          key={group.title}
          title={group.title}
          description={group.description}
          defaultOpen={index === 0}
        >
          {group.keys.map(({ key, label, audience }) => (
            <CopyFields
              key={key}
              title={label}
              audience={audience}
              copy={content.emails[key]}
              placeholders={EMAIL_TEMPLATE_PLACEHOLDERS[key]}
              onChange={(updates) => patchEmail(key, updates)}
            />
          ))}
        </EditorSection>
      ))}
    </div>
  );
}
