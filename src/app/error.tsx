"use client";

export default function Erreur({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#fafaf7] p-6 text-center text-black">
      <div>
        <p className="text-5xl" aria-hidden>⚠️</p>
        <h1 className="mt-2 text-2xl font-black">Un problème est survenu</h1>
        <p className="mt-2 opacity-60">Ce n&apos;est pas de ta faute. Réessaie dans un instant.</p>
        <button onClick={reset} className="mt-5 rounded-full bg-black px-6 py-3 font-black text-white">Réessayer</button>
      </div>
    </div>
  );
}
