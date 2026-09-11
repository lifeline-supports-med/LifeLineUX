import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { campaignsApi } from "@/lib/api/campaigns";
import { donationsApi } from "@/lib/api/donations";
import { ProgressBar, VerifiedBadge } from "@/components/campaign-card";
import { ShareButtons } from "@/components/share-buttons";
import { Loading, ErrorBox } from "@/components/loading";
import { fmtDate, fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/campaigns/$slug")({
  component: CampaignDetail,
  head: ({ params }) => ({ meta: [{ title: `Campaign · ${params.slug} — LifeLine` }] }),
});

function CampaignDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();

  const campaignQ = useQuery({
    queryKey: ["campaign", slug],
    queryFn: () => campaignsApi.bySlug(slug),
  });
  const c = campaignQ.data;

  const updatesQ = useQuery({
    queryKey: ["campaign", c?.id, "updates"],
    queryFn: () => campaignsApi.listUpdates(c!.id),
    enabled: !!c?.id,
  });
  const donationsQ = useQuery({
    queryKey: ["campaign", c?.id, "donations"],
    queryFn: () => donationsApi.forCampaign(c!.id),
    enabled: !!c?.id,
  });

  if (campaignQ.isLoading) return <div className="container-page py-12"><Loading /></div>;
  if (campaignQ.error || !c)
    return (
      <div className="container-page py-12">
        <ErrorBox message="Campaign not found." retry={campaignQ.refetch} />
      </div>
    );

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="container-page py-10">
      <Link to="/campaigns" className="text-sm text-muted-foreground hover:text-foreground">← All campaigns</Link>

      <div className="grid lg:grid-cols-3 gap-8 mt-4">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <VerifiedBadge status={c.status} />
              <span className="text-sm text-muted-foreground">by {c.creatorName}</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">{c.title}</h1>
            <p className="text-muted-foreground mt-2">{c.patientName} · {c.medicalCondition}</p>
          </div>

          {c.coverImageUrl && (
            <img src={c.coverImageUrl} alt={c.patientName} className="w-full aspect-[16/9] rounded-2xl object-cover border border-border" />
          )}

          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-3">Story</h2>
            <p className="whitespace-pre-line leading-relaxed text-sm text-foreground/90">{c.story}</p>
          </section>

          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-3">Updates ({updatesQ.data?.length ?? 0})</h2>
            {updatesQ.isLoading && <Loading label="Loading updates…" />}
            {updatesQ.data?.length === 0 && <p className="text-sm text-muted-foreground">No updates yet.</p>}
            <ul className="space-y-4">
              {updatesQ.data?.map((u) => (
                <li key={u.id} className="border-l-2 border-primary/30 pl-4">
                  <div className="text-xs text-muted-foreground">{fmtDate(u.postedAt)}</div>
                  <h3 className="font-semibold">{u.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{u.content}</p>
                  {u.imageUrl && <img src={u.imageUrl} alt="" className="mt-3 rounded-lg max-h-64 object-cover" />}
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-3">Recent donations ({donationsQ.data?.length ?? 0})</h2>
            {donationsQ.isLoading && <Loading label="Loading donations…" />}
            {donationsQ.data?.length === 0 && <p className="text-sm text-muted-foreground">Be the first to donate.</p>}
            <ul className="space-y-3">
              {donationsQ.data?.filter((d) => d.isVerified).map((d) => (
                <li key={d.id} className="flex items-start justify-between gap-3 bg-surface rounded-lg p-3">
                  <div>
                    <div className="text-sm font-medium">{d.donorName}</div>
                    {d.message && <div className="text-xs text-muted-foreground mt-0.5">{d.message}</div>}
                  </div>
                  <div className="text-sm font-semibold text-primary whitespace-nowrap">{fmtMoney(d.amount)}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft sticky top-20">
            <ProgressBar value={c.amountRaised} goal={c.goalAmount} />
            <div className="mt-2 text-xs text-muted-foreground">{c.donorCount} donors</div>
            <button
              disabled={c.status !== "Verified"}
              onClick={() => navigate({ to: "/donate/$slug", params: { slug: c.slug } })}
              className="w-full mt-5 h-12 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50 hover:opacity-90 transition"
            >
              {c.status === "Verified" ? "Donate now" : "Awaiting verification"}
            </button>
            {c.surgeryDate && (
              <p className="text-xs text-muted-foreground mt-3">
                Surgery scheduled <span className="font-medium text-foreground">{fmtDate(c.surgeryDate)}</span>
              </p>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-sm mb-3">Share this campaign</h3>
            <ShareButtons campaign={c} shareUrl={shareUrl} />
          </div>
        </aside>
      </div>
    </div>
  );
}