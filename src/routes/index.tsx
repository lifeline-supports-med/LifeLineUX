import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api/campaigns";
import { CampaignCard } from "@/components/campaign-card";
import { Loading, ErrorBox } from "@/components/loading";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "LifeLine — Trusted medical emergency fundraising" },
      { name: "description", content: "Raise urgent funds for medical care. Verified campaigns, transparent progress, instant donations across Africa." },
    ],
  }),
});

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-3xl md:text-4xl font-bold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
      <div className="w-9 h-9 rounded-lg bg-primary-soft text-primary grid place-items-center font-display font-bold mb-4">{n}</div>
      <h3 className="font-display font-semibold text-lg mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

function Index() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["campaigns", "featured"],
    queryFn: () => campaignsApi.list(1, 6),
  });
  const featured = (data ?? []).filter((c) => c.status === "Verified").slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-soft opacity-40 pointer-events-none" />
        <div className="container-page py-20 md:py-28 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-primary-soft text-primary border border-primary/10">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Verified medical fundraisers
              </span>
              <h1 className="mt-5 font-display text-4xl md:text-6xl font-bold leading-[1.05] text-balance">
                Help when minutes matter.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg">
                LifeLine replaces frantic appeals with a structured, verified, transparent way to fund urgent medical care.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/create" className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90 transition">
                  Start a fundraiser
                </Link>
                <Link to="/campaigns" className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-border bg-card font-semibold hover:bg-muted transition">
                  Donate now
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
                <Stat value="Verified" label="Every campaign" />
                <Stat value="Live" label="Donation tracking" />
                <Stat value="24h" label="Verification SLA" />
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-primary-soft/40 blur-3xl rounded-full" />
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-lift border border-border">
                <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=70" alt="A doctor and child" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold">How LifeLine works</h2>
          <p className="text-muted-foreground mt-3">Four steps from emergency to relief — designed to remove friction for families in crisis.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          <Step n={1} title="Create campaign" body="Add patient details, medical condition, and goal in under 5 minutes." />
          <Step n={2} title="Get verified" body="Upload medical proof. Our team reviews within 24 hours and adds a trust badge." />
          <Step n={3} title="Share widely" body="One link works on pp, social, and SMS — with rich previews." />
          <Step n={4} title="Receive funds" body="Donations flow to your verified payout account once approved." />
        </div>
      </section>

      <section className="container-page py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Active emergency cases</h2>
            <p className="text-muted-foreground mt-2">Real people. Verified stories. Every donation tracked.</p>
          </div>
          <Link to="/campaigns" className="text-sm font-semibold text-primary hover:underline hidden sm:inline">View all →</Link>
        </div>
        {isLoading && <Loading label="Loading featured campaigns…" />}
        {error && <ErrorBox message="Could not load campaigns. Check your connection." retry={refetch} />}
        {!isLoading && !error && featured.length === 0 && (
          <div className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-2xl">
            No verified campaigns are live right now.
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((c) => <CampaignCard key={c.id} c={c} />)}
        </div>
      </section>
    </>
  );
}
