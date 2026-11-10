"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubmitting(false);
    setSent(true);
  }

  return (
    <AuthShell>
      <div className="card space-y-4 p-6">
        <h1 className="text-base font-semibold text-navy">Reset your password</h1>
        {sent ? (
          <p className="text-sm text-navy-600">
            If there's an account for {email}, we've emailed a link to reset the password. It expires in an
            hour. If nothing arrives, check spam or ask Cordon to reset it for you.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-navy-400">Enter your email and we'll send you a reset link.</p>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                autoFocus
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <p className="text-center text-sm">
          <Link href="/login" className="text-navy-400 hover:text-navy hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
