import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_live_test():
    print("==================================================")
    print("  RUNNING LIVE FULL-STACK END-TO-END FLOW TEST")
    print("==================================================")

    # 1. Health check
    res = requests.get(f"{BASE_URL}/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. Backend Server is LIVE and healthy.")

    # 2. Customer Registration
    user_payload = {
        "name": "Kavita Rao",
        "email": "kavita.rao@example.com",
        "password": "mypassword123"
    }
    # Clean up if existed from previous run
    res = requests.post(f"{BASE_URL}/api/auth/register", json=user_payload)
    if res.status_code == 400 and "already exists" in res.text:
        # Already registered, log in
        res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": user_payload["email"],
            "password": user_payload["password"]
        })
    assert res.status_code == 200, f"Registration/Login failed: {res.text}"
    cust_data = res.json()
    cust_token = cust_data["token"]
    cust_id = cust_data["user"]["id"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print(f"[PASS] 2. Customer registered/logged in: {cust_data['user']['name']} (ID: {cust_id})")

    # 3. Customer Profile Update
    res = requests.put(f"{BASE_URL}/api/customers/me", json={
        "phone": "+91 91234 56789",
        "dob": "1997-08-20",
        "address": "42, Palm Avenue, Pune"
    }, headers=cust_headers)
    assert res.status_code == 200, res.text
    assert res.json()["phone"] == "+91 91234 56789"
    print("[PASS] 3. Customer profile updated successfully.")

    # 4. View Available Frames
    res = requests.get(f"{BASE_URL}/api/frames")
    assert res.status_code == 200
    frames = res.json()
    assert len(frames) > 0
    in_stock_frame = next(f for f in frames if f["quantity"] > 0)
    initial_stock = in_stock_frame["quantity"]
    print(f"[PASS] 4. Storefront browsed: '{in_stock_frame['name']}' has {initial_stock} units in stock.")

    # 5. Customer Pre-books Frame
    res = requests.post(f"{BASE_URL}/api/reservations", json={"frame_id": in_stock_frame["id"]}, headers=cust_headers)
    assert res.status_code == 200, res.text
    print(f"[PASS] 5. Frame pre-booked successfully.")

    # Verify stock decremented
    res = requests.get(f"{BASE_URL}/api/frames")
    updated_frame = next(f for f in res.json() if f["id"] == in_stock_frame["id"])
    assert updated_frame["quantity"] == initial_stock - 1
    print(f"[PASS] 6. Atomic stock verification: {initial_stock} -> {updated_frame['quantity']}")

    # 6. Customer Views Their Reservations
    res = requests.get(f"{BASE_URL}/api/reservations/me", headers=cust_headers)
    assert res.status_code == 200
    my_res = res.json()
    assert any(r["frame_id"] == in_stock_frame["id"] for r in my_res)
    print(f"[PASS] 7. Reservation visible in customer profile ({len(my_res)} active bookings).")

    # 7. Check Analysis with 0 prescriptions
    res = requests.get(f"{BASE_URL}/api/prescriptions/me/analysis", headers=cust_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "insufficient_data"
    print("[PASS] 8. Empty prescription state handled correctly.")

    # 8. Admin Login
    res = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@specsup.com",
        "password": "admin123"
    })
    assert res.status_code == 200
    admin_token = res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] 9. Admin logged in successfully (role: admin).")

    # 9. Admin adds First Checkup for this Customer
    rx1_payload = {
        "checkup_date": "2024-06-15",
        "right_sph": -1.00,
        "right_cyl": -0.25,
        "right_axis": 90,
        "right_pd": 31.0,
        "left_sph": -1.25,
        "left_cyl": -0.50,
        "left_axis": 85,
        "left_pd": 30.5,
        "notes": "First examination at SpecsUp."
    }
    res = requests.post(f"{BASE_URL}/api/admin/customers/{cust_id}/prescriptions", json=rx1_payload, headers=admin_headers)
    assert res.status_code == 201, res.text
    print("[PASS] 10. Admin added first checkup (2024-06-15).")

    # 10. Admin adds Second Checkup (1 year later, showing progression)
    rx2_payload = {
        "checkup_date": "2025-06-20",
        "right_sph": -1.50,
        "right_cyl": -0.50,
        "right_axis": 90,
        "right_pd": 31.0,
        "left_sph": -1.75,
        "left_cyl": -0.75,
        "left_axis": 85,
        "left_pd": 31.0,
        "notes": "Annual checkup. Mild progression."
    }
    res = requests.post(f"{BASE_URL}/api/admin/customers/{cust_id}/prescriptions", json=rx2_payload, headers=admin_headers)
    assert res.status_code == 201, res.text
    print("[PASS] 11. Admin added second checkup (2025-06-20).")

    # 11. Customer checks Prescription Analysis (Trend + Dynamic Date)
    res = requests.get(f"{BASE_URL}/api/prescriptions/me/analysis", headers=cust_headers)
    assert res.status_code == 200
    analysis = res.json()
    assert analysis["status"] == "success"
    assert analysis["trend_classification"] == "Increasing"
    assert analysis["recommended_checkup_date"] is not None
    assert analysis["trend"]["right_sph"] < 0
    print(f"[PASS] 12. Prescription trend calculated: {analysis['trend_classification']}, Next Checkup: {analysis['recommended_checkup_date']}")

    # 12. Customer Downloads Prescription PDF
    res = requests.get(f"{BASE_URL}/api/prescriptions/me/pdf", headers=cust_headers)
    assert res.status_code == 200
    assert "application/pdf" in res.headers.get("content-type", "")
    assert len(res.content) > 1500
    print(f"[PASS] 13. Downloaded Medical Prescription PDF ({len(res.content)} bytes).")

    # 13. Admin checks all reservations
    res = requests.get(f"{BASE_URL}/api/admin/reservations", headers=admin_headers)
    assert res.status_code == 200
    all_res = res.json()
    assert any(r["customer_id"] == cust_id for r in all_res)
    print(f"[PASS] 14. Admin reservations dashboard verified ({len(all_res)} total reservations).")

    print("==================================================")
    print("  ALL 14 LIVE END-TO-END FLOW TESTS PASSED!       ")
    print("==================================================")

if __name__ == "__main__":
    run_live_test()
