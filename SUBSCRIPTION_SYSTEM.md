# Milk Management System - Subscription System

## Overview

The Milk Management System now includes a comprehensive subscription system with Razorpay payment integration, trial periods, referral rewards, and tier-based usage limits. This system allows users to start with a free tier and upgrade to premium features.

## Features

### 1. Subscription Plans

#### Free Tier

- **Price**: ₹0 (Forever)
- **Limits**:
  - Maximum 10 customers
  - Maximum 10 suppliers
  - Maximum 3 transactions per day
- **Features**:
  - Basic milk tracking
  - Limited customers and suppliers
  - Basic reporting

#### Trial Tier

- **Price**: ₹0 (30 days)
- **Limits**:
  - Unlimited customers
  - Unlimited suppliers
  - Unlimited transactions
- **Features**:
  - All premium features
  - Advanced analytics
  - Full access to all functionality

#### Premium Tier

- **Price**: ₹99 (1 year)
- **Limits**:
  - Unlimited customers
  - Unlimited suppliers
  - Unlimited transactions
- **Features**:
  - All premium features
  - Advanced analytics
  - Priority support
  - Export capabilities

### 2. Trial Management

#### Automatic Trial Setup

- New users automatically get a 30-day trial
- Trial starts from registration date
- Users get full premium features during trial
- Automatic downgrade to free tier after trial expires

#### Trial Extension

- Referral rewards can extend trial period
- Users can earn extra trial days through referrals

### 3. Referral Rewards System

#### How It Works

1. Each user gets a unique referral code
2. When someone uses your referral code:
   - **Referrer gets**: 7 extra days of premium features
   - **Referred user gets**: 15 extra days of trial

#### Reward Types

- **Extra Trial Days**: Extends trial period
- **Extra Premium Days**: Extends premium subscription
- **Feature Unlocks**: Access to premium features

### 4. Usage Tracking

#### What's Tracked

- **Customers Added**: Total number of customers created
- **Suppliers Added**: Total number of suppliers created
- **Daily Transactions**: Number of transactions per day
- **Plan Status**: Current subscription plan
- **Trial Status**: Trial start/end dates

#### Usage Limits Enforcement

- Real-time checking before actions
- Automatic blocking when limits exceeded
- Clear error messages with upgrade prompts

## Technical Implementation

### Backend Architecture

#### Database Models

```python
# User Model Enhancements
class User(Base):
    # ... existing fields ...
    current_plan = Column(String(20), default='free')
    trial_start_date = Column(Date, nullable=True)
    trial_end_date = Column(Date, nullable=True)
    total_customers_added = Column(Integer, default=0)
    total_suppliers_added = Column(Integer, default=0)
    daily_transactions_count = Column(Integer, default=0)
    last_transaction_date = Column(Date, nullable=True)
    referral_rewards_earned = Column(Integer, default=0)
    referral_rewards_used = Column(Integer, default=0)

# Subscription Model
class Subscription(Base):
    id = Column(Integer, primary_key=True, autoincrement=True)
    buyer_mobile = Column(String(10), nullable=False)
    subscription_type = Column(String(10), nullable=False)  # trial, premium
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    razorpay_order_id = Column(String(255), nullable=True)
    razorpay_payment_id = Column(String(255), nullable=True)
    payment_status = Column(String(20), default='pending')
    amount_paid = Column(Float, nullable=True)

# Referral Rewards Model
class ReferralReward(Base):
    id = Column(Integer, primary_key=True, autoincrement=True)
    referrer_mobile = Column(String(10), ForeignKey('users.mobile'), nullable=False)
    referred_mobile = Column(String(10), ForeignKey('users.mobile'), nullable=False)
    reward_type = Column(String(50), nullable=False)
    reward_value = Column(Integer, nullable=False)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime, nullable=True)
```

#### Subscription Service

