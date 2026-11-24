import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import HomeAbout from "@/components/HomeAbout";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Head>
        <title>PokemonDND | Your next tabletop adventure</title>
        <meta name="description" content="Create trainers and customize Pokémon for your tabletop adventures." />
      </Head>
      <header className="border-b border-slate-800">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="flex items-center gap-3 text-xl font-black tracking-tight">
            <span aria-hidden="true" className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-slate-950 bg-red-500 ring-2 ring-slate-400"><span className="absolute bottom-0 h-1/2 w-full bg-white"/><span className="absolute h-1 w-full bg-slate-950"/><span className="z-10 h-3 w-3 rounded-full border-2 border-slate-950 bg-white"/></span>
            Pokémon<span className="-ml-3 text-yellow-400">DND</span>
          </Link>
          <div className="flex items-center gap-5 text-sm font-semibold">
            <a href="#features" className="hidden text-slate-300 hover:text-white sm:block">Features</a>
            <Link href="/app" className="rounded-lg border border-slate-700 px-4 py-2 hover:border-yellow-400 hover:text-yellow-400">Open app <span aria-hidden="true">↗</span></Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="relative overflow-hidden border-b border-slate-800">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-slate-950"/>
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:py-24 lg:grid-cols-2 lg:py-28">
            <div>
              <p className="mb-6 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-yellow-300">Pokémon meets tabletop RPGs</p>
              <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">Your world.<br/>Your team.<br/><span className="text-yellow-400">Your adventure.</span></h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">Create trainers, build custom Pokémon teams and bring your next tabletop session to life with tools designed for players and Dungeon Masters.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/app" className="rounded-xl bg-yellow-400 px-6 py-4 font-bold text-slate-950 transition hover:bg-yellow-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-yellow-400">Start your adventure <span aria-hidden="true">→</span></Link>
                <a href="#features" className="rounded-xl border border-slate-700 px-6 py-4 font-semibold hover:bg-slate-800">Explore features</a>
              </div>
              <p className="mt-5 text-sm text-slate-400">Free to use · No account required · Saved in this browser</p>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div aria-hidden="true" className="absolute inset-10 rounded-full bg-blue-500/20 blur-3xl"/>
              <div className="relative aspect-square w-full"><Image src="/pokemon-splash.png" alt="Pokémon ready for adventure" fill priority sizes="(max-width: 1024px) 90vw, 50vw" className="object-contain"/></div>
            </div>
          </div>
        </section>
        <HomeAbout />
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-center sm:p-12">
            <h2 className="text-3xl font-black tracking-tight">Ready for your next session?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">Create a trainer and start building your Pokémon team today.</p>
            <Link href="/app" className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 font-bold text-slate-950 hover:bg-yellow-300">Launch PokemonDND →</Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-400">PokemonDND · Unofficial fan-made tabletop tool. Not affiliated with Nintendo or The Pokémon Company.</footer>
    </div>
  );
}
