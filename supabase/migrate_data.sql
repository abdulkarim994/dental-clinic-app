-- ============================================================
-- Data Migration: user_data (JSON blobs) → Normalized Tables
-- Run this AFTER running migration.sql
-- This migrates existing data from the old structure
-- ============================================================

-- Migrate records from month documents
DO $$
DECLARE
  row RECORD;
  month_data JSONB;
  rec JSONB;
BEGIN
  FOR row IN SELECT * FROM user_data WHERE data_type = 'months' AND data IS NOT NULL
  LOOP
    month_data := row.data::jsonb;

    -- Migrate records
    IF month_data ? 'records' THEN
      FOR rec IN SELECT * FROM jsonb_array_elements(month_data->'records')
      LOOP
        INSERT INTO records (id, user_id, date, name, amount, clinic, service, payment,
          is_debt, phone, notes, appointment, report, is_debt_payment, debt_id,
          debt_payment_type, _mod)
        VALUES (
          (rec->>'id')::bigint,
          row.user_id,
          COALESCE((rec->>'date')::date, CURRENT_DATE),
          COALESCE(rec->>'name', ''),
          COALESCE((rec->>'amount')::numeric, 0),
          rec->>'clinic',
          rec->>'service',
          rec->>'payment',
          COALESCE((rec->>'isDebt')::boolean, false),
          rec->>'phone',
          rec->>'notes',
          rec->>'appointment',
          CASE WHEN rec ? 'report' AND rec->'report' IS NOT NULL THEN rec->'report' ELSE NULL END,
          COALESCE((rec->>'isDebtPayment')::boolean, false),
          (rec->>'debtId')::bigint,
          rec->>'debtPaymentType',
          (rec->>'_mod')::bigint
        )
        ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;

    -- Migrate prosthetics
    IF month_data ? 'prosthetics' THEN
      FOR rec IN SELECT * FROM jsonb_array_elements(month_data->'prosthetics')
      LOOP
        INSERT INTO prosthetics (id, user_id, date, name, total, lab_value,
          doctor_share, clinic_share, payment, clinic, is_debt,
          lab_status, lab_sent_date, lab_expected_date, appointment, report, _mod)
        VALUES (
          (rec->>'id')::bigint,
          row.user_id,
          COALESCE((rec->>'date')::date, CURRENT_DATE),
          COALESCE(rec->>'name', ''),
          COALESCE((rec->>'total')::numeric, 0),
          COALESCE((rec->>'labValue')::numeric, 0),
          COALESCE((rec->>'doctorShare')::numeric, 0),
          COALESCE((rec->>'clinicShare')::numeric, 0),
          rec->>'payment',
          rec->>'clinic',
          COALESCE((rec->>'isDebt')::boolean, false),
          rec->>'labStatus',
          rec->>'labSentDate',
          rec->>'labExpectedDate',
          rec->>'appointment',
          CASE WHEN rec ? 'report' AND rec->'report' IS NOT NULL THEN rec->'report' ELSE NULL END,
          (rec->>'_mod')::bigint
        )
        ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- Migrate debts
DO $$
DECLARE
  row RECORD;
  debts_data JSONB;
  debt JSONB;
  inst JSONB;
