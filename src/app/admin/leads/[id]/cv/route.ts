import { NextResponse } from "next/server";

import {
    getAdminSession,
} from "@/lib/admin-auth";

import {
    readJobApplicationCv,
} from "@/lib/job-application-uploads";

import { prisma } from "@/lib/prisma";

type CvRouteProps = {
    params: Promise<{
        id: string;
    }>;
};

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: CvRouteProps
) {
    const adminSession =
        await getAdminSession();

    if (!adminSession) {
        return NextResponse.redirect(
            new URL(
                "/admin-login",
                request.url
            )
        );
    }

    const { id } = await params;
    const leadId = Number(id);

    if (
        !Number.isInteger(leadId) ||
        leadId <= 0
    ) {
        return new Response(
            "Solicitud inválida",
            {
                status: 400,
            }
        );
    }

    const lead =
        await prisma.lead.findUnique({
            where: {
                id: leadId,
            },

            select: {
                cvStoredName: true,
                cvOriginalName: true,
                cvMimeType: true,
            },
        });

    if (
        !lead?.cvStoredName
    ) {
        return new Response(
            "Currículum no encontrado",
            {
                status: 404,
            }
        );
    }

    try {
        const file =
            await readJobApplicationCv(
                lead.cvStoredName
            );

        const originalName =
            lead.cvOriginalName ||
            "curriculum.pdf";

        return new Response(
            new Uint8Array(file),
            {
                headers: {
                    "Content-Type":
                        lead.cvMimeType ||
                        "application/pdf",

                    "Content-Disposition":
                        `attachment; filename*=UTF-8''${encodeURIComponent(
                            originalName
                        )}`,

                    "Cache-Control":
                        "private, no-store",

                    "X-Content-Type-Options":
                        "nosniff",
                },
            }
        );
    } catch {
        return new Response(
            "Currículum no encontrado",
            {
                status: 404,
            }
        );
    }
}