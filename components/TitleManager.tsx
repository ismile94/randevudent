"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const BASE_TITLE = "RandevuDiş";

function getPageTitle(pathname: string): string {
  const staticTitles: Record<string, string> = {
    "/": "",
    "/login": "Giriş Yap",
    "/register": "Üye Ol",
    "/forgot-password": "Şifremi Unuttum",
    "/reset-password": "Şifre Sıfırla",
    "/verify-email": "E-posta Doğrulama",
    "/email-verified": "E-posta Onayı",
    "/dashboard": "Hasta Paneli",
    "/profile": "Profil",
    "/appointments": "Randevularım",
    "/appointments/find": "Randevu Ara",
    "/appointments/book": "Randevu Al",
    "/clinics": "Klinikler",
    "/clinic-register": "Klinik Kayıt",
    "/clinic/login": "Klinik Giriş",
    "/clinic/dashboard": "Klinik Paneli",
    "/clinic/appointments": "Klinik Randevuları",
    "/clinic/patients": "Klinik Hastaları",
    "/clinic/staff": "Klinik Personeli",
    "/clinic/settings": "Klinik Ayarları",
    "/clinic/settings/password": "Klinik Şifre Değiştir",
    "/auth/auth-code-error": "Doğrulama Hatası",
  };

  if (staticTitles[pathname] !== undefined) return staticTitles[pathname];

  if (/^\/appointments\/[^/]+\/cancel$/.test(pathname)) return "Randevu İptal";
  if (/^\/appointments\/[^/]+\/edit$/.test(pathname)) return "Randevu Düzenle";
  if (/^\/appointments\/[^/]+$/.test(pathname)) return "Randevu Detayı";

  if (/^\/clinic\/appointments\/[^/]+\/edit$/.test(pathname)) return "Klinik Randevu Düzenle";
  if (/^\/clinic\/appointments\/[^/]+$/.test(pathname)) return "Klinik Randevu Detayı";
  if (/^\/clinic\/patients\/[^/]+$/.test(pathname)) return "Hasta Detayı";

  if (/^\/clinics\/[^/]+\/review$/.test(pathname)) return "Klinik Yorumu";
  if (/^\/clinics\/[^/]+$/.test(pathname)) return "Klinik Detayı";

  if (/^\/doctors\/[^/]+\/review$/.test(pathname)) return "Doktor Yorumu";
  if (/^\/doctors\/[^/]+$/.test(pathname)) return "Doktor Detayı";

  return "Sayfa";
}

export default function TitleManager() {
  const pathname = usePathname();

  useEffect(() => {
    const pageTitle = getPageTitle(pathname || "/");
    document.title = pageTitle ? `${BASE_TITLE} - ${pageTitle}` : BASE_TITLE;
  }, [pathname]);

  return null;
}
