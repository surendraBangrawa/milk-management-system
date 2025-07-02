# Milk Management System - Postman API Testing Collection

This repository contains a comprehensive Postman collection for testing the Milk Management System backend API. The collection includes all endpoints organized by functionality with proper authentication, request bodies, and environment variables.

## 📁 Files Included

1. **`Milk_Management_System_API.postman_collection.json`** - Main Postman collection with all API endpoints
2. **`Milk_Management_System_Environment.postman_environment.json`** - Environment variables for testing
3. **`POSTMAN_COLLECTION_README.md`** - This documentation file

## 🚀 Quick Start

### 1. Import the Collection

1. Open Postman
2. Click **Import** button
3. Select the `Milk_Management_System_API.postman_collection.json` file
4. The collection will be imported with all endpoints organized by category

### 2. Import the Environment

1. In Postman, go to **Environments** tab
2. Click **Import** button
3. Select the `Milk_Management_System_Environment.postman_environment.json` file
4. Select the imported environment from the dropdown in the top-right corner

### 3. Configure Your Backend

Make sure your backend server is running. By default, the collection expects the API to be available at:

- **Base URL**: `http://localhost:8000`

If your backend is running on a different URL, update the `base_url` variable in the environment.

## 📋 API Endpoints Overview

The collection is organized into 6 main categories:

### 🔐 Authentication

- **User Signup** - Register a new user
- **Send Login OTP** - Request OTP for login
- **User Login** - Login with mobile and OTP (automatically saves access token)
- **User Logout** - Logout and invalidate token

### 👥 Customers

- **Add Customer** - Add a new customer under the authenticated user
- **Delete Customer** - Delete a customer and related records

### 💰 Transactions

- **Add Milk Record** - Add milk collection record
- **Add Expense Record** - Add expense record
- **Delete Transaction** - Delete specific transaction
- **Edit Transaction** - Edit existing transaction
- **Get Customer Transactions** - Get transactions for a specific customer
- **Get Supplier Transactions** - Get transactions for a specific supplier
- **Get Customer Summary** - Get summary of all customers
- **Get Supplier Summary** - Get summary of all suppliers
- **Get Total Records by Date Range** - Get records within date range
- **Generate Milk Report** - Generate comprehensive milk report

### 👤 Profile

- **Get Profile** - Get current user profile
- **Edit Profile** - Edit user or customer name
- **Delete Profile** - Delete user profile and all data

### 📊 Rate List

- **Store Rate List** - Store fat/SNF rate combinations
- **Upload Rate List Image** - Upload image for OCR processing
- **Get Rate List** - Get current user's rate list
- **Get Rate by Fat and SNF** - Get rate for specific values
- **Delete Rate List** - Delete current rate list

### 💳 Subscriptions

- **Check Subscription Status** - Check current subscription
- **Fetch Available Plans** - Get available subscription plans
- **Take Subscription** - Subscribe to a plan
- **Create Payment Link** - Create Razorpay payment link
- **Razorpay Webhook** - Webhook for payment notifications

## 🔧 Environment Variables

The collection uses the following environment variables:

| Variable          | Description                       | Default Value           |
| ----------------- | --------------------------------- | ----------------------- |
| `base_url`        | API base URL                      | `http://localhost:8000` |
| `access_token`    | JWT access token (auto-populated) | (empty)                 |
| `mobile_number`   | Test user mobile number           | `9876543210`            |
| `user_name`       | Test user name                    | `Test User`             |
| `referral_code`   | Referral code                     | `REF123`                |
| `otp_code`        | OTP for testing                   | `123456`                |
| `customer_mobile` | Test customer mobile              | `9876543211`            |
| `customer_name`   | Test customer name                | `Test Customer`         |
| `buyer_mobile`    | Test buyer mobile                 | `9876543212`            |
| `new_user_name`   | Updated user name                 | `Updated User Name`     |
| `start_date`      | Start date for queries            | `2024-01-01`            |
| `end_date`        | End date for queries              | `2024-12-31`            |
| `shift`           | Milk shift (M/E)                  | `M`                     |
| `record_id`       | Transaction record ID             | `1`                     |
| `record_type`     | Transaction type                  | `milk`                  |
| `fat_value`       | Fat percentage                    | `3.5`                   |
| `snf_value`       | SNF percentage                    | `8.5`                   |
| `plan_id`         | Subscription plan ID              | `1`                     |

