-- TC Kimlik Numarası için Unique Constraint
-- Bu migration, tc_number alanına unique constraint ekler
-- Böylece bir TC kimlik numarası sadece bir hesapta kullanılabilir
-- Not: NULL değerler unique constraint'e dahil edilmez (PostgreSQL default davranışı)

-- Önce mevcut duplicate tc_number değerlerini kontrol et ve temizle (eğer varsa)
-- NULL olmayan ve birden fazla kez kullanılan tc_number değerlerini bul
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Duplicate tc_number sayısını kontrol et
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT tc_number, COUNT(*) as cnt
    FROM users
    WHERE tc_number IS NOT NULL
    GROUP BY tc_number
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Uyarı: % adet duplicate TC kimlik numarası bulundu. Lütfen manuel olarak temizleyin.', duplicate_count;
  END IF;
END $$;

-- Unique constraint ekle (NULL değerler için partial index kullanarak)
-- Bu, sadece NULL olmayan değerler için unique kontrolü yapar
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_tc_number_unique 
ON users(tc_number) 
WHERE tc_number IS NOT NULL;

-- Alternatif olarak, eğer tüm tc_number değerleri (NULL dahil) unique olmasını istiyorsanız:
-- ALTER TABLE users ADD CONSTRAINT users_tc_number_unique UNIQUE (tc_number);
-- Ancak bu durumda sadece bir kullanıcının tc_number'ı NULL olabilir, bu istenmeyen bir durum olabilir

