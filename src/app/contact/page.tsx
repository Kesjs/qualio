import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16 text-gray-900 dark:text-white">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee6018]">Qualio</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Parler de vos avis clients</h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-gray-600 dark:text-zinc-300">
        Une question sur la collecte, l’import de vos avis ou leur transformation en décisions ? Écrivez-nous.
      </p>
      <a
        className="mt-8 inline-flex min-h-11 w-fit items-center rounded-xl bg-[#ee6018] px-5 text-sm font-semibold text-white transition hover:bg-[#d95312] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee6018] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101114]"
        href="mailto:hello@qualio.dev"
      >
        Écrire à l’équipe
      </a>
      <Link className="mt-6 text-sm font-semibold text-gray-600 underline underline-offset-4 dark:text-zinc-300" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
