import AboutCard from "./AboutCard";

const features = [
  { title: "Create trainers", description: "Build multiple characters and switch between their individual Pokémon teams.", symbol: "01" },
  { title: "Generate Pokémon", description: "Turn species data into playable Pokémon with tabletop stats and level-based options.", symbol: "02" },
  { title: "Customize movesets", description: "Choose moves and abilities to suit your team and your campaign.", symbol: "03" },
  { title: "Track your team", description: "View Pokémon details and manage hit points during your sessions.", symbol: "04" },
  { title: "Prepare faster", description: "Keep character and Pokémon information together instead of juggling separate sheets.", symbol: "05" },
  { title: "Pick up where you left off", description: "Your characters are stored locally in your browser, ready for your next session.", symbol: "06" },
];

export default function HomeAbout() {
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-8 px-6 py-20">
      <p className="text-sm font-bold uppercase tracking-widest text-yellow-400">Your tabletop toolkit</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Less prep. More adventure.</h2>
      <p className="mt-4 max-w-2xl text-slate-400">Everything you need to start building and managing your Pokémon team.</p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(feature => <AboutCard key={feature.title} {...feature} />)}
      </div>
    </section>
  );
}
