
import Link from "next/link";

<header className="bg-black text-white p-3 sticky top-0 z-50">
  <div className="max-w-[1300px] mx-auto flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Link href="/" className="font-black text-xl">
        mmmali<span className="text-orange-500">.</span>
      </Link>

      <div className="hidden md:flex gap-3 text-[11px]">
        <Link href="/catalogue">CATALOGUE PRO</Link>
        <Link href="/fabricants">FABRICANTS</Link>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Link
        href="/vendre"
        className="bg-orange-500 text-black px-4 py-2 rounded-full font-black text-xs"
      >
        + VENDRE
      </Link>

      <Link
        href="/compte"
        className="bg-white text-black px-4 py-2 rounded-full font-black text-xs"
      >
        COMPTE
      </Link>
    </div>
  </div>

  {/* Menu visible sur téléphone */}
  <div className="md:hidden flex gap-2 mt-3 overflow-x-auto">
    <Link
      href="/vendre"
      className="bg-orange-500 text-black px-4 py-1.5 rounded-full font-black text-[11px] whitespace-nowrap"
    >
      + VENDRE PHOTO/VIDEO
    </Link>

    <Link
      href="/catalogue"
      className="border border-white/20 px-4 py-1.5 rounded-full text-[11px] whitespace-nowrap"
    >
      CATALOGUE
    </Link>

    <Link
      href="/compte"
      className="border border-white/20 px-4 py-1.5 rounded-full text-[11px] whitespace-nowrap"
    >
      MON COMPTE
    </Link>
  </div>
</header>







