import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "How LifeLine works" },
      { name: "description", content: "Learn how LifeLine verifies medical campaigns and protects donors." },
    ],
  }),
});

function About() {
  return (
    <div className="container-page py-16 max-w-3xl">
      <p className="text-xs uppercase tracking-wider text-primary font-semibold">About LifeLine</p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mt-3 text-balance">A trusted infrastructure for critical medical moments.</h1>
      <p className="text-lg text-muted-foreground mt-5 leading-relaxed">
        LifeLine was built to replace the chaotic, unverifiable appeals families rely on during medical emergencies. We provide structure, verification, and transparency so that help arrives faster — and donors can trust where their money goes.
      </p>

      <div className="grid sm:grid-cols-2 gap-5 mt-12">
        {[
          { t: "Verification first", d: "Every campaign is reviewed by humans against medical records and hospital partnerships before going live." },
          { t: "Transparent flow", d: "Donors see exactly how much has been raised, who donated, and how funds are being used." },
          { t: "Built for mobile", d: "Optimized for low-bandwidth networks and pp-first sharing across Africa." },
          { t: "Local payments", d: "Native integrations with Paystack and Flutterwave — cards, transfers, mobile money, and USSD." },
        ].map((b) => (
          <div key={b.t} className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-display font-semibold text-lg">{b.t}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{b.d}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display text-2xl font-bold mt-16">Verification process</h2>
      <ol className="mt-5 space-y-4">
        {[
          "You submit your campaign with patient details and supporting documents.",
          "Our verification team reviews documents and contacts the listed hospital.",
          "Identity and payout account are confirmed against bank-grade KYC.",
          "Approved campaigns receive a Verified badge and go live publicly.",
          "Funds are released against treatment milestones — never as a single lump sum.",
        ].map((s, i) => (
          <li key={i} className="flex gap-4">
            <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground grid place-items-center font-semibold flex-shrink-0">{i + 1}</span>
            <span className="pt-1.5">{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
