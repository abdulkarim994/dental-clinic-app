-- ============================================================
-- Phase 2: Normalized Database Schema for 500K+ Users
-- Dental Clinic Management System
-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- 1. RECORDS TABLE — dental treatment records
CREATE TABLE IF NOT EXISTS records (
  id BIGINT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  clinic TEXT,
  service TEXT,
  payment TEXT,
  is_debt BOOLEAN DEFAULT FALSE,
  phone TEXT,
  notes TEXT,
  appointment TEXT,
  report JSONB,
  is_debt_payment BOOLEAN DEFAULT FALSE,
  debt_id BIGINT,
  debt_payment_type TEXT,
  _mod BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROSTHETICS TABLE — prosthetic/crown/bridge records
CREATE TABLE IF NOT EXISTS prosthetics (
  id BIGINT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  lab_value NUMERIC(12,2) DEFAULT 0,
  doctor_share NUMERIC(12,2) DEFAULT 0,
  clinic_share NUMERIC(12,2) DEFAULT 0,
  payment TEXT,
  clinic TEXT,
  is_debt BOOLEAN DEFAULT FALSE,
  lab_status TEXT,
  lab_sent_date TEXT,
  lab_expected_date TEXT,
  appointment TEXT,
  report JSONB,
  _mod BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DEBTS TABLE — patient debts
CREATE TABLE IF NOT EXISTS debts (
  id BIGINT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  type TEXT DEFAULT 'regular',
  status TEXT DEFAULT 'unpaid',
  total_amount NUMERIC(12,2) DEFAULT 0,
  lab_value NUMERIC(12,2) DEFAULT 0,
  lab_paid NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  remaining NUMERIC(12,2) DEFAULT 0,
  doctor_earned NUMERIC(12,2) DEFAULT 0,
  payment TEXT,
  clinic TEXT,
  record_id BIGINT,
  prosthetic_id BIGINT,
  settled BOOLEAN DEFAULT FALSE,
  _mod BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DEBT_PAYMENTS TABLE — installment payments for debts
CREATE TABLE IF NOT EXISTS debt_payments (
  id BIGINT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id BIGINT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  payment TEXT,
  _mod BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. APPOINTMENTS TABLE — patient appointments
CREATE TABLE IF NOT EXISTS appointments (
  id BIGINT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  service TEXT,
  date DATE NOT NULL,
  time TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  _mod BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. USER_CONFIG TABLE — user settings/configuration
CREATE TABLE IF NOT EXISTS user_config (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  config JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. XRAY_IMAGES TABLE — patient x-ray metadata
CREATE TABLE IF NOT EXISTS xray_images (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  file_name TEXT,
  r2_key TEXT NOT NULL,
  thumbnail_url TEXT,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES — Performance optimization for 500K+ users
-- ============================================================

-- Records indexes
CREATE INDEX IF NOT EXISTS idx_records_user_id ON records(user_id);
CREATE INDEX IF NOT EXISTS idx_records_user_date ON records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_records_user_name ON records(user_id, name);

-- Prosthetics indexes
CREATE INDEX IF NOT EXISTS idx_prosthetics_user_id ON prosthetics(user_id);
CREATE INDEX IF NOT EXISTS idx_prosthetics_user_date ON prosthetics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_prosthetics_user_name ON prosthetics(user_id, name);

-- Debts indexes
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_settled ON debts(user_id, settled);
CREATE INDEX IF NOT EXISTS idx_debts_user_name ON debts(user_id, name);

-- Debt payments indexes
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_user_id ON debt_payments(user_id);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON appointments(user_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_user_name ON appointments(user_id, name);

-- X-ray indexes
CREATE INDEX IF NOT EXISTS idx_xray_images_user_id ON xray_images(user_id);
CREATE INDEX IF NOT EXISTS idx_xray_images_user_patient ON xray_images(user_id, patient_name);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Data isolation per user
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prosthetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE xray_images ENABLE ROW LEVEL SECURITY;

-- Records policies
CREATE POLICY "Users can view own records" ON records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own records" ON records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own records" ON records
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own records" ON records
  FOR DELETE USING (auth.uid() = user_id);

-- Prosthetics policies
CREATE POLICY "Users can view own prosthetics" ON prosthetics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prosthetics" ON prosthetics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prosthetics" ON prosthetics
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prosthetics" ON prosthetics
  FOR DELETE USING (auth.uid() = user_id);

-- Debts policies
CREATE POLICY "Users can view own debts" ON debts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debts" ON debts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debts" ON debts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own debts" ON debts
  FOR DELETE USING (auth.uid() = user_id);

-- Debt payments policies
CREATE POLICY "Users can view own debt payments" ON debt_payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debt payments" ON debt_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debt payments" ON debt_payments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own debt payments" ON debt_payments
  FOR DELETE USING (auth.uid() = user_id);

-- Appointments policies
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own appointments" ON appointments
  FOR DELETE USING (auth.uid() = user_id);

-- User config policies
CREATE POLICY "Users can view own config" ON user_config
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own config" ON user_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own config" ON user_config
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own config" ON user_config
  FOR DELETE USING (auth.uid() = user_id);

-- X-ray images policies
CREATE POLICY "Users can view own xrays" ON xray_images
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xrays" ON xray_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own xrays" ON xray_images
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own xrays" ON xray_images
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- ENABLE REALTIME for all tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE records;
ALTER PUBLICATION supabase_realtime ADD TABLE prosthetics;
ALTER PUBLICATION supabase_realtime ADD TABLE debts;
ALTER PUBLICATION supabase_realtime ADD TABLE debt_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE user_config;
