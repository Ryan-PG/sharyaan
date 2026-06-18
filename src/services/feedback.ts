export type FeedbackType = "bug" | "feature" | "data" | "other";

export type FeedbackPayload = {
  type: FeedbackType;
  message: string;
  email?: string;
  station?: string;
  timestamp: string;
  fromStation?: string | null;
  toStation?: string | null;
  selectedRouteId?: string | null;
};

export type FeedbackResponse = {
  ok: boolean;
  message: string;
};

export async function sendFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return {
      ok: false,
      message: await readErrorMessage(response),
    };
  }

  return {
    ok: true,
    message: "Feedback sent",
  };
}

async function readErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { message?: unknown; error?: unknown };
    const message = typeof data.message === "string" ? data.message : data.error;
    if (typeof message === "string" && message.trim()) return message;
  } catch {
    // Fall through to a stable user-facing error.
  }

  return "Could not send feedback. Please try again.";
}
