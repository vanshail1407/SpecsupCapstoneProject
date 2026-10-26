-- ========================================================
-- SpecsUp - Optical Care Database Schema (Supabase / PostgreSQL)
-- ========================================================

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    phone VARCHAR(20),
    dob VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. FRAMES TABLE
CREATE TABLE IF NOT EXISTS frames (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    description TEXT,
    lens_width_mm NUMERIC(5, 1),
    lens_height_mm NUMERIC(5, 1),
    bridge_width_mm NUMERIC(5, 1),
    frame_shape VARCHAR(50),
    frame_material VARCHAR(50),
    frame_status VARCHAR(20) DEFAULT 'active' CHECK (frame_status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. RESERVATIONS TABLE
CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    frame_id VARCHAR(36) NOT NULL REFERENCES frames(id) ON DELETE RESTRICT,
    reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. PRESCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    checkup_date DATE NOT NULL,
    right_sph NUMERIC(4, 2) NOT NULL,
    right_cyl NUMERIC(4, 2) NOT NULL,
    right_axis INTEGER NOT NULL CHECK (right_axis >= 0 AND right_axis <= 180),
    right_pd NUMERIC(4, 1) NOT NULL,
    left_sph NUMERIC(4, 2) NOT NULL,
    left_cyl NUMERIC(4, 2) NOT NULL,
    left_axis INTEGER NOT NULL CHECK (left_axis >= 0 AND left_axis <= 180),
    left_pd NUMERIC(4, 1) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prescriptions_customer_date ON prescriptions(customer_id, checkup_date DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
CREATE INDEX IF NOT EXISTS idx_frames_quantity ON frames(quantity);
