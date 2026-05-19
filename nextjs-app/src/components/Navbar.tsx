import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="text-2xl font-bold text-slate-900">ProductReviews</Link>
        <div className="flex gap-3 text-sm">
          <Link href="/" className="rounded-md px-3 py-2 hover:bg-slate-100">Продукты</Link>
          <Link href="/admin" className="rounded-md px-3 py-2 hover:bg-slate-100">Админка</Link>
        </div>
      </div>
    </nav>
  );
}
