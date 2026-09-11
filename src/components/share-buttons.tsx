import { toast } from "sonner";
import type { Campaign } from "@/lib/api/types";
import { fmtMoney } from "@/lib/format";

interface ShareButtonsProps {
  campaign: Campaign;
  shareUrl: string;
}

export function ShareButtons({ campaign: c, shareUrl }: ShareButtonsProps) {
  const shareText = `🚨 Help ${c.patientName} — ${c.medicalCondition}
🎯 Goal: ${fmtMoney(c.goalAmount)}  ·  Raised: ${fmtMoney(c.amountRaised)} (${c.donorCount} donors)

${c.story.slice(0, 240)}${c.story.length > 240 ? "…" : ""}

👉 Donate / verify on LifeLine: ${shareUrl}

#LifeLine #MedicalEmergency`;

  const imageToFile = async (): Promise<File | null> => {
    if (!c.coverImageUrl) return null;
    try {
      const res = await fetch(c.coverImageUrl, { mode: "cors" });
      const blob = await res.blob();
      return new File([blob], `${c.slug}.jpg`, { type: blob.type || "image/jpeg" });
    } catch {
      return null;
    }
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Caption copied — paste it anywhere");
    } catch {
      toast.error("Couldn't copy caption");
    }
  };

  const nativeShare = async () => {
    try {
      const file = await imageToFile();
      const payload: ShareData = { title: `Help ${c.patientName}`, text: shareText, url: shareUrl };
      if (file && navigator.canShare?.({ files: [file] })) {
        (payload as ShareData & { files: File[] }).files = [file];
      }
      if (navigator.share) { await navigator.share(payload); toast.success("Shared!"); return; }
      await copyCaption();
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === "AbortError";
      if (!aborted) toast.error("Share failed");
    }
  };

  const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const twHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(`Help ${c.patientName}`)}&body=${encodeURIComponent(shareText)}`;

  return (
    <div className="space-y-3">
      <button onClick={nativeShare} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition">
        Share campaign
      </button>
      <div className="grid grid-cols-3 gap-2">
        <a target="_blank" rel="noopener noreferrer" href={waHref} className="h-10 rounded-lg border border-border hover:bg-muted text-xs font-medium grid place-items-center">Whatsapp</a>
        <a target="_blank" rel="noopener noreferrer" href={twHref} className="h-10 rounded-lg border border-border hover:bg-muted text-xs font-medium grid place-items-center">X / Twitter</a>
        <a target="_blank" rel="noopener noreferrer" href={tgHref} className="h-10 rounded-lg border border-border hover:bg-muted text-xs font-medium grid place-items-center">Telegram</a>
        <a target="_blank" rel="noopener noreferrer" href={fbHref} className="h-10 rounded-lg border border-border hover:bg-muted text-xs font-medium grid place-items-center">Facebook</a>
        <a href={mailHref} className="h-10 rounded-lg border border-border hover:bg-muted text-xs font-medium grid place-items-center">Email</a>
        <button onClick={() => { navigator.clipboard?.writeText(shareUrl); toast.success("Link copied"); }} className="h-10 rounded-lg border border-border hover:bg-muted text-xs font-medium">
          Copy link
        </button>
      </div>
      <button onClick={copyCaption} className="h-10 w-full rounded-lg border border-border hover:bg-muted text-xs font-medium">
        Copy caption
      </button>
    </div>
  );
}
