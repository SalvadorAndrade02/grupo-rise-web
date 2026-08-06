import Link from "next/link";
import { ArrowRight } from "lucide-react";

const colombiaPath =
  "M299 274.6 294.7 277.4 290.2 263.9 283.8 256.6 276.2 264.5 231.5 264 231.8 278.4 245.2 280.8 244.5 289.5 239.9 287.2 227 291 226.8 307.6 237 316 240.6 329.1 229.8 402 218.3 389.8 211.4 389.3 226.2 365.9 208.6 355.2 194.9 357.1 186.6 353.2 173.9 359.2 156.9 356.4 143.3 332.3 132.7 326.4 125.4 315.6 110.1 304.7 104 306.9 82.9 293.8 76.4 297.5 56.9 294.3 51.4 284.4 47.1 284.8 24.1 271.7 21 264.6 29.6 262.8 28.6 251.4 33.9 243 45.3 241.5 63.8 215 55.3 209.6 59.6 196.3 54.5 175.3 59.4 169.3 55.8 149.8 46.5 137.6 49.4 126.5 56.8 128.1 61.1 121.3 55.8 107.8 58.6 104.4 70.4 105.2 87.7 89.1 97.1 86.7 101.6 59.7 114.7 49.1 129.2 48.6 131 43.9 149 45.8 176 29.1 187.1 18 195.2 19.4 201.2 25.4 196.8 33.2 182 37 176.2 48.5 167.3 55.1 160.7 63.6 157.8 80 151.5 93.4 163.3 94.9 166.3 105.5 171.3 110.5 173.1 119.8 170.4 128.2 171.2 133 176.9 134.9 182.3 143 211.8 140.7 225.2 143.7 241.3 163.4 250.6 161 267.1 162.2 280.2 159.6 288.3 163.5 284.2 175.9 279.1 183.6 277.3 200 281.9 215.3 288.4 222.1 289.2 227.2 277.6 238.7 285.9 243.7 292 251.7 299 274.6Z";

export function ColombiaPresenceMap() {
  return (
    <Link
      href="/colombia"
      aria-label="Ver presencia de Grupo RISE en Colombia"
      className="group flex h-full flex-col border border-white/10 bg-white/[0.025] transition hover:border-white/25 hover:bg-white/[0.045]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
            Colombia
          </p>
          <p className="mt-1 text-sm font-bold text-white">
            Indian Motorcycle Bogotá
          </p>
        </div>

        <ArrowRight
          size={17}
          className="text-white/35 transition group-hover:translate-x-1 group-hover:text-white"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
        <svg
          viewBox="0 0 320 420"
          role="img"
          aria-label="Mapa de Colombia con presencia de Grupo RISE en Bogotá"
          className="mx-auto h-auto w-full max-w-[220px]"
        >
          <title>Presencia de Grupo RISE en Bogotá, Colombia</title>

          <path
            d={colombiaPath}
            fill="#f4f6f5"
            stroke="#090d12"
            strokeWidth="3"
            strokeLinejoin="round"
            className="transition duration-200 group-hover:fill-[var(--public-accent)]"
          />

          <circle
            cx="145"
            cy="120"
            r="7"
            fill="var(--public-accent)"
            stroke="#090d12"
            strokeWidth="3"
          />
        </svg>

        <div className="mt-5 border-t border-white/10 pt-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
            Bogotá · Colombia
          </p>
          <p className="mt-2 text-xs leading-5 text-white/40">
            Conoce la presencia de Indian Motorcycle en Colombia.
          </p>
        </div>
      </div>
    </Link>
  );
}
