import Link from "next/link";

export default function NonTrouvee() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#fafaf7] p-6 text-center text-black">
      <div>
        <p className="text-6xl font-black">404</p>
        <h1 className="mt-2 text-2xl font-black">Page introuvable</h1>
        <p className="mt-2 opacity-60">Cette page n&apos;existe pas ou a été déplacée.</p>
        <Link href="/" className="mt-5 inline-block rounded-full bg-black px-6 py-3 font-black text-white">Retour à la boutique</Link>
      </div>
    </div>
  );
}
