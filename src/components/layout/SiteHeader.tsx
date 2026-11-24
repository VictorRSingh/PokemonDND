import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

export default function SiteHeader({ inApp = false }: { inApp?: boolean }) {
  const { data: session, status } = useSession();
  return (
      <header className="border-b border-slate-800">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="flex items-center gap-3 text-xl font-black tracking-tight">
            <span aria-hidden="true" className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-slate-950 bg-red-500 ring-2 ring-slate-400"><span className="absolute bottom-0 h-1/2 w-full bg-white"/><span className="absolute h-1 w-full bg-slate-950"/><span className="z-10 h-3 w-3 rounded-full border-2 border-slate-950 bg-white"/></span>
            Pokémon<span className="-ml-3 text-yellow-400">DND</span>
          </Link>
          <div className="flex items-center gap-5 text-sm font-semibold">
            <Link href="/#features" className="hidden text-slate-300 hover:text-white sm:block">Features</Link>
            {status === "loading" ? <span role="status" className="text-slate-400">Loading…</span> : session?.user ? (
              <>
                <Link href="/app" className="hover:text-yellow-400">{inApp ? "Characters" : "Dashboard"}</Link>
                <details className="relative z-30">
                  <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-700 px-3 py-2">
                    {session.user.image && <img src={session.user.image} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" />}
                    <span>{session.user.name || "Trainer"}</span><span aria-hidden="true">▾</span>
                  </summary>
                  <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-xl">
                    <Link href="/app" className="block rounded px-3 py-2 hover:bg-slate-800">Dashboard</Link>
                    <button onClick={() => void signOut({ callbackUrl: "/" })} className="w-full rounded px-3 py-2 text-left text-red-400 hover:bg-slate-800">Sign out</button>
                  </div>
                </details>
              </>
            ) : <button onClick={() => void signIn("discord", { callbackUrl: "/app" })} className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">Sign in with Discord</button>}
          </div>
        </nav>
      </header>
  );
}
