"""
Automated Comprehensive Test Suite for Prescription-Based Smart Frame Recommendations.
Validates 14 mandatory test cases spanning optical physics calculations,
decentration penalties, frame materials, edge thickness rules, API security, and database integration.
"""

import os
import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from app.algorithms.frame_recommendation import (
    calculate_spherical_equivalent,
    classify_prescription,
    evaluate_frame_compatibility,
    recommend_frames,
)
from app.database import connection
from app.services.auth_service import create_session
from fastapi.testclient import TestClient
from app.main import app


class TestOpticalRecommendations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        connection.init_db()
        cls.client = TestClient(app)

    # 1. Spherical Equivalent Calculation
    def test_01_spherical_equivalent(self):
        se1 = calculate_spherical_equivalent(-3.50, -1.00)
        self.assertEqual(se1, -4.00)

        se2 = calculate_spherical_equivalent(+2.00, +1.50)
        self.assertEqual(se2, +2.75)

        se3 = calculate_spherical_equivalent(-0.50, -0.50)
        self.assertEqual(se3, -0.75)
        print("[PASS] Test 1: Spherical Equivalent Calculation verified.")

    # 2. Prescription Classification
    def test_02_prescription_classification(self):
        cat1, dom1 = classify_prescription(-4.50, -3.00, -1.0, 0.0)
        self.assertEqual(cat1, "strong_minus")
        self.assertEqual(dom1, -4.50)

        cat2, dom2 = classify_prescription(+3.00, +2.50, 0.0, 0.0)
        self.assertEqual(cat2, "moderate_plus")
        self.assertEqual(dom2, +3.00)

        cat3, dom3 = classify_prescription(-0.50, -0.75, 0.0, 0.0)
        self.assertEqual(cat3, "mild")
        print("[PASS] Test 2: Prescription classification verified.")

    # 3. High Myopia favors compact width and acetate
    def test_03_high_myopia_rules(self):
        rx = {
            "right_sph": -4.50, "right_cyl": -1.00, "right_axis": 90, "right_pd": 31.5,
            "left_sph": -4.00, "left_cyl": -0.75, "left_axis": 90, "left_pd": 31.5
        }
        # Frame A: compact (49mm), acetate, well-centered (49+18 = 67, PD=63, decentration 4mm)
        frame_compact = {
            "name": "Compact Acetate", "brand": "BrandA", "price": 2000,
            "lens_width_mm": 49.0, "lens_height_mm": 37.0, "bridge_width_mm": 18.0,
            "frame_shape": "Rectangular", "frame_material": "Acetate"
        }
        res_a = evaluate_frame_compatibility(rx, frame_compact)
        self.assertIn(res_a["compatibility"], ["highly_recommended", "recommended"])
        self.assertTrue(any("Compact lens width" in r for r in res_a["reasons"]))
        self.assertTrue(any("Acetate/plastic" in r for r in res_a["reasons"]))

        # Frame B: wide (56mm), rimless
        frame_wide_rimless = {
            "name": "Wide Rimless", "brand": "BrandB", "price": 2500,
            "lens_width_mm": 56.0, "lens_height_mm": 44.0, "bridge_width_mm": 18.0,
            "frame_shape": "Rectangular", "frame_material": "Rimless"
        }
        res_b = evaluate_frame_compatibility(rx, frame_wide_rimless)
        self.assertIn(res_b["compatibility"], ["suitable", "caution"])
        self.assertTrue(any("rimless" in w.lower() for w in res_b["warnings"]))
        self.assertTrue(any("thickness" in w.lower() for w in res_b["warnings"]))
        self.assertGreater(res_a["score"], res_b["score"])
        print("[PASS] Test 3: High myopia rules (width & material penalties) verified.")

    # 4. Moderate Myopia rules
    def test_04_moderate_myopia_rules(self):
        rx = {
            "right_sph": -2.50, "right_cyl": -0.50, "right_axis": 90, "right_pd": 31.0,
            "left_sph": -2.25, "left_cyl": -0.50, "left_axis": 90, "left_pd": 31.0
        }
        frame_mod = {
            "name": "Standard Acetate", "brand": "BrandA", "price": 1800,
            "lens_width_mm": 51.0, "lens_height_mm": 38.0, "bridge_width_mm": 17.0,
            "frame_shape": "Square", "frame_material": "Acetate"
        }
        res = evaluate_frame_compatibility(rx, frame_mod)
        self.assertGreaterEqual(res["score"], 80.0)
        print("[PASS] Test 4: Moderate myopia rules verified.")

    # 5. High Hyperopia favors compact width to minimize center thickness
    def test_05_high_hyperopia_rules(self):
        rx = {
            "right_sph": +4.50, "right_cyl": 0.0, "right_axis": 0, "right_pd": 31.0,
            "left_sph": +4.00, "left_cyl": 0.0, "left_axis": 0, "left_pd": 31.0
        }
        frame_compact = {
            "name": "Compact Plus", "brand": "BrandA", "price": 2200,
            "lens_width_mm": 48.0, "lens_height_mm": 36.0, "bridge_width_mm": 17.0,
            "frame_shape": "Round", "frame_material": "Acetate"
        }
        frame_oversized = {
            "name": "Oversized Plus", "brand": "BrandB", "price": 2200,
            "lens_width_mm": 56.0, "lens_height_mm": 46.0, "bridge_width_mm": 18.0,
            "frame_shape": "Square", "frame_material": "Metal"
        }
        res_compact = evaluate_frame_compatibility(rx, frame_compact)
        res_oversized = evaluate_frame_compatibility(rx, frame_oversized)

        self.assertGreater(res_compact["score"], res_oversized["score"])
        self.assertTrue(any("center" in w.lower() or "thickness" in w.lower() for w in res_oversized["warnings"]))
        print("[PASS] Test 5: High hyperopia center thickness rules verified.")

    # 6. Mild prescription flexibility
    def test_06_mild_prescription_versatility(self):
        rx = {
            "right_sph": -0.75, "right_cyl": -0.25, "right_axis": 90, "right_pd": 32.0,
            "left_sph": -0.50, "left_cyl": -0.25, "left_axis": 90, "left_pd": 32.0
        }
        frame_wide = {
            "name": "Aviator Metal", "brand": "Ray-Ban", "price": 3500,
            "lens_width_mm": 54.0, "lens_height_mm": 42.0, "bridge_width_mm": 16.0,
            "frame_shape": "Aviator", "frame_material": "Metal"
        }
        res = evaluate_frame_compatibility(rx, frame_wide)
        self.assertGreaterEqual(res["score"], 80.0)
        self.assertTrue(any("Mild prescription" in r for r in res["reasons"]))
        print("[PASS] Test 6: Mild prescription versatility verified.")

    # 7. Decentration Penalty test
    def test_07_high_decentration_penalty(self):
        # Patient PD = 58mm (narrow)
        rx = {
            "right_sph": -3.00, "right_cyl": 0.0, "right_axis": 0, "right_pd": 29.0,
            "left_sph": -3.00, "left_cyl": 0.0, "left_axis": 0, "left_pd": 29.0
        }
        # Frame PD = 55 + 20 = 75mm (Huge decentration = 17mm, > 9mm)
        frame_wide_bridge = {
            "name": "Wide Bridge Frame", "brand": "BrandX", "price": 2000,
            "lens_width_mm": 55.0, "lens_height_mm": 40.0, "bridge_width_mm": 20.0,
            "frame_shape": "Rectangular", "frame_material": "Acetate"
        }
        res = evaluate_frame_compatibility(rx, frame_wide_bridge)
        self.assertLess(res["score"], 70.0)
        self.assertTrue(any("decentration" in w.lower() for w in res["warnings"]))
        self.assertEqual(res["optical_metrics"]["decentration_mm"], 17.0)
        print("[PASS] Test 7: High decentration penalty and calculation verified.")

    # 8. Decentration Bonus test
    def test_08_ideal_decentration_bonus(self):
        # Patient PD = 66mm
        rx = {
            "right_sph": -2.00, "right_cyl": 0.0, "right_axis": 0, "right_pd": 33.0,
            "left_sph": -2.00, "left_cyl": 0.0, "left_axis": 0, "left_pd": 33.0
        }
        # Frame PD = 50 + 17 = 67mm (|67 - 66| = 1mm <= 3mm ideal)
        frame_ideal_pd = {
            "name": "Ideal Match Frame", "brand": "BrandY", "price": 2000,
            "lens_width_mm": 50.0, "lens_height_mm": 37.0, "bridge_width_mm": 17.0,
            "frame_shape": "Rectangular", "frame_material": "Acetate"
        }
        res = evaluate_frame_compatibility(rx, frame_ideal_pd)
        self.assertGreaterEqual(res["score"], 90.0)
        self.assertTrue(any("Ideal optical centering" in r for r in res["reasons"]))
        print("[PASS] Test 8: Ideal decentration bonus verified.")

    # 9. Missing Dimensions Marked 'not_assessed'
    def test_09_unassessed_missing_measurements(self):
        rx = {
            "right_sph": -2.00, "right_cyl": 0.0, "right_axis": 0, "right_pd": 32.0,
            "left_sph": -2.00, "left_cyl": 0.0, "left_axis": 0, "left_pd": 32.0
        }
        unassessed_frame = {
            "name": "Unmeasured Frame", "brand": "BrandZ", "price": 1500,
            "lens_width_mm": None, "lens_height_mm": None, "bridge_width_mm": None,
            "frame_shape": "Round", "frame_material": "Metal"
        }
        res = evaluate_frame_compatibility(rx, unassessed_frame)
        self.assertIsNone(res["score"])
        self.assertEqual(res["compatibility"], "not_assessed")
        self.assertEqual(res["compatibility_label"], "Not Assessed")
        self.assertTrue(any("not recorded" in r for r in res["reasons"]))
        print("[PASS] Test 9: Unassessed frame handling verified.")

    # 10. Frame Ranking & Ordering (Assessed desc, unassessed at bottom)
    def test_10_recommend_frames_ordering(self):
        rx = {
            "right_sph": -4.00, "right_cyl": -1.0, "right_axis": 90, "right_pd": 31.0,
            "left_sph": -4.00, "left_cyl": -1.0, "left_axis": 90, "left_pd": 31.0
        }
        frames = [
            {"id": "1", "name": "F1", "brand": "B", "price": 100, "lens_width_mm": None, "lens_height_mm": None, "bridge_width_mm": None},
            {"id": "2", "name": "F2", "brand": "B", "price": 100, "lens_width_mm": 56.0, "lens_height_mm": 45.0, "bridge_width_mm": 20.0, "frame_material": "Rimless"},
            {"id": "3", "name": "F3", "brand": "B", "price": 100, "lens_width_mm": 49.0, "lens_height_mm": 37.0, "bridge_width_mm": 17.0, "frame_material": "Acetate"},
        ]
        results = recommend_frames(rx, frames)
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]["frame"]["id"], "3")  # F3 best score
        self.assertEqual(results[1]["frame"]["id"], "2")  # F2 lower score
        self.assertEqual(results[2]["frame"]["id"], "1")  # F1 unassessed at bottom
        self.assertIsNone(results[2]["score"])
        print("[PASS] Test 10: Recommendation ordering (assessed desc, unassessed at bottom) verified.")

    # 11. API Endpoint GET /api/frames/recommended for customer with prescription
    def test_11_api_recommended_authenticated_customer(self):
        # Rahul has high myopia prescriptions in seed data
        rahul = connection.fetch_one("SELECT * FROM users WHERE email = 'rahul@gmail.com'")
        token = create_session(rahul["id"])

        response = self.client.get(
            "/api/frames/recommended",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIsNotNone(data["latest_prescription"])
        self.assertIsNotNone(data["patient_summary"])
        self.assertGreater(len(data["recommendations"]), 0)
        self.assertTrue(len(data["disclaimer"]) > 20)

        # Ensure active in-stock frames only (quantity > 0)
        for item in data["recommendations"]:
            self.assertGreater(item["frame"]["quantity"], 0)
            self.assertEqual(item["frame"]["frame_status"], "active")
        print("[PASS] Test 11: GET /api/frames/recommended for customer verified.")

    # 12. API Endpoint for customer without prescription
    def test_12_api_recommended_customer_without_prescription(self):
        # Create a temporary user with no prescription
        test_email = "no_rx_user@specsup.test"
        existing = connection.fetch_one("SELECT id FROM users WHERE email = ?", (test_email,))
        if not existing:
            user_id = "test-no-rx-user-id"
            connection.execute(
                "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
                (user_id, "No Rx User", test_email, "hash", "customer")
            )
        else:
            user_id = existing["id"]

        token = create_session(user_id)
        response = self.client.get(
            "/api/frames/recommended",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "no_prescription")
        self.assertIn("No prescription record found", data["message"])
        self.assertEqual(len(data["recommendations"]), 0)
        print("[PASS] Test 12: GET /api/frames/recommended for customer without prescription verified.")

    # 13. Security / IDOR: Customer ID derived strictly from token
    def test_13_security_token_identity(self):
        # Attacker tries to pass customer_id via query param or headers
        ananya = connection.fetch_one("SELECT * FROM users WHERE email = 'ananya@gmail.com'")
        token = create_session(ananya["id"])

        # Try to pass rahul's ID in query
        rahul = connection.fetch_one("SELECT * FROM users WHERE email = 'rahul@gmail.com'")
        response = self.client.get(
            f"/api/frames/recommended?customer_id={rahul['id']}",
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # The returned prescription must strictly belong to Ananya, NOT Rahul
        self.assertEqual(data["latest_prescription"]["customer_id"], ananya["id"])
        self.assertNotEqual(data["latest_prescription"]["customer_id"], rahul["id"])
        print("[PASS] Test 13: IDOR prevention verified - user identity strictly bound to token.")

    # 14. Admin Frame Create & Update with Dimensions
    def test_14_admin_frame_crud_dimensions(self):
        admin = connection.fetch_one("SELECT * FROM users WHERE email = 'admin@specsup.com'")
        token = create_session(admin["id"])

        new_frame = {
            "name": "Smart Titanium Aero",
            "brand": "Titan",
            "price": 3299.0,
            "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80",
            "quantity": 8,
            "description": "Ultra light titanium frame",
            "lens_width_mm": 51.0,
            "lens_height_mm": 37.5,
            "bridge_width_mm": 18.0,
            "frame_shape": "Rectangular",
            "frame_material": "Titanium",
            "frame_status": "active"
        }
        # Create
        create_res = self.client.post(
            "/api/admin/frames",
            json=new_frame,
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(create_res.status_code, 201)
        created_data = create_res.json()
        self.assertEqual(created_data["lens_width_mm"], 51.0)
        self.assertEqual(created_data["bridge_width_mm"], 18.0)
        self.assertEqual(created_data["frame_material"], "Titanium")

        # Update
        update_res = self.client.put(
            f"/api/admin/frames/{created_data['id']}",
            json={"lens_width_mm": 52.0, "frame_material": "Acetate"},
            headers={"Authorization": f"Bearer {token}"}
        )
        self.assertEqual(update_res.status_code, 200)
        updated_data = update_res.json()
        self.assertEqual(updated_data["lens_width_mm"], 52.0)
        self.assertEqual(updated_data["frame_material"], "Acetate")

        # Clean up
        self.client.delete(
            f"/api/admin/frames/{created_data['id']}",
            headers={"Authorization": f"Bearer {token}"}
        )
        print("[PASS] Test 14: Admin frame create & update with optical dimensions verified.")


if __name__ == "__main__":
    unittest.main()
