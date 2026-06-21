# Supabase Database Sync Script

Copy and run the following SQL script in your **Supabase SQL Editor** to add the missing columns to the `dropout.students` table. This ensures all ML features (such as stress index and parent education) and prediction outcomes (probability and risk level) are successfully synchronized and persisted in the database.

```sql
-- 1. Add missing ML features to the students table
ALTER TABLE dropout.students ADD COLUMN IF NOT EXISTS stress_index NUMERIC(3,1) DEFAULT 3.0 NOT NULL;
ALTER TABLE dropout.students ADD COLUMN IF NOT EXISTS parent_education TEXT DEFAULT 'High School' NOT NULL;

-- 2. Add prediction columns to store ML calculations
ALTER TABLE dropout.students ADD COLUMN IF NOT EXISTS dropout_probability NUMERIC(5,4);
ALTER TABLE dropout.students ADD COLUMN IF NOT EXISTS risk_level TEXT;

-- 3. (Optional) Update existing students with default values for stress index and parent education
UPDATE dropout.students SET stress_index = 3.0 WHERE stress_index IS NULL;
UPDATE dropout.students SET parent_education = 'High School' WHERE parent_education IS NULL;
```

### Why this is required:
1. **ML Feature Consistency**: Features like `stress_index` and `parent_education` are critical inputs for the Random Forest model. Without these columns, the app cannot persist or retrieve these values from the database, causing predictions to fall back on default values.
2. **Dashboard Inconsistency Resolution**: Storing `dropout_probability` and `risk_level` directly in the database allows the dashboard cards, doughnut charts, and paginated lists to fetch the latest prediction results directly from Supabase instead of recalculating locally on-the-fly.
