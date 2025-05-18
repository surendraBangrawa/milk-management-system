from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from app.middleware.jwt_middleware import JWTMiddleware
from app.api.endpoints import (
    ratelist,
    auth,
    customers,
    transactions,
    profile,
    subscriptions,
)
from app.core.logging_config import configure_logging

configure_logging()
load_dotenv()


app = FastAPI(
    title="Milk Management System API",
    description="API for managing milk rates, collections, etc.",
    version="0.1.0",
    openapi_tags=[
        {"name": "ratelist", "description": "Operations related to milk rate lists"},
        {"name": "auth", "description": "Authentication and user management"},
        {"name": "customers", "description": "Customer management"},
        {"name": "transactions", "description": "Transaction management"},
        {"name": "profile", "description": "User profile management"},
        {"name": "subscriptions", "description": "Subscription management"},
    ],
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(JWTMiddleware)
app.include_router(ratelist.router)
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(transactions.router)
app.include_router(profile.router)
app.include_router(subscriptions.router)
