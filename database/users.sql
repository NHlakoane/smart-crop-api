CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    names VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(200) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    gender VARCHAR(45) CHECK (gender IN ('female', 'male')) NOT NULL,
    role VARCHAR(10) DEFAULT 'farmer' CHECK (role IN ('farmer', 'manager', 'admin')) NOT NULL,
    is_active BOOLEAN DEFAULT 'TRUE',
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS user_addresses (
    id SERIAL PRIMARY KEY,
    userId INT REFERENCES users(user_id) ON DELETE CASCADE,
    street_address TEXT NOT NULL,
    suburb VARCHAR(45) NOT NULL,
    city VARCHAR(45) NOT NULL,
    province VARCHAR(45) NOT NULL,
    country VARCHAR(45) DEFAULT 'South Africa' NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

