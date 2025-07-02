from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import SubscriptionPlan
import logging

logger = logging.getLogger(__name__)


def init_database():
    """Initialize the database with required data."""
    try:
        # Get a database session
        db = next(get_db())

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
