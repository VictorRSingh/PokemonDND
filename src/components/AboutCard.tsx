interface AboutCardProps {
  title: string;
  description: string;
  symbol?: string;
}

export default function AboutCard({ title, description, symbol }: AboutCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-7 transition hover:border-slate-600">
      {symbol && <span aria-hidden="true" className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-400/10 text-sm font-bold text-yellow-400">{symbol}</span>}
      <h3 className="text-xl font-bold text-slate-100">{title}</h3>
      <p className="mt-3 leading-relaxed text-slate-400">{description}</p>
    </article>
  );
}
