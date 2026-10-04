import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useAuth } from "@/lib/auth";
import { AuthCard, Field, inputCls, btnPrimary, FormError, PasswordInput } from "@/components/auth-ui";
import { GoogleAuthButton } from "@/components/google-auth-button";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — LifeLine" }, { name: "description", content: "Sign in to your LifeLine account." }] }),
  component: LoginPage,
});

function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);
  const handleGoogleCredential = useCallback(async (idToken: string) => {
    await loginWithGoogle(idToken);
    navigate({ to: "/" });
  }, [loginWithGoogle, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(undefined); setBusy(true);
    try { await login(email, password); navigate({ to: "/" }); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : "Sign in failed."); } finally { setBusy(false); }
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to manage campaigns, donations, and updates."
      footer={<>New to LifeLine? <Link to="/signup" className="text-primary font-medium hover:underline">Create an account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <FormError message={err} />
        <Field label="Email">
          <input type="email" required className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <PasswordInput required className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
        </div>
        <button disabled={busy} className={btnPrimary}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
      <GoogleAuthButton mode="signin_with" onCredential={handleGoogleCredential} />
    </AuthCard>
  );
}
