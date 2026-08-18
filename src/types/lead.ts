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
  actor: { name: string; role: "DEALER" | "INTERNAL_ADMIN" };
}

export interface LeadWithRelations {
  id: string;
  legalName: string;
  farm: string;
  phone: string | null;
  email: string | null;
  leadGeneratorName: string | null;
  registrationDate: string;

  registrationState: RegistrationState;
  stage: LeadStage;
  closedLostReason: string | null;

  quoteStatus: QuoteStatus;
  quotedAt: string | null;
  quoteValueGbp: number | null;

  roiToBeDiscussed: boolean | null;

  productOptionsStatus: TaskStatus | null;
  solidHoppers: number | null;
  liquidLines: number | null;
  flowBoost: boolean | null;

  buyingProcess: string | null;
  finalApprover: string | null;

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
