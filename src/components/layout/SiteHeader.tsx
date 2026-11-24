import Link from "next/link";

export default function SiteHeader({ inApp = false }: { inApp?: boolean }) {
  return (
      <header className="border-b border-slate-800">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="flex items-center gap-3 text-xl font-black tracking-tight">
            <span aria-hidden="true" className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-slate-950 bg-red-500 ring-2 ring-slate-400"><span className="absolute bottom-0 h-1/2 w-full bg-white"/><span className="absolute h-1 w-full bg-slate-950"/><span className="z-10 h-3 w-3 rounded-full border-2 border-slate-950 bg-white"/></span>
            Pokémon<span className="-ml-3 text-yellow-400">DND</span>
          </Link>
          <div className="flex items-center gap-5 text-sm font-semibold">
            <Link href="/#features" className="hidden text-slate-300 hover:text-white sm:block">Features</Link>
            <Link href="/app" className="rounded-lg border border-slate-700 px-4 py-2 hover:border-yellow-400 hover:text-yellow-400">{inApp ? "Characters" : "Open app"} <span aria-hidden="true">↗</span></Link>
          </div>
        </nav>
      </header>
  );
}
