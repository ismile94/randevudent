"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClinicLoginPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to main login page
    router.push('/login');
  }, [router]);

  return null;
}

