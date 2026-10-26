from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_complete_backend():
    print("--- 1. Testing Health & Public Endpoints ---")
    res = client.get("/")
    assert res.status_code == 200, res.text
    print("[PASS] Root health endpoint OK")

    res = client.get("/api/frames")
    assert res.status_code == 200
    frames = res.json()
    assert len(frames) >= 8
    print(f"[PASS] Public frames endpoint OK ({len(frames)} frames found)")

    print("--- 2. Testing Authentication ---")
    # Customer Login
    res = client.post("/api/auth/login", json={
        "email": "rahul@gmail.com",
        "password": "password123"
    })
    assert res.status_code == 200, res.text
    cust_data = res.json()
    cust_token = cust_data["token"]
    assert cust_data["user"]["role"] == "customer"
    print("[PASS] Customer login successful (role: customer)")

    # Admin Login
    res = client.post("/api/auth/login", json={
        "email": "admin@specsup.com",
        "password": "admin123"
    })
    assert res.status_code == 200, res.text
    admin_data = res.json()
    admin_token = admin_data["token"]
    assert admin_data["user"]["role"] == "admin"
    print("[PASS] Admin login successful (role: admin)")

    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    print("--- 3. Testing Role-Based Security ---")
    # Customer attempting to access admin route
    res = client.get("/api/admin/frames", headers=cust_headers)
    assert res.status_code == 403, f"Expected 403, got {res.status_code}"
    print("[PASS] Role security verified: Customer blocked from admin API (403 Forbidden)")

    # Unauthenticated user attempting to access protected route
    res = client.get("/api/prescriptions/me")
    assert res.status_code == 401, f"Expected 401, got {res.status_code}"
    print("[PASS] Route security verified: Unauthenticated request blocked (401 Unauthorized)")

    print("--- 4. Testing Frame Pre-booking & Concurrency / Stock Safety ---")
    # Find an in-stock frame
    in_stock_frame = next(f for f in frames if f["quantity"] > 0)
    initial_qty = in_stock_frame["quantity"]

    res = client.post("/api/reservations", json={"frame_id": in_stock_frame["id"]}, headers=cust_headers)
    assert res.status_code == 200, res.text
    print(f"[PASS] Pre-booking successful for frame '{in_stock_frame['name']}'")

    # Verify frame quantity decreased
    res = client.get("/api/frames")
    updated_frame = next(f for f in res.json() if f["id"] == in_stock_frame["id"])
    assert updated_frame["quantity"] == initial_qty - 1
    print(f"[PASS] Frame quantity decremented correctly: {initial_qty} -> {updated_frame['quantity']}")

    # Find out-of-stock frame and attempt booking
    out_frame = next(f for f in frames if f["quantity"] == 0)
    res = client.post("/api/reservations", json={"frame_id": out_frame["id"]}, headers=cust_headers)
    assert res.status_code == 400
    assert "out of stock" in res.json()["detail"].lower()
    print("[PASS] Out-of-stock safety verified: cannot reserve 0-quantity frame (400 Bad Request)")

    print("--- 5. Testing Prescription Trend Analysis (DSA) ---")
    # Rahul has 3 checkups with progressive myopia
    res = client.get("/api/prescriptions/me/analysis", headers=cust_headers)
    assert res.status_code == 200, res.text
    analysis = res.json()
    assert analysis["status"] == "success"
    assert analysis["trend_classification"] == "Increasing"
    assert analysis["recommended_checkup_date"] is not None
    assert analysis["trend"] is not None
    assert len(analysis["history"]) == 3
    print(f"[PASS] Rahul trend analysis OK: Classification='{analysis['trend_classification']}', Next Checkup='{analysis['recommended_checkup_date']}'")

    # Ananya login (Stable case)
    res = client.post("/api/auth/login", json={"email": "ananya@gmail.com", "password": "password123"})
    ananya_token = res.json()["token"]
    res = client.get("/api/prescriptions/me/analysis", headers={"Authorization": f"Bearer {ananya_token}"})
    assert res.status_code == 200
    ananya_analysis = res.json()
    assert ananya_analysis["status"] == "success"
    assert ananya_analysis["trend_classification"] == "Stable"
    print(f"[PASS] Ananya trend analysis OK: Classification='{ananya_analysis['trend_classification']}'")

    # Vikram login (Single checkup / Insufficient data case)
    res = client.post("/api/auth/login", json={"email": "vikram@gmail.com", "password": "password123"})
    vikram_token = res.json()["token"]
    res = client.get("/api/prescriptions/me/analysis", headers={"Authorization": f"Bearer {vikram_token}"})
    assert res.status_code == 200
    vikram_analysis = res.json()
    assert vikram_analysis["status"] == "insufficient_data"
    assert "More prescription history is required" in vikram_analysis["message"]
    print("[PASS] Vikram insufficient history handled correctly (status: insufficient_data)")

    print("--- 6. Testing PDF Generation ---")
    res = client.get("/api/prescriptions/me/pdf", headers=cust_headers)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000
    print(f"[PASS] Prescription PDF generated successfully ({len(res.content)} bytes)")

    print("--- 7. Testing Admin Operations ---")
    # Admin creates new frame
    new_frame_payload = {
        "name": "SpecsUp Titanium Edge",
        "brand": "SpecsUp Signature",
        "price": 4999.0,
        "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f",
        "quantity": 10,
        "description": "Featherlight pure Japanese titanium frame."
    }
    res = client.post("/api/admin/frames", json=new_frame_payload, headers=admin_headers)
    assert res.status_code == 201, res.text
    created_frame_id = res.json()["id"]
    print("[PASS] Admin created new frame successfully")

    # Admin updates frame
    res = client.put(f"/api/admin/frames/{created_frame_id}", json={"price": 4499.0}, headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["price"] == 4499.0
    print("[PASS] Admin updated frame successfully")

    # Admin deletes frame
    res = client.delete(f"/api/admin/frames/{created_frame_id}", headers=admin_headers)
    assert res.status_code == 200
    print("[PASS] Admin deleted frame successfully")

    # Admin adds prescription for Vikram
    vikram_user_id = vikram_analysis["latest_prescription"]["customer_id"]
    new_rx_payload = {
        "checkup_date": "2027-02-15",
        "right_sph": -1.25,
        "right_cyl": -0.25,
        "right_axis": 90,
        "right_pd": 32.0,
        "left_sph": -1.25,
        "left_cyl": -0.25,
        "left_axis": 85,
        "left_pd": 32.0,
        "notes": "Follow-up exam by Dr. Verma. Mild myopia progression."
    }
    res = client.post(f"/api/admin/customers/{vikram_user_id}/prescriptions", json=new_rx_payload, headers=admin_headers)
    assert res.status_code == 201
    print("[PASS] Admin added new prescription for customer successfully")

    # Verify Vikram now has 2 checkups and can generate trend!
    res = client.get("/api/prescriptions/me/analysis", headers={"Authorization": f"Bearer {vikram_token}"})
    assert res.status_code == 200
    updated_vikram = res.json()
    assert updated_vikram["status"] == "success"
    print(f"[PASS] Vikram now has sufficient data -> trend analyzed: {updated_vikram['trend_classification']}")

    print("===============================================")
    print("ALL BACKEND END-TO-END TESTS PASSED FLAWLESSLY!")
    print("===============================================")

if __name__ == "__main__":
    test_complete_backend()


