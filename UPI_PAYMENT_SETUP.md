# Payment Integration Setup Guide

## Overview

The subscription payment system now uses Razorpay's payment intents with a WebView-based payment flow. This provides a reliable, native payment experience within the app without the unreliability of UPI deep links.

## Backend Configuration

### 1. Set Razorpay Environment Variables

Add your Razorpay credentials to the backend environment variables:

```bash
# In your .env file or environment variables
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxx
RAZORPAY_CALLBACK_URL=https://your-domain.com/payment-callback
```

### 2. Updated Backend Endpoint

The backend now creates payment intents instead of payment links:

```python
# In backend/app/api/endpoints/subscriptions.py
@router.post("/create_payment_intent")
def create_premium_payment_intent(
    db: Session = Depends(get_db),
    buyer_mobile: str = Depends(get_current_user),
):
    # Creates Razorpay payment intent
    payment_intent = client.payment_link.create({
        "amount": int(plan.price * 100),
        "currency": "INR",
        "accept_partial": False,
        "description": "Premium Subscription - DigiDairy",
        "customer": {
            "name": user.name,
            "email": email,
            "contact": buyer_mobile,
        },
        "notify": {"sms": True, "email": True},
        "callback_url": callback_url,
        "callback_method": "get",
    })

    return {
        "payment_id": payment_intent["id"],
        "payment_url": payment_intent["short_url"],
        "amount": plan.price,
        "currency": "INR",
        "description": "Premium Subscription - DigiDairy",
        "customer": customer_data
    }
```

## Frontend Features

### 1. WebView-Based Payment

- **Native Experience**: Payment gateway opens within the app
- **No Browser Navigation**: Users stay in the app throughout payment
- **Dark Mode Support**: Works perfectly in both light and dark modes
- **Error Handling**: Proper error handling and retry mechanisms

### 2. PaymentWebView Component

- **Loading States**: Shows loading indicator while payment gateway loads
- **Error Recovery**: Retry button for failed payments
- **Success Detection**: Automatically detects payment completion
- **Close Button**: Easy way to cancel payment

### 3. Better User Experience

- **Seamless Flow**: No app switching or browser navigation
- **Real-time Updates**: Payment status updates in real-time
- **Automatic Refresh**: Subscription status updates after successful payment
- **Toast Notifications**: Clear success/error messages

## How It Works

### 1. Payment Flow

1. User clicks "Upgrade to Premium"
2. Backend creates payment intent
3. WebView opens with Razorpay payment gateway
4. User completes payment within the app
5. Payment success/failure is detected automatically
6. Subscription status is updated

### 2. Success Detection

The WebView component monitors:

- URL changes for success/failure indicators
- JavaScript messages from payment gateway
- Navigation state changes

### 3. Error Handling

- Network errors with retry option
- Payment failures with clear error messages
- Timeout handling
- Graceful fallbacks

## Technical Implementation

### 1. WebView Configuration

```typescript
<WebView
  source={{ uri: paymentUrl }}
  onNavigationStateChange={handleNavigationStateChange}
  onMessage={handleMessage}
  injectedJavaScript={injectedJavaScript}
  javaScriptEnabled={true}
  domStorageEnabled={true}
  userAgent="DigiDairy-App"
/>
```

### 2. Payment Detection

```typescript
const handleNavigationStateChange = (navState: any) => {
  const { url } = navState;

  if (url.includes("success") || url.includes("payment_success")) {
    onSuccess();
    onClose();
  } else if (url.includes("failure") || url.includes("payment_failed")) {
    onError("Payment failed. Please try again.");
    onClose();
  }
};
```

## Advantages Over UPI Deep Links

### 1. **Reliability**

- ✅ Works consistently across all devices
- ✅ No dependency on installed payment apps
- ✅ Handles all payment methods (UPI, cards, net banking)

### 2. **User Experience**

- ✅ Users stay in the app
- ✅ No dark mode issues
- ✅ Consistent interface
- ✅ Better error handling

### 3. **Technical Benefits**

- ✅ No deep link compatibility issues
- ✅ Works on all platforms (iOS/Android)
- ✅ Supports all payment methods
- ✅ Better security and validation

## Testing

### 1. Test Payment Flow

- Test with different payment methods
- Verify success/failure detection
- Check error handling
- Test network interruptions

### 2. Test Scenarios

- Successful payment completion
- Payment failure handling
- Network error recovery
- App backgrounding during payment

## Security Considerations

1. **Payment Validation**: Always verify payments through webhooks
2. **Environment Variables**: Keep Razorpay credentials secure
3. **WebView Security**: Use proper WebView configuration
4. **Error Handling**: Implement proper error boundaries

## Troubleshooting

### Common Issues

1. **Payment Gateway Not Loading**

   - Check network connectivity
   - Verify Razorpay credentials
   - Check WebView configuration

2. **Payment Not Completing**

   - Verify webhook configuration
   - Check payment verification logic
   - Review server logs

3. **Success Detection Issues**
   - Check URL monitoring logic
   - Verify JavaScript injection
   - Test with different payment methods

### Debug Steps

1. Check backend logs for payment creation
2. Verify Razorpay credentials
3. Test WebView with different URLs
4. Check payment gateway response
5. Verify webhook delivery

## Future Enhancements

1. **Payment Analytics**: Track payment success rates
2. **Multiple Payment Methods**: Support different payment gateways
3. **Offline Support**: Handle offline payment scenarios
4. **Payment History**: Show payment transaction history
5. **Refund Support**: Implement refund functionality

## Support

For issues or questions:

1. Check the backend logs
2. Verify Razorpay configuration
3. Test payment flow step by step
4. Contact the development team