BEGIN
  FOR row IN SELECT * FROM user_data WHERE data_type = 'debts' AND data IS NOT NULL
  LOOP
    debts_data := row.data::jsonb;
    IF debts_data ? 'debts' THEN
      FOR debt IN SELECT * FROM jsonb_array_elements(debts_data->'debts')
      LOOP
        INSERT INTO debts (id, user_id, date, name, phone, notes, type, status,
          total_amount, lab_value, lab_paid, paid_amount, remaining, doctor_earned,
          payment, clinic, record_id, prosthetic_id, settled, _mod)
        VALUES (
          (debt->>'id')::bigint,
          row.user_id,
          COALESCE((debt->>'date')::date, CURRENT_DATE),
          COALESCE(debt->>'name', ''),
          debt->>'phone',
          debt->>'notes',
          COALESCE(debt->>'type', 'regular'),
          COALESCE(debt->>'status', 'unpaid'),
          COALESCE((debt->>'totalAmount')::numeric, (debt->>'total')::numeric, 0),
          COALESCE((debt->>'labValue')::numeric, 0),
          COALESCE((debt->>'labPaid')::numeric, 0),
          COALESCE((debt->>'paidAmount')::numeric, 0),
          COALESCE((debt->>'remaining')::numeric, 0),
          COALESCE((debt->>'doctorEarned')::numeric, 0),
          debt->>'payment',
          debt->>'clinic',
          (debt->>'recordId')::bigint,
          (debt->>'prostheticId')::bigint,
          COALESCE((debt->>'settled')::boolean, debt->>'status' = 'paid'),
          (debt->>'_mod')::bigint
        )
        ON CONFLICT (id) DO NOTHING;

        -- Migrate installments as debt_payments
        IF debt ? 'installments' THEN
          FOR inst IN SELECT * FROM jsonb_array_elements(debt->'installments')
          LOOP
            INSERT INTO debt_payments (id, user_id, debt_id, amount, date, payment, _mod)
            VALUES (
              (inst->>'id')::bigint,
              row.user_id,
              (debt->>'id')::bigint,
              COALESCE((inst->>'amount')::numeric, 0),
              COALESCE((inst->>'date')::date, CURRENT_DATE),
              inst->>'payment',
              (inst->>'_mod')::bigint
            )
            ON CONFLICT (id) DO NOTHING;
          END LOOP;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- Migrate appointments
DO $$
DECLARE
  row RECORD;
  appt_data JSONB;
  appt JSONB;
BEGIN
  FOR row IN SELECT * FROM user_data WHERE data_type = 'appointments' AND data IS NOT NULL
  LOOP
    appt_data := row.data::jsonb;
    IF appt_data ? 'items' THEN
      FOR appt IN SELECT * FROM jsonb_array_elements(appt_data->'items')
      LOOP
        INSERT INTO appointments (id, user_id, name, phone, service, date, time, notes, status, _mod)
        VALUES (
          (appt->>'id')::bigint,
          row.user_id,
          COALESCE(appt->>'name', ''),
          appt->>'phone',
          appt->>'service',
          COALESCE((appt->>'date')::date, CURRENT_DATE),
          appt->>'time',
          appt->>'notes',
          COALESCE(appt->>'status', 'pending'),
          (appt->>'_mod')::bigint
        )
        ON CONFLICT (id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- Migrate config
DO $$
DECLARE
  row RECORD;
BEGIN
  FOR row IN SELECT * FROM user_data WHERE data_type = 'config' AND data IS NOT NULL
  LOOP
    INSERT INTO user_config (user_id, config, updated_at)
    VALUES (row.user_id, row.data::jsonb, NOW())
    ON CONFLICT (user_id) DO UPDATE SET config = EXCLUDED.config, updated_at = NOW();
  END LOOP;
END $$;

-- Migrate x-ray images from config
DO $$
DECLARE
  row RECORD;
  cfg JSONB;
  patient TEXT;
  xray JSONB;
BEGIN
  FOR row IN SELECT * FROM user_data WHERE data_type = 'config' AND data IS NOT NULL
  LOOP
    cfg := row.data::jsonb;
    IF cfg ? 'patientXrays' THEN
      FOR patient IN SELECT * FROM jsonb_object_keys(cfg->'patientXrays')
      LOOP
        FOR xray IN SELECT * FROM jsonb_array_elements(cfg->'patientXrays'->patient)
        LOOP
          INSERT INTO xray_images (user_id, patient_name, file_name, r2_key, date)
          VALUES (
            row.user_id,
            patient,
            xray->>'name',
            COALESCE(xray->>'key', ''),
            (xray->>'date')::date
          );
        END LOOP;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- Verification: Check migration results
-- ============================================================
SELECT 'records' AS table_name, COUNT(*) AS row_count FROM records
UNION ALL
SELECT 'prosthetics', COUNT(*) FROM prosthetics
UNION ALL
SELECT 'debts', COUNT(*) FROM debts
UNION ALL
SELECT 'debt_payments', COUNT(*) FROM debt_payments
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'user_config', COUNT(*) FROM user_config
UNION ALL
SELECT 'xray_images', COUNT(*) FROM xray_images;