```python
class SubscriptionService:
    def __init__(self):
        self.plans = {
            'free': {
                'name': 'Free',
                'price': 0,
                'validity': 0,
                'max_customers': 10,
                'max_suppliers': 10,
                'max_daily_transactions': 3,
                'features': ['Basic milk tracking', 'Limited customers', 'Limited suppliers']
            },
            'trial': {
                'name': 'Trial',
                'price': 0,
                'validity': 30,
                'max_customers': -1,  # Unlimited
                'max_suppliers': -1,  # Unlimited
                'max_daily_transactions': -1,  # Unlimited
                'features': ['All premium features', 'Unlimited customers', 'Unlimited suppliers', 'Advanced analytics']
            },
            'premium': {
                'name': 'Premium',
                'price': 99,
                'validity': 365,
                'max_customers': -1,  # Unlimited
                'max_suppliers': -1,  # Unlimited
                'max_daily_transactions': -1,  # Unlimited
                'features': ['All premium features', 'Unlimited customers', 'Unlimited suppliers', 'Advanced analytics', 'Priority support']
            }
        }
```

### API Endpoints

#### Subscription Management

- `GET /subscription/plan-info` - Get current plan information
- `GET /subscription/plans` - Get all available plans
- `GET /subscription/usage` - Get detailed usage information
- `GET /subscription/history` - Get subscription history

#### Payment Processing

- `POST /subscription/create-order` - Create Razorpay payment order
- `POST /subscription/verify-payment` - Verify payment and activate subscription

#### Referral System

- `GET /subscription/referral-info` - Get referral information
- `POST /subscription/apply-referral` - Apply referral code
- `POST /subscription/use-reward` - Use referral reward

#### Usage Limits

- `GET /subscription/check-limit/{action}` - Check if action is allowed

### Frontend Implementation

#### Subscription Screen Features

- **Current Plan Display**: Shows current plan with usage progress
- **Plan Comparison**: Side-by-side comparison of all plans
- **Usage Visualization**: Progress bars for customers, suppliers, transactions
- **Referral Management**: Referral code sharing and reward usage
- **Payment Integration**: Seamless Razorpay payment flow

#### Usage Tracking Integration

- **Real-time Limits**: Check limits before actions
- **Progress Indicators**: Visual feedback on usage
- **Upgrade Prompts**: Clear calls-to-action when limits reached

## Razorpay Integration

### Setup Requirements

1. **Razorpay Account**: Create account at razorpay.com
2. **API Keys**: Get test and live API keys
3. **Webhook Configuration**: Set up webhooks for payment verification

### Payment Flow

1. **Order Creation**: Backend creates Razorpay order
2. **Payment Gateway**: User completes payment on Razorpay
3. **Webhook Verification**: Backend verifies payment signature
4. **Subscription Activation**: Premium features activated

### Configuration

```python
# In subscription_service.py
razorpay_client = razorpay.Client(
    auth=("rzp_test_YOUR_KEY_ID", "YOUR_SECRET_KEY")
)
```

## Usage Limits Enforcement

### Implementation Points

1. **Customer Addition**: Check customer limit before adding
2. **Supplier Addition**: Check supplier limit before adding
3. **Transaction Addition**: Check daily transaction limit
4. **Real-time Validation**: Immediate feedback to users

### Error Handling

```python
# Example usage check
allowed, message = subscription_service.check_usage_limits(db, user_mobile, "add_customer")
if not allowed:
    raise HTTPException(status_code=403, detail=message)
```

## Referral System

### Code Generation

- **Format**: Last 4 digits of mobile + 4 random characters
- **Example**: `1234ABCD`
- **Uniqueness**: Ensured through database constraints

### Reward Processing

- **Automatic**: Rewards applied when referral code used
- **Immediate**: Benefits available instantly
- **Trackable**: Full history of rewards earned and used

## Security Features

### Payment Security

- **Signature Verification**: All payments verified cryptographically
- **Order Validation**: Orders validated before processing
- **Fraud Prevention**: Multiple layers of validation

### Usage Security

- **Rate Limiting**: API rate limiting for abuse prevention
- **Session Management**: Secure session handling
- **Audit Logging**: Complete audit trail of all actions

## Business Logic

### Trial Management

- **Automatic Setup**: New users get trial automatically
- **Expiration Handling**: Graceful downgrade to free tier
- **Extension Support**: Trial can be extended through rewards

