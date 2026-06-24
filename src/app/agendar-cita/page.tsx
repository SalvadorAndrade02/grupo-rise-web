import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { LeadForm } from "@/components/forms/LeadForm";
import { prisma } from "@/lib/prisma";

export default async function ScheduleAppointmentPage() {
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
              type="CITA"
              title="Agendar una cita"
              description="Déjanos tus datos y un asesor de Grupo Rise se pondrá en contacto contigo para confirmar la fecha y sucursal."
              branches={branches}
            />
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}