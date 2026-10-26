-- ========================================================
-- SpecsUp - Optical Care Complete Supabase PostgreSQL Setup
-- Run this script in your Supabase SQL Editor
-- ========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean existing tables (if re-running)
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS frames CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. Create Tables
CREATE TABLE users (
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

CREATE TABLE frames (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    frame_id VARCHAR(36) NOT NULL REFERENCES frames(id) ON DELETE RESTRICT,
    reservation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prescriptions (
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

CREATE TABLE sessions (
    token VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Indexes
CREATE INDEX idx_prescriptions_customer_date ON prescriptions(customer_id, checkup_date DESC);
CREATE INDEX idx_reservations_customer ON reservations(customer_id);
CREATE INDEX idx_frames_quantity ON frames(quantity);

-- 5. Seed Users (Password hash for 'admin123' and 'password123' with salt 'specsup_salt_2026')
-- Hash for 'admin123': SHA256('specsup_salt_2026:admin123') = 952a2656fe2d7ea762ba0b0051e70dff10ff4413e11ae8832a823bbdcaea3c95
-- Hash for 'password123': SHA256('specsup_salt_2026:password123') = 1b05dcfa3beec1e7c53d0e2e210103bb1f5c6c22cb832a901928091ecda5c6cb

INSERT INTO users (id, name, email, password_hash, role, phone, dob, address) VALUES
('u-admin', 'Shop Admin', 'admin@specsup.com', '952a2656fe2d7ea762ba0b0051e70dff10ff4413e11ae8832a823bbdcaea3c95', 'admin', '+91 98765 43210', '1985-05-15', 'SpecsUp Optical Shop, MG Road, Mumbai'),
('u-rahul', 'Rahul Sharma', 'rahul@gmail.com', '1b05dcfa3beec1e7c53d0e2e210103bb1f5c6c22cb832a901928091ecda5c6cb', 'customer', '+91 98201 11223', '1998-04-12', 'A-402, Sunshine Heights, Andheri West, Mumbai'),
('u-ananya', 'Ananya Patel', 'ananya@gmail.com', '1b05dcfa3beec1e7c53d0e2e210103bb1f5c6c22cb832a901928091ecda5c6cb', 'customer', '+91 98332 44556', '1996-09-25', '12, Nilgiri Enclave, Satellite, Ahmedabad'),
('u-vikram', 'Vikram Singh', 'vikram@gmail.com', '1b05dcfa3beec1e7c53d0e2e210103bb1f5c6c22cb832a901928091ecda5c6cb', 'customer', '+91 99110 77889', '2001-11-03', 'Plot 55, Sector 14, Gurgaon'),
('u-neha', 'Neha Gupta', 'neha@gmail.com', '1b05dcfa3beec1e7c53d0e2e210103bb1f5c6c22cb832a901928091ecda5c6cb', 'customer', '+91 98112 33445', '1994-01-30', 'Flat 3B, Lakeview Apts, Koramangala, Bengaluru');

-- 6. Seed Optical Frames
INSERT INTO frames (id, name, brand, price, image_url, quantity, description) VALUES
('f-1', 'Titan Classic Wayfarer', 'Titan Eyeplus', 2499.00, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80', 4, 'Timeless black wayfarer crafted with premium lightweight acetate for everyday durability.'),
('f-2', 'Ray-Ban Clubmaster Retro', 'Ray-Ban', 5999.00, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80', 2, 'Iconic semi-rimless browline frame in tortoiseshell and gold accents.'),
('f-3', 'Fastrack Urban Aviator', 'Fastrack', 1899.00, 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=600&q=80', 5, 'Ultra-sleek gunmetal stainless steel aviator frame with adjustable silicon nose pads.'),
('f-4', 'Vogue Chic Round', 'Vogue Eyewear', 3499.00, 'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80', 3, 'Modern circular silhouette in polished rose gold, perfect for petite faces.'),
('f-5', 'Oakley Holbrook Sport', 'Oakley', 6499.00, 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=600&q=80', 1, 'Ergonomic O-Matter stress-resistant frame built for active sports and outdoor lifestyle.'),
('f-6', 'John Jacobs Havana Square', 'John Jacobs', 3999.00, 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=600&q=80', 6, 'Rich Italian acetate frame with hand-polished bevelled edges and flexible spring hinges.'),
('f-7', 'Carrera Speedway Pilot', 'Carrera', 4799.00, 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=600&q=80', 0, 'Distinctive double-bridge pilot frame with Carrera signature C monogram on the bridge (Out of stock demonstration).'),
('f-8', 'Polaroid Eco Cat-Eye', 'Polaroid', 2799.00, 'https://images.unsplash.com/photo-1582142839970-2b93cbacbe4b?auto=format&fit=crop&w=600&q=80', 3, 'Sustainable bio-based polyamide cat-eye frame in translucent slate grey.');

-- 7. Seed Prescriptions (Rahul - Progressive Myopia)
INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes) VALUES
('rx-r1', 'u-rahul', '2024-01-10', -1.25, -0.25, 90, 31.5, -1.50, -0.50, 85, 31.0, 'Mild eye strain after screen usage. Baseline examination.'),
('rx-r2', 'u-rahul', '2025-01-15', -1.50, -0.50, 90, 31.5, -1.75, -0.50, 85, 31.0, 'Complained of slight blurriness when driving at night.'),
('rx-r3', 'u-rahul', '2026-01-20', -2.00, -0.75, 90, 32.0, -2.25, -0.75, 85, 31.0, 'Progressive myopic shift confirmed. Anti-glare coating prescribed.');

-- Seed Prescriptions (Ananya - Stable)
INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes) VALUES
('rx-a1', 'u-ananya', '2024-03-05', -0.75, -0.25, 180, 30.5, -0.75, -0.25, 175, 30.5, 'Routine first visit. Comfortable with existing power.'),
('rx-a2', 'u-ananya', '2025-03-10', -0.75, -0.25, 180, 30.5, -0.75, -0.25, 175, 30.5, 'Annual checkup. No changes in visual acuity observed.'),
('rx-a3', 'u-ananya', '2026-03-12', -0.75, -0.25, 180, 30.5, -0.75, -0.25, 175, 30.5, 'Prescription remains rock-solid stable. Frame updated.');

-- Seed Prescriptions (Vikram - Single checkup)
INSERT INTO prescriptions (id, customer_id, checkup_date, right_sph, right_cyl, right_axis, right_pd, left_sph, left_cyl, left_axis, left_pd, notes) VALUES
('rx-v1', 'u-vikram', '2026-02-14', -1.00, 0.00, 0, 32.0, -1.00, 0.00, 0, 32.0, 'Initial college checkup. Recommended follow-up in 12 months.');

-- Seed Reservations
INSERT INTO reservations (id, customer_id, frame_id, reservation_date) VALUES
('res-1', 'u-rahul', 'f-1', '2026-09-20 11:30:00'),
('res-2', 'u-ananya', 'f-2', '2026-09-22 14:10:00');
