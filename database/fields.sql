CREATE TABLE fields (
    f_id SERIAL PRIMARY KEY,
    f_name VARCHAR(255) NOT NULL,
    soil_type VARCHAR(100) NOT NULL,
    max_farmers INTEGER NOT NULL CHECK (max_farmers > 0),
    area DECIMAL(10, 2) NOT NULL CHECK (area > 0),
    perimeter DECIMAL(10, 2) NOT NULL CHECK (perimeter > 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    field_photo_url VARCHAR(500),
    last_harvest_date TIMESTAMP WITH TIME ZONE,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_fields_available ON fields(is_available);
CREATE INDEX idx_fields_soil_type ON fields(soil_type);
CREATE INDEX idx_fields_last_harvest ON fields(last_harvest_date);