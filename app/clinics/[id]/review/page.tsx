"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { addReview } from '@/lib/reviews';
import {
  Star,
  ArrowLeft,
  CheckCircle2,
  X,
} from 'lucide-react';
import ToastContainer, { showToast } from '@/components/Toast';

function ClinicReviewPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      showToast('Lütfen bir puan veriniz', 'error');
      return;
    }
    
    if (!comment.trim()) {
      showToast('Lütfen yorumunuzu yazınız', 'error');
      return;
    }

    if (!user) return;

    setIsSubmitting(true);
    
    const appointmentId = searchParams?.get('appointmentId');
    const clinicId = params?.id as string;

    const result = addReview({
      userId: user.id,
      userName: user.name,
      clinicId,
      rating,
      comment: comment.trim(),
    });

    if (result.success) {
      showToast('Yorumunuz başarıyla eklendi', 'success');
      setTimeout(() => {
        router.push(`/clinics/${clinicId}`);
      }, 1000);
    } else {
      showToast(result.error || 'Bir hata oluştu', 'error');
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <ToastContainer />
      
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-cyan-500/20 to-transparent rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative z-10">
        <Navigation />

        <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
          {/* Back Button */}
          <Link
            href={`/clinics/${params?.id}`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition font-light mb-6"
          >
            <ArrowLeft size={16} />
            Klinik Detayına Dön
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-light mb-2">Yorum Yap</h1>
            <p className="text-slate-400 font-light">
              Deneyiminizi paylaşın ve diğer kullanıcılara yardımcı olun
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <label className="block text-sm font-light text-slate-300 mb-4">
                Puanınız
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1"
                  >
                    <Star
                      size={32}
                      className={
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-slate-600'
                      }
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-4 text-sm text-slate-400 font-light">
                    {rating} / 5
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-6">
              <label className="block text-sm font-light text-slate-300 mb-4">
                Yorumunuz
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg focus:outline-none focus:border-blue-400/50 text-white font-light"
                placeholder="Deneyiminizi paylaşın..."
                rows={6}
                maxLength={500}
              />
              <p className="text-xs text-slate-500 font-light mt-2 text-right">
                {comment.length} / 500
              </p>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting || rating === 0 || !comment.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-lg font-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                Yorumu Gönder
              </button>
              <Link
                href={`/clinics/${params?.id}`}
                className="px-6 py-3 border border-slate-600/50 hover:border-red-400/50 hover:text-red-400 rounded-lg transition font-light flex items-center justify-center"
              >
                <X size={18} />
                İptal
              </Link>
            </div>
          </form>
        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12">
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default function ClinicReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    }>
      <ClinicReviewPageContent />
    </Suspense>
  );
}
