import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-20 text-center text-xs text-slate-500 font-light space-y-2">
      <p>© 2025 RandevuDent. Türkiye'de daha iyi sağlık hizmetine adanmış bir platform.</p>
      <div className="flex justify-center gap-4 flex-wrap">
        <Link href="/privacy" className="hover:text-slate-300 transition">
          Gizlilik Politikası
        </Link>
        <span>•</span>
        <Link href="/kvkk" className="hover:text-slate-300 transition">
          KVKK Bilgilendirme
        </Link>
        <span>•</span>
        <Link href="/contact" className="hover:text-slate-300 transition">
          İletişim
        </Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-slate-300 transition">
          Kullanım Şartları
        </Link>
      </div>
    </footer>
  );
}

