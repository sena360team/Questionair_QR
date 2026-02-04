-- Add consent_heading column to forms table
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS consent_heading TEXT;

-- Add comment
COMMENT ON COLUMN forms.consent_heading IS 'หัวข้อ Consent (e.g., การยินยอม, ข้อตกลง, Terms & Conditions)';
