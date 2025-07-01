"""
Migration script to add subscription plan fields and seed plans.
Run this after updating the SubscriptionPlan model.
"""

from sqlalchemy import create_engine, text
from app.core.config import DATABASE_URL
from app.db.models import SubscriptionPlan, AccessType
from datetime import datetime


def run_migration():
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Add new columns if they don't exist
        try:
            conn.execute(
                text(
                    """
                ALTER TABLE subscription_plan 
                ADD COLUMN plan_name VARCHAR(20) UNIQUE,
                ADD COLUMN customer_limit INT,
                ADD COLUMN supplier_limit INT,
                ADD COLUMN transaction_limit INT,
                ADD COLUMN description VARCHAR(255)
            """
                )
            )
            conn.commit()
            print("Added new columns to subscription_plan table")
        except Exception as e:
            print(f"Columns might already exist: {e}")

        # Seed the plans
        plans = [
            {
                "plan_name": "Free",
                "price": 0.0,
                "validity": 3650,  # 10 years, effectively unlimited
                "access_type": AccessType.PARTIAL,
                "customer_limit": 5,
                "supplier_limit": 5,
                "transaction_limit": 3,
                "description": "Free plan: 5 customers, 5 suppliers, 3 daily transactions.",
            },
            {
                "plan_name": "Trial",
                "price": 0.0,
                "validity": 15,
                "access_type": AccessType.PARTIAL,
                "customer_limit": 5,
                "supplier_limit": 5,
                "transaction_limit": 3,
                "description": "Trial plan: 15 days, 5 customers, 5 suppliers, 3 daily transactions.",
            },
            {
                "plan_name": "Premium",
                "price": 99.0,
                "validity": 30,
                "access_type": AccessType.FULL,
                "customer_limit": None,
                "supplier_limit": None,
                "transaction_limit": None,
                "description": "Premium plan: 30 days, unlimited customers, suppliers, and transactions.",
            },
        ]

        for plan_data in plans:
            try:
                # Check if plan already exists
                existing = conn.execute(
                    text(
                        "SELECT id FROM subscription_plan WHERE plan_name = :plan_name"
                    ),
                    {"plan_name": plan_data["plan_name"]},
                ).fetchone()

                if not existing:
                    conn.execute(
                        text(
                            """
                        INSERT INTO subscription_plan 
                        (plan_name, price, validity, access_type, customer_limit, supplier_limit, transaction_limit, description, created_at)
                        VALUES (:plan_name, :price, :validity, :access_type, :customer_limit, :supplier_limit, :transaction_limit, :description, :created_at)
                    """
                        ),
                        {**plan_data, "created_at": datetime.now()},
                    )
                    print(f"Added plan: {plan_data['plan_name']}")
                else:
                    print(f"Plan {plan_data['plan_name']} already exists")

            except Exception as e:
                print(f"Error adding plan {plan_data['plan_name']}: {e}")

        conn.commit()
        print("Migration completed successfully!")


if __name__ == "__main__":
    run_migration()
