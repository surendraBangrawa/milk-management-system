from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.db.models import SubscriptionPlan
import logging

logger = logging.getLogger(__name__)


def add_ratelist_upload_limit_column():
    """Add ratelist_upload_limit column to existing subscription_plan table."""
    try:
        db = next(get_db())

        # Check if column exists
        result = db.execute(
            text(
                """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'subscription_plan' 
            AND column_name = 'ratelist_upload_limit'
        """
            )
        )

        if not result.fetchone():
            # Add the column
            db.execute(
                text(
                    """
                ALTER TABLE subscription_plan 
                ADD COLUMN ratelist_upload_limit INTEGER
            """
                )
            )
            db.commit()
            logger.info("Added ratelist_upload_limit column to subscription_plan table")
        else:
            logger.info("ratelist_upload_limit column already exists")

        db.close()
    except Exception as e:
        logger.error(f"Error adding ratelist_upload_limit column: {e}")
        raise


def init_database():
    """Initialize the database with required data."""
    try:
        # Get a database session
        db = next(get_db())

        # Add ratelist_upload_limit column if it doesn't exist
        add_ratelist_upload_limit_column()

        # Seed subscription plans
        logger.info("Seeding subscription plans...")
        SubscriptionPlan.seed_plans(db)
        logger.info("Subscription plans seeded successfully!")

        db.close()

    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise


def seed_subscription_plans():
    """Seed subscription plans if they don't exist."""
    try:
        db = next(get_db())
        SubscriptionPlan.seed_plans(db)
        db.close()
        logger.info("Subscription plans seeded successfully!")
    except Exception as e:
        logger.error(f"Error seeding subscription plans: {e}")
        raise
