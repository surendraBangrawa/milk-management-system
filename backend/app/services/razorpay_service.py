import razorpay
import os

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_xxxxxxxx")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "xxxxxxxxxxxxxx")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


def create_payment_link(
    amount, customer_name, customer_email, customer_contact, description, callback_url
):
    response = client.payment_link.create(
        {
            "amount": int(amount * 100),  # Razorpay expects paise
            "currency": "INR",
            "accept_partial": False,
            "description": description,
            "customer": {
                "name": customer_name,
                "email": customer_email,
                "contact": customer_contact,
            },
            "notify": {"sms": True, "email": True},
            "callback_url": callback_url,
            "callback_method": "get",
        }
    )
    return response


def verify_webhook_signature(body, signature, secret):
    return razorpay.utility.verify_webhook_signature(body, signature, secret)
