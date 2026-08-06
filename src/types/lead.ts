import {
  type RegistrationState,
  type LeadStage,
  type QuoteStatus,
  type TaskStatus,
} from "@prisma/client";

export interface ActivityLogEntry {
  id: string;
  action: string;
  detail: string | null;
  createdAt: string;
  actor: { name: string; role: "DEALER_USER" | "DEALER_ADMIN" | "INTERNAL_ADMIN" };
}

export interface LeadWithRelations {
  id: string;
  customerName: string;
  vineyard: string;
  phone: string | null;
  email: string | null;
  leadGeneratorName: string | null;

  registrationState: RegistrationState;
  stage: LeadStage;

  quoteStatus: QuoteStatus;
  quotedAt: string | null;
  quoteValueGbp: number | null;

  roiStatus: TaskStatus | null;
  productOptionsStatus: TaskStatus | null;

  commission: number | null;

  dealerId: string;
  dealer: { id: string; name: string };
  approvedBy: { id: string; name: string } | null;
  approvedAt: string | null;

  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;

  activityLogs: ActivityLogEntry[];
}
