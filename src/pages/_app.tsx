import SiteHeader from "@/components/layout/SiteHeader";
import { characterTableAtom } from "@/atoms/atoms";
import { CharacterTable } from "@/classes/database/CharacterTable";
import "@/styles/globals.css";
import { useAtom } from "jotai";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import Head from "next/head";

export default function App({ Component, pageProps, router }: AppProps) {
  const [characterTable, setCharacterTable] = useAtom(characterTableAtom);

  useEffect(() => {

    const Initialize = async () => {
      setCharacterTable(new CharacterTable());
    }

    Initialize();
  }, []);

  const inApp = router.pathname === "/app" || router.pathname.startsWith("/dm/");

  return (
    <div className="h-full w-full">
      <Head>
        <title>PokemonDND Generator | pokemon.victorsingh.ca</title>
      </Head>
      {inApp ? (
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
          <SiteHeader inApp />
          <main className="flex-1 min-w-0 flex flex-col">
            <Component {...pageProps} />
          </main>
        </div>
      ) : <Component {...pageProps} />}
      <Toaster />
    </div>
  );
}
