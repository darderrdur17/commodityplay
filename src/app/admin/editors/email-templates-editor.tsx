"use client";

import { useState } from "react";
import {
  EMAIL_TEMPLATE_GROUPS,
  EMAIL_TEMPLATE_PLACEHOLDERS,
  type EmailCopy,
  type EmailTemplateKey,
  type EmailTemplatesContent,
} from "@/data/email-templates-content";
import { mergeEmailTemplates } from "@/lib/content/email-templates-schema";
import { Button } from "@/components/ui/button";
import { EditorField, EditorSection, inputClass, textareaClass } from "./shared";

/** Shape returned by `POST /api/admin/email-preview`. */
interface EmailPreviewResponse {
  subject: string;
  text: string;
  html: string;
}

/** Shape returned by `POST /api/admin/email-preview/send`. */
interface SendTestResponse {
  ok: boolean;
  delivered: boolean;
  skipped: boolean;
  reason?: string;
  to: string;
}

type SendStatus = "idle" | "sending" | "sent" | "not_configured" | "error";

/**
 * Preview and test-send controls for a single template.
 *
 * Both requests send the editor's *current* payload, so the preview reflects
 * unsaved edits — that is the whole point of "I typed a new subject, show me".
 * The server renders the preview with the same builder the live sender uses, so
 * what is shown here is genuinely what recipients get.
 */
function EmailPreviewActions({
  templateKey,
  content,
}: {
  templateKey: EmailTemplateKey;
  content: EmailTemplatesContent;
}) {
  const [preview, setPreview] = useState<EmailPreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const [sendMessage, setSendMessage] = useState("");

  // Both buttons share one "busy" flag so a double-click cannot fire a second
  // preview — or, worse, a second test email.
  const busy = previewLoading || sendStatus === "sending";

  async function handlePreview() {
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const res = await fetch("/api/admin/email-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: templateKey, payload: content }),
      });
      const data = (await res.json().catch(() => null)) as
        | (EmailPreviewResponse & { error?: string })
        | null;
      if (!res.ok || !data || typeof data.html !== "string") {
        setPreview(null);
        setPreviewError(data?.error || "Could not build the preview.");
        return;
      }
      setPreview({ subject: data.subject, text: data.text, html: data.html });
    } catch {
      setPreview(null);
      setPreviewError("Could not build the preview.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSend() {
    setSendStatus("sending");
    setSendMessage("");
    try {
      const res = await fetch("/api/admin/email-preview/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: templateKey, payload: content }),
      });
      const data = (await res.json().catch(() => null)) as
        | (SendTestResponse & { error?: string })
        | null;
      if (!res.ok || !data) {
        setSendStatus("error");
        setSendMessage(data?.error || "Could not send the test email.");
        return;
      }
      if (data.ok && data.delivered) {
        setSendStatus("sent");
        setSendMessage(`Sent to ${data.to}.`);
      } else if (data.skipped) {
        // Distinct from a failure: the server is not configured to send at all.
        setSendStatus("not_configured");
        setSendMessage("Not configured — nothing was sent.");
      } else {
        setSendStatus("error");
        setSendMessage(data.reason ? `Could not send: ${data.reason}` : "Could not send the test email.");
      }
    } catch {
      setSendStatus("error");
      setSendMessage("Could not send the test email.");
    }
  }

  const sendMessageClass =
    sendStatus === "sent"
      ? "text-green-700"
      : sendStatus === "not_configured"
      ? "text-amber-700"
      : "text-red-600";

  return (
    <div className="space-y-2 border-t border-border pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePreview}
          disabled={busy}
          loading={previewLoading}
        >
          Preview
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSend}
          disabled={busy}
          loading={sendStatus === "sending"}
        >
          Send test email
        </Button>
        {sendMessage && <span className={`text-xs ${sendMessageClass}`}>{sendMessage}</span>}
      </div>

      <p className="text-[11px] text-muted-fg">
        The preview uses your current edits, including unsaved ones. Click Save to make them live.
      </p>

      {previewError && <p className="text-[11px] text-red-600">{previewError}</p>}

      {preview && (
        <div className="space-y-2">
          <p className="text-xs text-muted-fg">
            Subject: <span className="font-semibold text-gray-900">{preview.subject}</span>
          </p>
          {/*
            Fully sandboxed (no `allow-scripts`): the email HTML is static and needs
            no scripts, so nothing inside it can run or reach the admin page.
          */}
          <iframe
            title={`Email preview: ${preview.subject}`}
            srcDoc={preview.html}
            sandbox=""
            className="w-full h-96 rounded-lg border border-border bg-white"
          />
          <details className="text-[11px] text-muted-fg">
            <summary className="cursor-pointer">Plain-text version</summary>
            <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] bg-secondary/40 rounded-lg p-3">
              {preview.text}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function CopyFields({
  templateKey,
  title,
  audience,
  copy,
  content,
  placeholders,
  onChange,
}: {
  templateKey: EmailTemplateKey;
  title: string;
  audience: string;
  copy: EmailCopy;
  content: EmailTemplatesContent;
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

      <EmailPreviewActions templateKey={templateKey} content={content} />
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
        <br />
        <br />
        <strong>Preview</strong> shows the email with sample details, using your current edits.{" "}
        <strong>Send test email</strong> delivers a copy to your own inbox so you can check it for
        real before saving.
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
              templateKey={key}
              title={label}
              audience={audience}
              copy={content.emails[key]}
              content={content}
              placeholders={EMAIL_TEMPLATE_PLACEHOLDERS[key]}
              onChange={(updates) => patchEmail(key, updates)}
            />
          ))}
        </EditorSection>
      ))}
    </div>
  );
}
