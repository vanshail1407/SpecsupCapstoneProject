"""
SpecsUp - Interactive Terminal Demonstration & Viva Tool
========================================================
Run this interactive tool to demonstrate the core DSA and business logic
directly in the terminal during a project evaluation.
"""

import os
import sys

# Ensure backend directory is in python module search path
backend_dir = os.path.join(os.path.dirname(__file__), "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import connection
from app.algorithms.prescription_analysis import calculate_prescription_trend, calculate_checkup_recommendation

def print_header(title):
    print("\n" + "=" * 65)
    print(f"  {title}")
    print("=" * 65)

def demo_menu():
    connection.init_db()

    while True:
        print_header("SpecsUp Capstone Project - Interactive Evaluation CLI")
        print("1. View Optical Frame Inventory & Stock Levels")
        print("2. Run DSA Trend Analysis on Sample Customer")
        print("3. Demonstrate Concurrency / Stock Decrement")
        print("4. Reset Database to Clean Initial Seed State")
        print("5. Exit")
        choice = input("\nEnter selection (1-5): ").strip()

        if choice == "1":
            frames = connection.fetch_all("SELECT name, brand, price, quantity FROM frames ORDER BY price ASC")
            print_header("In-Shop Optical Frame Inventory")
            print(f"{'Frame Name':<30} {'Brand':<18} {'Price (INR)':<12} {'Available Stock'}")
            print("-" * 72)
            for f in frames:
                stock_str = f"{f['quantity']} units" if f['quantity'] > 0 else "OUT OF STOCK"
                print(f"{f['name']:<30} {f['brand']:<18} Rs. {f['price']:<11.2f} {stock_str}")

        elif choice == "2":
            customers = connection.fetch_all("SELECT id, name, email FROM users WHERE role = 'customer'")
            print_header("Select Customer to Run DSA Trend Analysis")
            for idx, c in enumerate(customers, 1):
                print(f"{idx}. {c['name']} ({c['email']})")

            sel = input("\nEnter customer number: ").strip()
            try:
                c_idx = int(sel) - 1
                customer = customers[c_idx]
            except (ValueError, IndexError):
                print("Invalid selection.")
                continue

            rx_list = connection.fetch_all(
                "SELECT * FROM prescriptions WHERE customer_id = ? ORDER BY checkup_date ASC",
                (customer['id'],)
            )

            print_header(f"Prescription History for {customer['name']} ({len(rx_list)} records)")
            if not rx_list:
                print("No examinations found for this customer.")
                continue

            print(f"{'Date':<14} {'Right SPH':<12} {'Right CYL':<12} {'Left SPH':<12} {'Left CYL':<12}")
            print("-" * 65)
            for rx in rx_list:
                print(f"{rx['checkup_date']:<14} {rx['right_sph']:<12} {rx['right_cyl']:<12} {rx['left_sph']:<12} {rx['left_cyl']:<12}")

            # Run DSA
            trend_res = calculate_prescription_trend([dict(r) for r in rx_list])
            rec_res = calculate_checkup_recommendation([dict(r) for r in rx_list], trend_res)

            print("\n--- DSA ALGORITHM RESULTS ---")
            if trend_res['status'] == 'insufficient_data':
                print(f"Status: INSUFFICIENT DATA (< 2 checkups)")
                print(f"Reason: {trend_res['message']}")
                print(f"Default Baseline Review: {rec_res['recommended_month_year']}")
            else:
                print(f"Trend Classification : {trend_res['trend_classification']}")
                print(f"Right SPH Yearly Rate: {trend_res['trend']['right_sph']:+.3f} D/year")
                print(f"Left SPH Yearly Rate : {trend_res['trend']['left_sph']:+.3f} D/year")
                print(f"Right CYL Yearly Rate: {trend_res['trend']['right_cyl']:+.3f} D/year")
                print(f"Left CYL Yearly Rate : {trend_res['trend']['left_cyl']:+.3f} D/year")
                print(f"Recommended Checkup  : {rec_res['recommended_month_year']} ({rec_res['suggested_interval_months']} months)")
                print(f"Clinical Reasoning   : {rec_res['reasoning']}")

        elif choice == "3":
            frames = connection.fetch_all("SELECT id, name, quantity FROM frames WHERE quantity > 0 LIMIT 1")
            if not frames:
                print("No in-stock frames found.")
                continue
            frame = frames[0]
            print(f"\nAttempting atomic reservation for: '{frame['name']}' (Current stock: {frame['quantity']})")
            customers = connection.fetch_all("SELECT id FROM users WHERE role = 'customer' LIMIT 1")
            success, msg, rec = connection.atomic_prebook(customers[0]['id'], frame['id'])
            print(f"Result: {success} -> {msg}")
            updated = connection.fetch_one("SELECT quantity FROM frames WHERE id = ?", (frame['id'],))
            print(f"Updated Stock in Database: {updated['quantity']} units.")

        elif choice == "4":
            print("\nResetting database...")
            from seed_data import seed_database
            seed_database()
            print("Database re-seeded successfully.")

        elif choice == "5":
            print("\nExiting. Thank you!")
            break
        else:
            print("Invalid option. Please enter 1-5.")

if __name__ == "__main__":
    demo_menu()

