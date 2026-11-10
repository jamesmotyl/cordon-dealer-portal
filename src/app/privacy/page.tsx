import Link from "next/link";
import CordonLogo from "@/components/CordonLogo";
import { LEAD_RETENTION_YEARS, PRIVACY_CONTACT_EMAIL } from "@/lib/config";

export const metadata = { title: "Privacy notice — Cordon Dealer Portal" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-navy">{title}</h2>
      {children}
    </section>
  );
}

export default function PrivacyPage() {
  const contact = PRIVACY_CONTACT_EMAIL ? (
    <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className="text-orange-600 hover:underline">
      {PRIVACY_CONTACT_EMAIL}
    </a>
  ) : (
    "your usual Cordon contact"
  );

  return (
    <div className="min-h-screen bg-navy-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <CordonLogo className="h-8 w-auto" />
          <Link href="/" className="text-sm text-navy-400 hover:text-navy hover:underline">
            Back to the portal
          </Link>
        </div>

        <article className="card space-y-6 p-6 text-sm leading-relaxed text-navy-600">
          <header>
            <h1 className="text-xl font-semibold text-navy">Privacy notice</h1>
            <p className="mt-1 text-navy-400">How the Cordon Dealer Portal uses personal information.</p>
          </header>

          <Section title="Who we are">
            <p>
              Cordon (&ldquo;we&rdquo;) runs this portal so our dealers can register and track sales leads for the
              Loop sprayer. We decide how the information in it is used. For any question about it, contact {contact}.
            </p>
          </Section>

          <Section title="What we hold">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Dealer staff:</strong> name, work email address, and a securely hashed password (we never
                store the password itself).
              </li>
              <li>
                <strong>Leads (prospective customers):</strong> the business&rsquo;s legal name and farm, a contact
                phone number and email, who makes the buying decision, product and quote details, and notes on
                progress. Where a business is run by an individual, this can include their name and contact details.
              </li>
            </ul>
          </Section>

          <Section title="Why, and on what basis">
            <p>
              To run the dealer sales programme: registering leads, checking that two dealers aren&rsquo;t working
              the same farm, tracking progress and preparing quotes. For dealer staff the basis is our agreement with
              their company; for leads it is our legitimate interest in managing sales to business customers. We do
              not use this information for unrelated marketing.
            </p>
          </Section>

          <Section title="Who can see it">
            <p>
              Cordon staff can see everything. A dealer sees only the leads it registered. We don&rsquo;t sell or
              share the information with anyone else, other than the service providers that run the portal for us:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Vercel (website hosting)</li>
              <li>Neon (database, hosted in the UK)</li>
              <li>Postmark (sending sign-in and notification emails)</li>
            </ul>
            <p>
              Some of these providers may process information outside the UK. Where they do, it is under recognised
              safeguards and a data processing agreement with us.
            </p>
          </Section>

          <Section title="How long we keep it">
            <p>
              Leads are kept for {LEAD_RETENTION_YEARS} years after they close, then deleted, unless you ask us to
              delete them sooner. Dealer accounts are removed when the dealer relationship ends or when you ask.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              You can ask us for a copy of your information, to correct it, to delete it, or to stop using it. Contact{" "}
              {contact}. If you&rsquo;re unhappy with how we&rsquo;ve handled it you can complain to the Information
              Commissioner&rsquo;s Office at{" "}
              <a href="https://ico.org.uk" className="text-orange-600 hover:underline">
                ico.org.uk
              </a>
              .
            </p>
          </Section>

          <Section title="For dealers">
            <p>
              Only enter details about genuine sales enquiries, and only what is needed to follow them up. You are
              responsible for having a proper basis, and for telling the business you&rsquo;re passing their details
              to us.
            </p>
          </Section>

          <Section title="Cookies">
            <p>
              The portal uses one cookie, to keep you signed in. It is essential for the site to work, so there is
              nothing to accept. We don&rsquo;t use analytics or advertising cookies.
            </p>
          </Section>
        </article>
      </div>
    </div>
  );
}
