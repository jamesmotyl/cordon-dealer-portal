import {
  type RegistrationState,
  type LeadStage,
  type QuoteStatus,
  type TaskStatus,
} from "@prisma/client";

export const REGISTRATION_LABELS: Record<RegistrationState, string> = {
  PENDING: "Pending Cordon Review",
  CLEARED: "Cleared",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
};

export const STAGE_LABELS: Record<LeadStage, string> = {
  CLIENT_EXPRESSED_INTEREST: "Client expressed interest",
  PRODUCT_RECOMMENDED: "Product recommended to client",
  CLIENT_WANTS_QUOTE: "Client wants a quote",
  CLIENT_WANTS_TO_TALK_TO_CORDON: "Client wants to talk to Cordon directly",
  CLIENT_WANTS_ADVICE_FROM_DEALER: "Client wants advice from dealer",
};

export const QUOTE_LABELS: Record<QuoteStatus, string> = {
  NEEDS_QUOTE: "Needs a quote",
  QUOTE_SENT: "Quote sent",
  QUOTE_ACCEPTED: "Quote accepted",
  QUOTE_DECLINED: "Quote declined",
  INVOICED: "Invoiced",
};

// DEALER_* labels get the real dealer name substituted in by the caller.
export function taskStatusLabel(status: TaskStatus, dealerName: string): string {
  const labels: Record<TaskStatus, string> = {
    DEALER_TODO: `${dealerName} - To do`,
    DEALER_DONE: `${dealerName} - Done`,
    CORDON_TODO: "Cordon - To do",
    CORDON_DONE: "Cordon - Done",
  };
  return labels[status];
}

const REGISTRATION_STYLES: Record<RegistrationState, string> = {
  PENDING: "bg-yellow-50 text-yellow-800 border-yellow-200",
  CLEARED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  EXPIRED: "bg-navy-100 text-navy-600 border-navy-200",
};

const STAGE_STYLES: Record<LeadStage, string> = {
  CLIENT_EXPRESSED_INTEREST: "bg-navy-50 text-navy-600 border-navy-100",
  PRODUCT_RECOMMENDED: "bg-orange-50 text-orange-700 border-orange-200",
  CLIENT_WANTS_QUOTE: "bg-orange-100 text-orange-700 border-orange-200",
  CLIENT_WANTS_TO_TALK_TO_CORDON: "bg-navy-100 text-navy-600 border-navy-200",
  CLIENT_WANTS_ADVICE_FROM_DEALER: "bg-navy-100 text-navy-600 border-navy-200",
};

const QUOTE_STYLES: Record<QuoteStatus, string> = {
  NEEDS_QUOTE: "bg-navy-50 text-navy-400 border-navy-100",
  QUOTE_SENT: "bg-orange-50 text-orange-700 border-orange-200",
  QUOTE_ACCEPTED: "bg-green-50 text-green-700 border-green-200",
  QUOTE_DECLINED: "bg-red-50 text-red-700 border-red-200",
  INVOICED: "bg-green-100 text-green-700 border-green-200",
};

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

export function RegistrationBadge({ state }: { state: RegistrationState }) {
  return <Badge label={REGISTRATION_LABELS[state]} className={REGISTRATION_STYLES[state]} />;
}

export function StageBadge({ stage }: { stage: LeadStage }) {
  return <Badge label={STAGE_LABELS[stage]} className={STAGE_STYLES[stage]} />;
}

export function QuoteBadge({ status }: { status: QuoteStatus }) {
  return <Badge label={QUOTE_LABELS[status]} className={QUOTE_STYLES[status]} />;
}

export function StaleBadge() {
  return <Badge label="No movement" className="bg-red-50 text-red-700 border-red-200" />;
}
