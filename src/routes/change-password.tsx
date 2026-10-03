import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { AuthCard, Field, inputCls, btnPrimary, FormError, FormSuccess, PasswordInput } from "@/components/auth-ui";

export const Route = createFileRoute("/change-password")({
  head: () => ({ meta: [{ title: "Change password — LifeLine" }] }),
  component: ChangePage,
});

function ChangePage() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string>();
  const [ok, setOk] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <AuthCard title="Sign in required" subtitle="You need to be signed in to change your password.">
        <Link to="/login" className={btnPrimary + " inline-flex items-center justify-center"}>Go to sign in</Link>
      </AuthCard>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(undefined); setOk(undefined);
    if (next !== confirm) { setErr("New passwords do not match."); return; }
    setBusy(true);
    try {
      await changePassword(current, next);
      setOk("Password updated. Redirecting...");
      setTimeout(() => navigate({ to: "/" }), 1200);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <AuthCard title="Change your password" subtitle={`Signed in as ${user.email}`}>
      <form onSubmit={submit} className="space-y-4">
        <FormError message={err} />
        <FormSuccess message={ok} />
        <Field label="Current password">
          <PasswordInput required className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password" hint="At least 8 characters">
          <PasswordInput required className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Field label="Confirm new password">
          <PasswordInput required className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <button disabled={busy} className={btnPrimary}>{busy ? "Updating..." : "Update password"}</button>
      </form>
    </AuthCard>
  );
}
