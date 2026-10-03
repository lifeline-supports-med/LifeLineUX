import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { AuthCard, Field, inputCls, btnPrimary, FormError, PasswordInput } from "@/components/auth-ui";

export const Route = createFileRoute("/reset-password")({
  component: ResetPage,
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
    email: typeof s.email === "string" ? s.email : "",
  }),
  head: () => ({ meta: [{ title: "Reset password — LifeLine" }] }),
});

function ResetPage() {
  const { token: initialToken, email: initialEmail } = Route.useSearch();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(undefined);
    if (password !== confirm) { setErr("Passwords do not match."); return; }
    setBusy(true);
    try {
      await resetPassword(email, token, password);
      navigate({ to: "/login" });
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <AuthCard
      title="Set a new password"
      subtitle="Enter the code from your email and choose a new password."
      footer={<>Remembered it? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={err} />
        <Field label="Email">
          <input type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Reset code">
          <input required className={inputCls} value={token} onChange={(e) => setToken(e.target.value)} />
        </Field>
        <Field label="New password" hint="At least 8 characters">
          <PasswordInput required className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirm password">
          <PasswordInput required className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <button disabled={busy} className={btnPrimary}>{busy ? "Resetting..." : "Reset password"}</button>
      </form>
    </AuthCard>
  );
}
