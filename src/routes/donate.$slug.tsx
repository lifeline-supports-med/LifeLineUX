import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { campaignsApi } from "@/lib/api/campaigns";
import { donationsApi } from "@/lib/api/donations";
import { useAuth, ApiError } from "@/lib/auth";
import { fmtMoney } from "@/lib/format";
import { Loading, ErrorBox } from "@/components/loading";

export const Route = createFileRoute("/donate/$slug")({
  component: DonatePage,
  head: ({ params }) => ({ meta: [{ title: `Donate · ${params.slug} — LifeLine` }] }),
});

const PRESETS = [200, 500, 1000, 2500, 5000, 10000, 25000, 50000];

function DonatePage() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const campaignQ = useQuery({
    queryKey: ["campaign", slug],
    queryFn: () => campaignsApi.bySlug(slug),
  });

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [anon, setAnon] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");

  const initiate = useMutation({
    mutationFn: () => {
      if (!campaignQ.data) throw new Error("Campaign not loaded");
      return donationsApi.initiate({
        campaignId: campaignQ.data.id,
        amount: Number(amount),
        isAnonymous: anon,
        message: message || undefined,
        donorName: !user ? donorName : undefined,
        donorEmail: !user ? donorEmail : undefined,
      });
    },
    onSuccess: (data) => {
      sessionStorage.setItem("lifeline.lastDonationRef", data.paymentReference);
      window.location.href = data.paymentUrl;
    },
    onError: (err: unknown) => {
      const m = err instanceof ApiError ? err.message : "Could not start payment.";
      toast.error(m);
    },
  });

  if (campaignQ.isLoading) return <div className="container-page py-12"><Loading /></div>;
  if (campaignQ.error || !campaignQ.data)
    return <div className="container-page py-12"><ErrorBox message="Campaign not found." /></div>;

  const c = campaignQ.data;

  return (
    <div className="container-page py-12 max-w-2xl">
      <Link to="/campaigns/$slug" params={{ slug: c.slug }} className="text-sm text-muted-foreground hover:text-foreground">← Back to campaign</Link>
      <h1 className="font-display text-3xl font-bold mt-3">Donate to {c.patientName}</h1>
      <p className="text-muted-foreground mt-1">{c.medicalCondition}</p>

      <form
        onSubmit={(e) => { e.preventDefault(); initiate.mutate(); }}
        className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-soft mt-6 space-y-6"
      >
        <div>
          <label className="text-sm font-medium">Amount</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {PRESETS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setAmount(String(p))}
                className={`h-12 rounded-lg border font-semibold transition ${amount === String(p) ? "border-primary bg-primary-soft text-primary" : "border-border bg-background hover:bg-muted"}`}
              >
                {fmtMoney(p)}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={200}
            value={amount}
            onChange={(e) => setAmount((e.target.value))}
            className="mt-3 w-full h-12 px-4 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-ring text-lg font-semibold"
          />
          <p className="text-xs text-muted-foreground mt-1">Minimum ₦200. All transaction charges are covered by the platform.</p>
        </div>

        {!user && (
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium">Your name</span>
              <input required value={donorName} onChange={(e) => setDonorName(e.target.value)} placeholder="Your name" className="mt-1.5 w-full h-11 px-3 rounded-lg bg-background border border-border" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input required type="email" value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 w-full h-11 px-3 rounded-lg bg-background border border-border" />
            </label>
          </div>
        )}

        <label className="block">
          <span className="text-sm font-medium">Message of support (optional)</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Sending strength and prayers…"
            className="mt-1.5 w-full px-3 py-2 rounded-lg bg-background border border-border"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="w-4 h-4 accent-primary" />
          Donate anonymously
        </label>

        <div className="bg-surface rounded-xl p-4 text-xs text-muted-foreground flex gap-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-trust flex-shrink- mt-0.5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          You'll be redirected to Paystack for secure checkout.
        </div>

        <button
          disabled={initiate.isPending || c.status !== "Verified"}
          className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90 transition disabled:opacity-50"
        >
          {initiate.isPending ? "Starting payment…" : `Donate ${fmtMoney(Number(amount))}`}
        </button>
        {c.status !== "Verified" && (
          <p className="text-xs text-warning-foreground text-center">This campaign is awaiting verification and cannot accept donations yet.</p>
        )}
      </form>
    </div>
  );
}
