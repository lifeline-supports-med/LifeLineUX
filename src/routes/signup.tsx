import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, ApiError } from "@/lib/auth";
import { AuthCard, Field, inputCls, btnPrimary, FormError } from "@/components/auth-ui";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create your account — LifeLine" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phoneNumber: "", password: "", confirm: "",
  });
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(undefined);
    if (form.password !== form.confirm) { setErr("Passwords do not match."); return; }
    setBusy(true);
    try {
      await signup({
        firstName: form.firstName, lastName: form.lastName, email: form.email,
        phoneNumber: form.phoneNumber, password: form.password,
      });
      navigate({ to: "/" });
    } catch (e: unknown) {
      setErr(e instanceof ApiError ? e.message : (e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <AuthCard
      title="Create your LifeLine account"
      subtitle="Sign up to get started with LifeLine and access our services."
      footer={<>Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={err} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <input required maxLength={50} className={inputCls} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
          </Field>
          <Field label="Last name">
            <input required maxLength={50} className={inputCls} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
          </Field>
        </div>
        <Field label="Email">
          <input type="email" required className={inputCls} value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Phone number" hint="08012345678 or +2348012345678">
          <input required className={inputCls} value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="+234 800 000 0000" />
        </Field>
        <Field label="Password" hint="Min 8 chars · upper + lower + number">
          <input type="password" required minLength={8} className={inputCls} value={form.password} onChange={(e) => set("password", e.target.value)} />
        </Field>
        <Field label="Confirm password">
          <input type="password" required className={inputCls} value={form.confirm} onChange={(e) => set("confirm", e.target.value)} />
        </Field>
        <button disabled={busy} className={btnPrimary}>{busy ? "Creating account..." : "Create account"}</button>
        <p className="text-xs text-muted-foreground text-center">By signing up, you agree to our terms and verification policy.</p>
      </form>
    </AuthCard>
  );
}