## 🔄 Testing Workflow

### 1. Authentication Flow

1. **User Signup** - Register a new user
2. **Send Login OTP** - Request OTP (check response for OTP)
3. **User Login** - Login with OTP (access token is automatically saved)

### 2. Customer Management

1. **Add Customer** - Add a customer under your account
2. **Get Profile** - Verify customer was added

### 3. Transaction Management

1. **Add Milk Record** - Add a milk collection record
2. **Add Expense Record** - Add an expense record
3. **Get Customer Transactions** - View all transactions
4. **Get Customer Summary** - View summary

### 4. Rate List Management

1. **Store Rate List** - Create a rate list
2. **Get Rate List** - Verify rate list
3. **Get Rate by Fat and SNF** - Test rate calculation

### 5. Profile Management

1. **Get Profile** - View current profile
2. **Edit Profile** - Update profile information

### 6. Subscription Management

1. **Check Subscription Status** - Check current status
2. **Fetch Available Plans** - View available plans
3. **Take Subscription** - Subscribe to a plan

## 🧪 Testing Tips

### Authentication

- The **User Login** request automatically saves the access token to the environment
- All subsequent requests use the `{{access_token}}` variable
- If you get 401 errors, re-run the login request to get a fresh token

### Data Validation

- Update the environment variables with realistic test data
- Use different mobile numbers for different test scenarios
- Test both valid and invalid data scenarios

### Error Handling

- Test with invalid OTP codes
- Test with non-existent customer mobile numbers
- Test with invalid date ranges
- Test with missing required fields

### File Upload

- For the **Upload Rate List Image** endpoint, prepare a clear image file
- Supported formats: JPG, PNG, etc.
- Ensure the image contains readable rate list data

## 🔍 Common Test Scenarios

### 1. Complete User Journey

```
Signup → Login → Add Customer → Add Milk Record → Add Expense → View Summary → Generate Report
```

### 2. Rate List Management

```
Store Rate List → Get Rate List → Get Rate by Fat/SNF → Upload Image → Delete Rate List
```

### 3. Subscription Flow

```
Check Status → Fetch Plans → Take Subscription → Create Payment Link
```

### 4. Error Scenarios

```
Invalid OTP → Non-existent Customer → Invalid Date Range → Missing Required Fields
```

## 🛠️ Customization

### Adding New Endpoints

1. Create a new request in the appropriate folder
2. Set the method, URL, and headers
3. Add request body if needed
4. Use environment variables for dynamic values

### Modifying Environment Variables

1. Go to the **Environments** tab in Postman
2. Select your environment
3. Add, modify, or delete variables as needed
4. Save the environment

### Creating Test Scripts

Add test scripts to validate responses:

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has required fields", function () {
  const response = pm.response.json();
  pm.expect(response).to.have.property("message");
});
```

## 📝 Notes

- **Base URL**: Update `base_url` in environment if your backend runs on a different port/URL
- **Authentication**: JWT tokens expire after 30 minutes by default
- **Rate Limiting**: Be aware of any rate limits on OTP requests
- **File Uploads**: Ensure proper file permissions for image uploads
- **Database**: Make sure your database is properly configured and seeded

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**

   - Re-run the login request to get a fresh token
   - Check if the token has expired

2. **404 Not Found**

   - Verify the base URL is correct
   - Check if the backend server is running

3. **500 Internal Server Error**

   - Check backend logs for detailed error information
   - Verify database connection and configuration

4. **File Upload Issues**
   - Ensure the file is a valid image format
   - Check file size limits
   - Verify file permissions

### Getting Help

If you encounter issues:

1. Check the backend logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure the backend server is running and accessible
4. Test with the provided sample data first

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [JWT Token Information](https://jwt.io/)

---

**Happy Testing! 🚀**
