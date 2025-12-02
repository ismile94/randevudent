-- Fix staff specialty column type to TEXT[]
-- Bu migration, staff tablosundaki specialty alanını TEXT'den TEXT[]'e dönüştürür
-- Eğer zaten TEXT[] ise, sadece temizlik yapar

DO $$
DECLARE
  col_type text;
  col_udt_name text;
BEGIN
  -- Kolon tipini kontrol et (array tipleri için udt_name kullan)
  SELECT data_type, udt_name INTO col_type, col_udt_name
  FROM information_schema.columns 
  WHERE table_name = 'staff' 
  AND column_name = 'specialty';
  
  -- Eğer kolon TEXT ise, TEXT[]'e dönüştür
  IF col_type = 'text' THEN
    -- Önce string değerleri array'e dönüştür (boş string'leri NULL yap)
    UPDATE staff
    SET specialty = CASE 
      WHEN specialty IS NULL THEN NULL
      WHEN trim(specialty::text) = '' THEN NULL
      ELSE ARRAY[trim(specialty::text)]
    END
    WHERE specialty IS NOT NULL;
    
    -- Şimdi kolon tipini değiştir
    ALTER TABLE staff 
    ALTER COLUMN specialty TYPE TEXT[] USING 
      CASE 
        WHEN specialty IS NULL THEN NULL::TEXT[]
        WHEN trim(specialty::text) = '' THEN NULL::TEXT[]
        ELSE ARRAY[trim(specialty::text)]::TEXT[]
      END;
  ELSE
    -- Eğer zaten TEXT[] ise (ARRAY tipi veya _text udt_name), sadece temizlik yap
    -- Boş array'leri ve geçersiz değerleri NULL yap
    -- Hata olursa (kolon tipi farklıysa), hiçbir şey yapma
    BEGIN
      UPDATE staff
      SET specialty = NULL
      WHERE specialty IS NOT NULL 
      AND (
        array_length(specialty, 1) IS NULL 
        OR array_length(specialty, 1) = 0
        OR (array_length(specialty, 1) = 1 AND trim(specialty[1]) = '')
      );
    EXCEPTION WHEN OTHERS THEN
      -- Eğer hata alırsak (örneğin kolon tipi farklıysa), hiçbir şey yapma
      RAISE NOTICE 'Specialty column is not TEXT[] type, skipping cleanup';
    END;
  END IF;
END $$;
