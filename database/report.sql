CREATE TABLE reports (
    r_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    field_id INTEGER NOT NULL REFERENCES fields(f_id) ON DELETE CASCADE,
    crop_id INTEGER NOT NULL REFERENCES crops(c_id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL CHECK (stage IN ('Pre-Harvest', 'Post-Harvest')),
    soil_moisture DECIMAL(5, 2),
    soil_condition_notes TEXT,
    pest_outbreak BOOLEAN NOT NULL DEFAULT false,
    photo_url VARCHAR(500),
    soil_nutrients_level DECIMAL(5, 2),
    crop_duration_days INTEGER CHECK (crop_duration_days > 0),
    report_summary TEXT NOT NULL,
    date_issued TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_field_id ON reports(field_id);
CREATE INDEX idx_reports_crop_id ON reports(crop_id);
CREATE INDEX idx_reports_stage ON reports(stage);
CREATE INDEX idx_reports_date_issued ON reports(date_issued);
CREATE INDEX idx_reports_pest_outbreak ON reports(pest_outbreak);