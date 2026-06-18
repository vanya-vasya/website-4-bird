"use client";

import { useState } from "react";
import { Button } from "@/components/fastbird";

const topics = [
  { value: "general", label: "General question" },
  { value: "billing", label: "Points & billing" },
  { value: "troubleshooting", label: "Troubleshooting" },
  { value: "business-api", label: "Business API" },
];

type Status = "idle" | "submitting" | "success" | "error";

type ContactFormProps = {
  defaultTopic?: string;
};

const inputClasses =
  "h-12 w-full rounded-md border border-line bg-surface px-4 text-[15px] text-ink placeholder:text-ink-soft fb-focus";

export const ContactForm = ({ defaultTopic = "general" }: ContactFormProps) => {
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    const form = e.currentTarget;
    const payload = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      topic: (form.elements.namedItem("topic") as HTMLSelectElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="rounded-md border border-line bg-sand p-8 text-center">
        <h2 className="font-heading text-h3 font-medium text-ink">
          Message received
        </h2>
        <p className="mt-2 text-[15px] text-ink-soft">
          Thanks for reaching out — we&apos;ll get back to you shortly.
        </p>
        <Button
          variant="secondary"
          size="md"
          className="mt-6"
          onClick={() => setStatus("idle")}
        >
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="font-mono text-eyebrow uppercase text-green"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Your name"
            className={`mt-2 ${inputClasses}`}
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="font-mono text-eyebrow uppercase text-green"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className={`mt-2 ${inputClasses}`}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="topic"
          className="font-mono text-eyebrow uppercase text-green"
        >
          Topic
        </label>
        <select
          id="topic"
          name="topic"
          defaultValue={defaultTopic}
          className={`mt-2 ${inputClasses}`}
        >
          {topics.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="message"
          className="font-mono text-eyebrow uppercase text-green"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          placeholder="How can we help?"
          className="mt-2 w-full rounded-md border border-line bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft fb-focus"
        />
      </div>

      {status === "error" && (
        <p className="font-mono text-xs text-[#b3261e]">
          Something went wrong. Please try again or email us directly.
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
};
