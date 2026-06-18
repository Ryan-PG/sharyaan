import { MessageCircle, Send, Loader2, CheckCircle2 } from "lucide-react";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { sendFeedback, type FeedbackType } from "@/services/feedback";
import { useMetroStore } from "@/store/useMetroStore";

type FeedbackCopyKey = keyof typeof feedbackCopy.en;

const feedbackTypes: Array<{ value: FeedbackType; labelKey: FeedbackCopyKey }> = [
  { value: "bug", labelKey: "feedbackTypeBug" },
  { value: "feature", labelKey: "feedbackTypeFeature" },
  { value: "data", labelKey: "feedbackTypeData" },
  { value: "other", labelKey: "feedbackTypeOther" },
];

const initialForm = {
  type: "bug" as FeedbackType,
  message: "",
  email: "",
  station: "",
  attachRouteContext: false,
};

const feedbackCopy = {
  en: {
    feedbackLabel: "Feedback",
    feedbackOpen: "Open feedback form",
    feedbackTitle: "Send feedback",
    feedbackDescription: "Share bugs, route data corrections, or product ideas with the developer.",
    feedbackType: "Type",
    feedbackTypeBug: "Bug report",
    feedbackTypeFeature: "Feature request",
    feedbackTypeData: "Data correction",
    feedbackTypeOther: "Other",
    feedbackMessage: "Message",
    feedbackMessagePlaceholder:
      "What happened, what should change, or which station data needs attention?",
    feedbackMessageHint: "Minimum 10 characters.",
    feedbackMessageTooShort: "Message must be at least 10 characters.",
    feedbackEmail: "Email optional",
    feedbackStation: "Station optional",
    feedbackAttachRoute: "Attach current route context",
    feedbackAttachRouteHint:
      "Includes selected origin, destination, and selected station IDs when available.",
    feedbackCancel: "Cancel",
    feedbackSubmit: "Send feedback",
    feedbackSending: "Sending",
    feedbackSent: "Feedback sent",
    feedbackSendError: "Could not send feedback. Please check your connection and try again.",
  },
  fa: {
    feedbackLabel: "بازخورد",
    feedbackOpen: "باز کردن فرم بازخورد",
    feedbackTitle: "ارسال بازخورد",
    feedbackDescription:
      "خطاها، اصلاح اطلاعات مسیر یا ایستگاه و ایده‌های بهبود را برای توسعه‌دهنده بفرستید.",
    feedbackType: "نوع",
    feedbackTypeBug: "گزارش خطا",
    feedbackTypeFeature: "درخواست قابلیت",
    feedbackTypeData: "اصلاح اطلاعات مترو یا ایستگاه",
    feedbackTypeOther: "سایر",
    feedbackMessage: "پیام",
    feedbackMessagePlaceholder:
      "چه اتفاقی افتاد، چه چیزی باید تغییر کند، یا کدام اطلاعات ایستگاه نیاز به اصلاح دارد؟",
    feedbackMessageHint: "حداقل ۱۰ نویسه.",
    feedbackMessageTooShort: "پیام باید حداقل ۱۰ نویسه باشد.",
    feedbackEmail: "ایمیل اختیاری",
    feedbackStation: "ایستگاه اختیاری",
    feedbackAttachRoute: "افزودن اطلاعات مسیر فعلی",
    feedbackAttachRouteHint:
      "در صورت وجود، شناسه ایستگاه مبدا، مقصد و ایستگاه انتخاب‌شده ارسال می‌شود.",
    feedbackCancel: "انصراف",
    feedbackSubmit: "ارسال بازخورد",
    feedbackSending: "در حال ارسال",
    feedbackSent: "بازخورد ارسال شد",
    feedbackSendError: "ارسال بازخورد ممکن نشد. اتصال خود را بررسی کنید و دوباره تلاش کنید.",
  },
} as const;

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const language = useMetroStore((state) => state.language);
  const originId = useMetroStore((state) => state.originId);
  const destinationId = useMetroStore((state) => state.destinationId);
  const selectedStationId = useMetroStore((state) => state.selectedStationId);
  const copy = feedbackCopy[language];
  const canSubmit = form.message.trim().length >= 10 && !submitting;
  const routeContext = useMemo(
    () => ({
      fromStation: originId,
      toStation: destinationId,
      selectedRouteId: selectedStationId,
    }),
    [destinationId, originId, selectedStationId],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.message.trim().length < 10) {
      setError(copy.feedbackMessageTooShort);
      return;
    }

    setSubmitting(true);

    try {
      const result = await sendFeedback({
        type: form.type,
        message: form.message.trim(),
        email: optionalValue(form.email),
        station: optionalValue(form.station),
        timestamp: new Date().toISOString(),
        ...(form.attachRouteContext ? routeContext : {}),
      });

      if (!result.ok) {
        setError(copy.feedbackSendError);
        return;
      }

      setOpen(false);
      setForm(initialForm);
      setToastVisible(true);
      window.setTimeout(() => setToastVisible(false), 3200);
    } catch {
      setError(copy.feedbackSendError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setOpen(true);
        }}
        className="fixed bottom-4 right-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border bg-card px-4 text-sm font-semibold text-card-foreground shadow-soft transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 sm:bottom-6 sm:right-6"
        aria-label={copy.feedbackOpen}
      >
        <MessageCircle className="size-4" aria-hidden />
        {copy.feedbackLabel}
      </button>

      <Dialog
        open={open}
        title={copy.feedbackTitle}
        onClose={() => setOpen(false)}
        className="sm:w-[min(560px,calc(100vw-2rem))]"
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <p className="text-sm text-muted-foreground">
            {copy.feedbackDescription}
          </p>

          <label className="grid gap-2 text-sm font-medium">
            {copy.feedbackType}
            <select
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as FeedbackType,
                }))
              }
              className="h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition focus:border-foreground/30 focus:ring-4 focus:ring-foreground/5"
            >
              {feedbackTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {copy[type.labelKey]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            {copy.feedbackMessage}
            <textarea
              required
              minLength={10}
              value={form.message}
              onChange={(event) =>
                setForm((current) => ({ ...current, message: event.target.value }))
              }
              rows={5}
              className="min-h-32 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-4 focus:ring-foreground/5"
              placeholder={copy.feedbackMessagePlaceholder}
            />
            <span className="text-xs text-muted-foreground">
              {copy.feedbackMessageHint}
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              {copy.feedbackEmail}
              <Input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="you@example.com"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              {copy.feedbackStation}
              <Input
                value={form.station}
                onChange={(event) =>
                  setForm((current) => ({ ...current, station: event.target.value }))
                }
                placeholder="Tajrish, Meydan-e Enghelab..."
              />
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-lg border bg-muted/25 px-3 py-3 text-sm">
            <input
              type="checkbox"
              checked={form.attachRouteContext}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  attachRouteContext: event.target.checked,
                }))
              }
              className="mt-1 size-4 rounded border"
            />
            <span>
              <span className="block font-medium">{copy.feedbackAttachRoute}</span>
              <span className="text-xs text-muted-foreground">
                {copy.feedbackAttachRouteHint}
              </span>
            </span>
          </label>

          {error ? (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              {copy.feedbackCancel}
            </Button>
            <Button variant="primary" type="submit" disabled={!canSubmit}>
              {submitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
              {submitting ? copy.feedbackSending : copy.feedbackSubmit}
            </Button>
          </div>
        </form>
      </Dialog>

      {toastVisible ? (
        <div
          className="fixed bottom-20 right-4 z-50 inline-flex min-h-11 items-center gap-2 rounded-lg border bg-card px-4 text-sm font-semibold text-card-foreground shadow-soft sm:right-6"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="size-4 text-emerald-500" aria-hidden />
          {copy.feedbackSent}
        </div>
      ) : null}
    </>
  );
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
