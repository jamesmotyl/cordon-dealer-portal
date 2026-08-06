import { PrismaClient, Role, RegistrationState, LeadStage, QuoteStatus, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { LEAD_EXPIRATION_DAYS } from "../src/lib/config";

const prisma = new PrismaClient();

async function upsertDealer(name: string, region: string) {
  const existing = await prisma.dealer.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.dealer.create({ data: { name, region, status: "ACTIVE" } });
}

async function upsertUser(
  email: string,
  name: string,
  role: Role,
  password: string,
  dealerId: string | null
) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { dealerId },
    create: { email, name, role, passwordHash, dealerId },
  });
}

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  const vinescapes = await upsertDealer("Vinescapes", "UK");
  const northfield = await upsertDealer("Northfield Vineyard Services", "UK");

  const admin = await upsertUser("admin@cordon.ai", "Cordon Admin", Role.INTERNAL_ADMIN, "admin123", null);
  const joel = await upsertUser(
    "joel@vinescapes.com",
    "Joel",
    Role.DEALER_ADMIN,
    "dealer123",
    vinescapes.id
  );
  const sam = await upsertUser(
    "sam@vinescapes.com",
    "Sam",
    Role.DEALER_USER,
    "dealer123",
    vinescapes.id
  );
  const alex = await upsertUser(
    "alex@northfield.com",
    "Alex",
    Role.DEALER_ADMIN,
    "dealer123",
    northfield.id
  );

  // Re-seed leads fresh each run so the demo data always matches the current schema.
  await prisma.activityLog.deleteMany({});
  await prisma.lead.deleteMany({});

  async function createLead(
    data: Parameters<typeof prisma.lead.create>[0]["data"],
    activity: { actorId: string; action: string; detail?: string }[]
  ) {
    const lead = await prisma.lead.create({ data });
    for (const entry of activity) {
      await prisma.activityLog.create({
        data: { leadId: lead.id, actorId: entry.actorId, action: entry.action, detail: entry.detail },
      });
    }
    return lead;
  }

  // Recreates the one real example row from the Cordon-Vinescapes tracker.
  await createLead(
    {
      customerName: "Joe Bloggs",
      company: "Best Grapes Vineyard",
      phone: "07712345678",
      email: "joe@example.com",
      leadGeneratorName: "Joel",
      dealerId: vinescapes.id,
      registrationState: RegistrationState.CLEARED,
      stage: LeadStage.PRODUCT_RECOMMENDED,
      quoteStatus: QuoteStatus.QUOTE_SENT,
      quotedAt: new Date("2026-08-01"),
      quoteValueGbp: 10000,
      roiStatus: TaskStatus.DEALER_DONE,
      productOptionsStatus: TaskStatus.DEALER_DONE,
      approvedById: admin.id,
      approvedAt: new Date(),
      expiresAt: daysFromNow(LEAD_EXPIRATION_DAYS),
    },
    [
      { actorId: joel.id, action: "Lead submitted", detail: "Best Grapes Vineyard submitted for review." },
      { actorId: admin.id, action: "Approved", detail: "Cleared for Vinescapes' exclusivity on this vineyard." },
    ]
  );

  // A lead still in Vinescapes' pipeline, no quote yet.
  await createLead(
    {
      customerName: "Sandra Lee",
      company: "Hillcrest Farms",
      region: "Somerset",
      phone: "07700123456",
      leadGeneratorName: "Sam",
      dealerId: vinescapes.id,
      registrationState: RegistrationState.CLEARED,
      stage: LeadStage.CLIENT_WANTS_QUOTE,
      quoteStatus: QuoteStatus.NEEDS_QUOTE,
      roiStatus: TaskStatus.DEALER_TODO,
      approvedById: admin.id,
      approvedAt: new Date(),
      expiresAt: daysFromNow(LEAD_EXPIRATION_DAYS),
    },
    [
      { actorId: sam.id, action: "Lead submitted", detail: "Hillcrest Farms submitted for review." },
      { actorId: admin.id, action: "Approved", detail: "Cleared for Vinescapes' exclusivity on this vineyard." },
    ]
  );

  // A same-vineyard conflict from two different dealers, both still pending —
  // this is what /admin/conflicts is for.
  await createLead(
    {
      customerName: "Mike Chen",
      company: "Willowbrook Estate",
      leadGeneratorName: "Joel",
      dealerId: vinescapes.id,
      registrationState: RegistrationState.PENDING,
    },
    [{ actorId: joel.id, action: "Lead submitted", detail: "Willowbrook Estate submitted for review." }]
  );
  await createLead(
    {
      customerName: "M. Chen",
      company: "Willowbrook Estate",
      leadGeneratorName: "Alex",
      dealerId: northfield.id,
      registrationState: RegistrationState.PENDING,
    },
    [{ actorId: alex.id, action: "Lead submitted", detail: "Willowbrook Estate submitted for review." }]
  );

  console.log("Seed complete.");
  console.log("Admin login: admin@cordon.ai / admin123");
  console.log("Vinescapes (admin user): joel@vinescapes.com / dealer123");
  console.log("Vinescapes (standard user): sam@vinescapes.com / dealer123");
  console.log("Northfield Vineyard Services: alex@northfield.com / dealer123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
