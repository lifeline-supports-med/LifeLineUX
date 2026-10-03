import { useState } from "react";
import { toast } from "sonner";
import type { Campaign } from "@/lib/api/types";
import { fmtMoney } from "@/lib/format";

interface ShareButtonsProps {
  campaign: Campaign;
  shareUrl: string;
}

export function ShareButtons({ campaign: c, shareUrl: campaignUrl }: ShareButtonsProps) {
  const [downloading, setDownloading] = useState(false);
  const donationUrl = campaignUrl
    ? new URL(`/donate/${encodeURIComponent(c.slug)}`, campaignUrl).toString()
    : "";

  const shareText = `Help ${c.patientName} with ${c.medicalCondition}.
🎯 Goal: ${fmtMoney(c.goalAmount)}  ·  Raised: ${fmtMoney(c.amountRaised)} (${c.donorCount} donors)

${c.story.slice(0, 240)}${c.story.length > 240 ? "…" : ""}

#LifeLine #MedicalEmergency`;
  const shareCaption = `${shareText}\n\n👉 Donate securely on LifeLine: ${donationUrl}`;

  // image URL → File blob (for native share)
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
      await navigator.clipboard.writeText(shareCaption);
      toast.success("Caption copied — paste it anywhere");
    } catch {
      toast.error("Couldn't copy caption");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(donationUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  // Core: share image + caption (native), fallback to download + caption
  const shareWithImage = async () => {
    try {
      const file = await imageToFile();
      const payload: ShareData = {
        title: `Help ${c.patientName}`,
        text: shareText,
        url: donationUrl,
      };

      if (file && navigator.canShare?.({ files: [file] })) {
        (payload as ShareData & { files: File[] }).files = [file];
      }

      if (navigator.share) {
        await navigator.share(payload);
        toast.success("Shared!");
        return;
      }

      // Fallback: download image + copy caption
      await downloadImage();
      await copyCaption();
      toast("Image saved 👍 Caption copied — just paste it!");
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === "AbortError";
      if (!aborted) toast.error("Share failed or was cancelled");
    }
  };

  const downloadImage = async () => {
    if (!c.coverImageUrl) {
      toast.error("No campaign image to download");
      return;
    }
    setDownloading(true);
    try {
      const res = await fetch(c.coverImageUrl, { mode: "cors" });
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `lifeline-${c.slug}.jpg`;
      link.href = objectUrl;
      link.click();
      URL.revokeObjectURL(objectUrl);
      toast.success("Image downloaded!");
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const waHref = `https://wa.me/?text=${encodeURIComponent(shareCaption)}`;
  const twHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(donationUrl)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(donationUrl)}&quote=${encodeURIComponent(shareText)}`;
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(donationUrl)}&text=${encodeURIComponent(shareText)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent(`Help ${c.patientName}`)}&body=${encodeURIComponent(shareCaption)}`;

  const platformBtn =
    "h-10 rounded-lg border border-border hover:bg-muted text-xs font-medium grid place-items-center transition";

  return (
    <div className="space-y-3">
      {/* Primary share actions */}
      <button onClick={shareWithImage} className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition">
        Share campaign
      </button>
      <button onClick={downloadImage} disabled={downloading} className="w-full h-10 rounded-lg border border-border hover:bg-muted text-xs font-medium disabled:opacity-50 transition">
        {downloading ? "Downloading…" : "Download campaign image"}
      </button>

      {/* Choose where to share */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Choose where to share:</p>
        <div className="grid grid-cols-3 gap-2">
          <a target="_blank" rel="noopener noreferrer" href={waHref} className={platformBtn}>WhatsApp</a>
          <a target="_blank" rel="noopener noreferrer" href={twHref} className={platformBtn}>X / Twitter</a>
          <a target="_blank" rel="noopener noreferrer" href={tgHref} className={platformBtn}>Telegram</a>
          <a target="_blank" rel="noopener noreferrer" href={fbHref} className={platformBtn}>Facebook</a>
          <a href={mailHref} className={platformBtn}>Email</a>
          <button onClick={copyLink} className={platformBtn}>Copy donation link</button>
        </div>
      </div>

      <button onClick={copyCaption} className="w-full h-10 rounded-lg border border-border hover:bg-muted text-xs font-medium transition">
        Copy share message
      </button>

      <p className="text-[11px] text-muted-foreground leading-snug">Share the campaign image with the caption and direct donation link.</p>
    </div>
  );
}
