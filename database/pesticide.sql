CREATE TABLE pesticides (
    p_id SERIAL PRIMARY KEY,
    p_name VARCHAR(255) NOT NULL,
    pesticide_type VARCHAR(100) NOT NULL,
    size DECIMAL(8, 2) NOT NULL CHECK (size > 0),
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_pesticides_user_id ON pesticides(user_id);
CREATE INDEX idx_pesticides_pesticide_type ON pesticides(pesticide_type);