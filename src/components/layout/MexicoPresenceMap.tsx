"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import Mexico from "@svg-maps/mexico";

type MexicoLocation = {
    id: string;
    name: string;
    path: string;
};

type MexicoMapData = {
    label: string;
    viewBox: string;
    locations: MexicoLocation[];
};

const mexicoMap = Mexico as MexicoMapData;

type PresenceState = {
    name: string;
    aliases: string[];
    href: string;
};

const presenceStates: PresenceState[] = [
    {
        name: "Nuevo León",
        aliases: ["nuevo leon"],
        href: "/sucursales?q=Nuevo%20León",
    },
    {
        name: "Coahuila",
        aliases: [
            "coahuila",
            "coahuila de zaragoza",
        ],
        href: "/sucursales?q=Coahuila",
    },
    {
        name: "Quintana Roo",
        aliases: ["quintana roo"],
        href: "/sucursales?q=Quintana%20Roo",
    },
];

function normalize(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function findPresenceState(locationName: string) {
    const normalizedLocation = normalize(locationName);

    return presenceStates.find((state) =>
        state.aliases.some(
            (alias) =>
                normalize(alias) === normalizedLocation
        )
    );
}

export function MexicoPresenceMap() {
    const router = useRouter();

    function openState(
        state: PresenceState | undefined
    ) {
        if (!state) {
            return;
        }

        router.push(state.href);
    }

    return (
        <section className="mt-8 border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center border border-white/15 bg-white/[0.05] text-white">
                        <MapPin size={16} />
                    </span>

                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                            Presencia Grupo RISE
                        </p>

                        <p className="mt-1 text-sm font-bold text-white">
                            Selecciona un estado
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-5">
                <svg
                    viewBox={mexicoMap.viewBox}
                    role="img"
                    aria-label="Mapa de México con presencia de Grupo RISE"
                    className="h-auto w-full"
                >
                    <title>
                        Selecciona un estado con presencia de Grupo RISE
                    </title>

                    {mexicoMap.locations.map((location: MexicoLocation) => {
                        const state = findPresenceState(
                            location.name
                        );

                        const isAvailable = Boolean(state);

                        return (
                            <path
                                key={location.id}
                                id={location.id}
                                d={location.path}
                                role={isAvailable ? "link" : undefined}
                                tabIndex={isAvailable ? 0 : -1}
                                aria-label={
                                    state
                                        ? `Ver sucursales en ${state.name}`
                                        : location.name
                                }
                                onClick={() => openState(state)}
                                onKeyDown={(event) => {
                                    if (
                                        isAvailable &&
                                        (event.key === "Enter" ||
                                            event.key === " ")
                                    ) {
                                        event.preventDefault();
                                        openState(state);
                                    }
                                }}
                                fill={
                                    isAvailable
                                        ? "#f4f6f5"
                                        : "rgba(255,255,255,0.16)"
                                }
                                stroke={
                                    isAvailable
                                        ? "#090d12"
                                        : "rgba(255,255,255,0.22)"
                                }
                                strokeWidth={isAvailable ? 2.8 : 1}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                className={
                                    isAvailable
                                        ? "cursor-pointer outline-none transition duration-200 hover:fill-[var(--public-accent)] focus:fill-[var(--public-accent)]"
                                        : "pointer-events-none"
                                }
                            />
                        );
                    })}
                </svg>

                <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                    Nuevo León · Coahuila · Quintana Roo
                </p>
            </div>
        </section>
    );
}