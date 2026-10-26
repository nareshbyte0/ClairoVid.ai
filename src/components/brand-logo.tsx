import Link from "next/link";

export function BrandLogo({ href, label }: { href: string; label: string }) {
  return <Link className="brand brandLogo" href={href} aria-label={label}>
    <span className="brandMark" aria-hidden="true">▶</span>
    <span className="brandText">Clairo<span>Vid</span><small>.ai</small></span>
  </Link>;
}
