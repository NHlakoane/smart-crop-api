CREATE TABLE fertilizers (
    fert_id SERIAL PRIMARY KEY,
    fert_name VARCHAR(255) NOT NULL,
    npk_ratio VARCHAR(20) NOT NULL,
    size_kg DECIMAL(8, 2) NOT NULL CHECK (size_kg > 0),
    description TEXT,
    manufacturer VARCHAR(255),
    application_rate DECIMAL(6, 2) CHECK (application_rate > 0),
    expiration_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_fertilizers_manufacturer ON fertilizers(manufacturer);
CREATE INDEX idx_fertilizers_expiration_date ON fertilizers(expiration_date);