### Plan Upgrades

- **Seamless Transition**: No data loss during upgrades
- **Immediate Access**: Premium features available instantly
- **Proration Support**: Future enhancement for partial billing

### Usage Optimization

- **Daily Reset**: Transaction counters reset daily
- **Accurate Tracking**: Real-time usage monitoring
- **Limit Enforcement**: Strict adherence to plan limits

## Configuration

### Environment Variables

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_SECRET_KEY=your_secret_key

# Subscription Configuration
TRIAL_DURATION_DAYS=30
PREMIUM_PRICE=99
PREMIUM_DURATION_DAYS=365
```

### Plan Configuration

```python
# Easily configurable plan limits
FREE_TIER_CUSTOMER_LIMIT = 10
FREE_TIER_SUPPLIER_LIMIT = 10
FREE_TIER_DAILY_TRANSACTION_LIMIT = 3
```

## Monitoring and Analytics

### Usage Metrics

- **Plan Distribution**: Track user plan distribution
- **Upgrade Conversion**: Monitor free-to-premium conversions
- **Usage Patterns**: Analyze feature usage patterns
- **Revenue Tracking**: Monitor subscription revenue

### Performance Monitoring

- **API Response Times**: Monitor endpoint performance
- **Payment Success Rates**: Track payment processing success
- **Error Rates**: Monitor system errors and failures

## Future Enhancements

### Planned Features

1. **Multiple Payment Methods**: UPI, cards, net banking
2. **Subscription Proration**: Partial billing for mid-cycle upgrades
3. **Family Plans**: Multi-user subscription packages
4. **Usage Analytics**: Detailed usage reports and insights
5. **Automated Billing**: Recurring payment processing
6. **Discount Codes**: Promotional code system
7. **Enterprise Plans**: Custom plans for large organizations

### Technical Improvements

1. **Caching**: Redis caching for better performance
2. **Queue Processing**: Background job processing
3. **Webhook Reliability**: Improved webhook delivery
4. **Mobile SDK**: Native mobile payment integration
5. **Analytics Dashboard**: Admin dashboard for insights

## Testing

### Test Scenarios

1. **Plan Limits**: Test all usage limit scenarios
2. **Payment Flow**: Test complete payment process
3. **Referral System**: Test referral code application
4. **Trial Management**: Test trial setup and expiration
5. **Error Handling**: Test various error scenarios

### Test Data

```python
# Sample test data
test_user = {
    "mobile": "9876543210",
    "name": "Test User",
    "current_plan": "free",
    "trial_start_date": "2024-01-01",
    "trial_end_date": "2024-01-31"
}
```

## Deployment

### Production Checklist

1. **Database Migration**: Run all subscription-related migrations
2. **Environment Variables**: Set production Razorpay keys
3. **Webhook URLs**: Configure production webhook endpoints
4. **SSL Certificate**: Ensure HTTPS for payment security
5. **Monitoring**: Set up production monitoring and alerts

### Backup Strategy

- **Database Backups**: Regular subscription data backups
- **Payment Records**: Secure storage of payment information
- **Audit Logs**: Preserve all subscription-related logs

## Support and Maintenance

### Common Issues

1. **Payment Failures**: Handle payment gateway issues
2. **Usage Limit Confusion**: Clear communication about limits
3. **Trial Expiration**: Graceful handling of trial end
4. **Referral Issues**: Troubleshoot referral code problems

### Maintenance Tasks

1. **Daily**: Monitor payment processing
2. **Weekly**: Review usage analytics
3. **Monthly**: Analyze subscription metrics
4. **Quarterly**: Review and optimize plan structure

## Conclusion

The subscription system provides a complete monetization solution for the Milk Management System, with:

- **Flexible Plans**: Free, trial, and premium tiers
- **Seamless Payments**: Integrated Razorpay payment processing
- **Referral Rewards**: Viral growth through referral system
- **Usage Tracking**: Comprehensive usage monitoring
- **Security**: Multiple layers of security and validation
- **Scalability**: Designed for growth and expansion

This system enables sustainable business growth while providing value to users at all levels.
