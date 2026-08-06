import { MapPin } from "lucide-react";
import { ColombiaPresenceMap } from "./ColombiaPresenceMap";
import { MexicoPresenceMap } from "./MexicoPresenceMap";

export function RegionalPresenceMap() {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center border border-white/15 bg-white/[0.05] text-white">
          <MapPin size={16} />
        </span>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
            Presencia Grupo RISE
          </p>
          <p className="mt-1 text-sm font-bold text-white/55">
            México y Colombia
          </p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_0.75fr]">
        <MexicoPresenceMap />
        <ColombiaPresenceMap />
      </div>
    </section>
  );
}
