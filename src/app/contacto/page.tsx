import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { LeadForm } from "@/components/forms/LeadForm";
import { prisma } from "@/lib/prisma";

export default async function ContactPage() {
  const branches = await prisma.branch.findMany({
    where: {
      active: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        city: "asc",
      },
    ],
    select: {
      id: true,
      name: true,
      city: true,
      state: true,
    },
  });

  return (
    <main className="min-h-screen bg-[var(--rise-bg)] text-[var(--rise-navy)]">
      <Header />

      <section className="py-14">
        <Container>
          <div className="mx-auto max-w-3xl">
            <LeadForm
              type="CONTACTO"
              title="Contáctanos"
              description="Envíanos tus datos y un asesor se comunicará contigo."
              branches={branches}
            />
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}