import SiteHeader from "@/components/layout/SiteHeader";
import { characterTableAtom } from "@/atoms/atoms";
import { CharacterTable } from "@/classes/database/CharacterTable";
import "@/styles/globals.css";
import { Provider, useSetAtom } from "jotai";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { SessionProvider, useSession, signIn } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import Head from "next/head";

function CharacterStorage({ userId }: { userId?: string }) {
  const setTable = useSetAtom(characterTableAtom);
  useEffect(() => {
    if (userId) setTable(new CharacterTable(`CharacterTable:${userId}`));
  }, [userId, setTable]);
  return null;
}

function AppContent({ Component, pageProps, router }: AppProps) {
  const { data: session, status } = useSession();
  const userId = status === "authenticated" ? session?.user?.id : undefined;
  const inApp = router.pathname === "/app" || router.pathname.startsWith("/dm/");
  return (
    <Provider key={userId || "signed-out"}>
      <CharacterStorage userId={userId} />
      <div className="h-full w-full">
        <Head><title>PokemonDND Generator | pokemon.victorsingh.ca</title></Head>
        {inApp ? (
          <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
            <SiteHeader inApp />
            <main className="flex-1 min-w-0 flex flex-col">
              {status === "loading" ? <p className="p-8" role="status">Checking session…</p> : userId ? <Component {...pageProps} /> : <button className="m-8 self-center rounded-lg bg-indigo-600 px-5 py-3" onClick={() => void signIn("discord", { callbackUrl: router.asPath })}>Sign in with Discord</button>}
            </main>
          </div>
        ) : <Component {...pageProps} />}
        <Toaster />
      </div>
    </Provider>
  );
}

export default function App(props: AppProps) {
  return <SessionProvider session={props.pageProps.session}><AppContent {...props} /></SessionProvider>;
}
