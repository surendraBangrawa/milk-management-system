from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import DATABASE_URL
from sqlalchemy.ext.declarative import (
    declarative_base,
)
from sqlalchemy.pool import QueuePool

# Configure the engine with connection pooling and retry logic
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,  # Reduced for free tier
    max_overflow=10,  # Reduced for free tier
    pool_pre_ping=True,  # This will test connections before using them
    pool_recycle=3600,  # Recycle connections after 1 hour
    connect_args={
        "connect_timeout": 30,
        "application_name": "milk_management_api",
    },
)

Base = declarative_base()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


import time
from sqlalchemy.exc import OperationalError


def get_db():
    """
    Dependency function that provides a database session.
    It ensures the session is closed after the request is finished.
    Includes retry logic for transient database connection issues.
    """
    max_retries = 3
    retry_delay = 0.1  # Start with 100ms delay

    for attempt in range(max_retries):
        try:
            db = SessionLocal()
            # Test the connection
            db.execute(text("SELECT 1"))
            try:
                yield db
            finally:
                db.close()
            break  # Success, exit retry loop
        except OperationalError as e:
            if attempt == max_retries - 1:  # Last attempt
                raise e
            time.sleep(retry_delay)
            retry_delay *= 2  # Exponential backoff
            continue
