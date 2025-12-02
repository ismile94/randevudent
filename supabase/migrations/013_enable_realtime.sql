-- Enable Realtime for appointments and appointment_change_requests tables
-- Realtime için REPLICA IDENTITY ayarları

-- Appointments tablosu için Realtime
ALTER TABLE appointments REPLICA IDENTITY FULL;

-- Appointment change requests tablosu için Realtime
ALTER TABLE appointment_change_requests REPLICA IDENTITY FULL;

-- Not: Supabase Dashboard'dan da Realtime'ı aktifleştirmeniz gerekebilir:
-- Dashboard > Database > Replication > Enable Realtime for tables

