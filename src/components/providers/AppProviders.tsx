"use client";

import type { ReactNode } from "react";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { useDocumentPreferences } from "@/hooks/useDocumentPreferences";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  useDocumentPreferences();

  return (
    <>
      {children}
      <FeedbackWidget />
    </>
  );
}
