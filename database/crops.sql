CREATE TABLE crops (
    c_id SERIAL PRIMARY KEY,
    c_name VARCHAR(255) NOT NULL,
    c_type VARCHAR(100) NOT NULL,
    exp_harvest TIMESTAMP WITH TIME ZONE NOT NULL,
    planted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_harvested BOOLEAN DEFAULT 'FALSE',
    harvest_income DECIMAL(15, 2),
    harvest_size DECIMAL(10, 2),
    total_profit DECIMAL(15, 2),
    exp_harvest_size DECIMAL(10, 2) NOT NULL,
    crop_photo_url VARCHAR(500),
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    field_id INTEGER NOT NULL REFERENCES fields(f_id) ON DELETE CASCADE
);

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

CREATE TABLE crop_fertilizers (
    id SERIAL PRIMARY KEY,
    crop_id INTEGER NOT NULL REFERENCES crops(c_id) ON DELETE CASCADE,
    fert_id INTEGER NOT NULL REFERENCES fertilizers(fert_id) ON DELETE CASCADE,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quantity_used DECIMAL(8, 2),
    CONSTRAINT uq_crop_fertilizer UNIQUE (crop_id, fert_id)
);

CREATE TABLE crop_pesticides (
    id SERIAL PRIMARY KEY,
    crop_id INTEGER NOT NULL REFERENCES crops(c_id) ON DELETE CASCADE,
    pesticide_id INTEGER NOT NULL REFERENCES pesticides(p_id) ON DELETE CASCADE,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    quantity_used DECIMAL(8, 2),
    CONSTRAINT uq_crop_pesticide UNIQUE (crop_id, pesticide_id)
);