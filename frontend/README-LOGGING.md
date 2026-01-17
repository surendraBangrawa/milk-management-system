# Frontend Logging System

This frontend logging system follows **industry-standard practices** for mobile application logging.

## Industry Standards Followed

✅ **Structured Logging** - JSON format with consistent fields  
✅ **Contextual Information** - User ID, session ID, platform, app version  
✅ **Batching** - Reduces API calls and improves performance  
✅ **Offline Support** - Stores logs locally when offline, syncs when online  
✅ **Error Handling** - Never breaks the app if logging fails  
✅ **Centralized Management** - All logs sent to backend for unified view  
✅ **Privacy** - No sensitive data in logs  

## How It Works

### Architecture

```
Frontend App
    ↓ (logs)
Local Storage (AsyncStorage)
    ↓ (batched, every 30s or 10 logs)
Backend API (/logs/frontend)
    ↓ (writes to)
Central Log File (/app/logs/milk_management.log)
    ↓ (collected by)
Promtail → Loki → Grafana
```

### Features

1. **Console Logging** (Development)
   - All logs appear in console during development
   - Helps with local debugging

2. **Local Storage** (Offline Support)
   - Logs stored in AsyncStorage when offline
   - Automatically synced when connection restored
   - Maximum 1000 logs stored locally

3. **Batched API Calls**
   - Logs batched in groups of 10
   - Sent every 30 seconds or when batch is full
   - Reduces network overhead

4. **Error Resilience**
   - Logging failures never break the app
   - Silent failures with fallback to console
   - Retry mechanism for failed batches

## Usage

### Basic Usage

```typescript
import logger from './lib/logger';

// Info log
logger.info('User logged in successfully');

// Warning log
logger.warning('API response was slow', { duration: 5000 });

// Error log
logger.error('Failed to fetch data', error, { endpoint: '/api/users' });

// Critical log (for severe issues)
logger.critical('Payment processing failed', error, { orderId: '123' });

// Debug log (development only)
logger.debug('State updated', { newState: state });
```

### With Metadata

```typescript
logger.info('Transaction created', {
  transactionId: '123',
  amount: 100.50,
  customerId: '456'
});
```

### Error Logging

```typescript
try {
  await apiCall();
} catch (error) {
  logger.error('API call failed', error, {
    endpoint: '/api/transactions',
    method: 'POST',
    retryCount: 3
  });
}
```

### Manual Operations

```typescript
// Force send all pending logs (useful before app closes)
await logger.flush();

// Get local logs (for debugging)
const localLogs = await logger.getLocalLogs();

// Clear local logs
await logger.clearLocalLogs();

// Sync all local logs to backend (recovery)
await logger.syncLocalLogs();
```

## Integration Points

### App Lifecycle (Recommended)

Add to your root component or App.tsx:

```typescript
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import logger from './lib/logger';

export default function App() {
  useEffect(() => {
    // Flush logs when app goes to background
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        logger.flush();
      }
    });

    // Sync local logs on app start
    logger.syncLocalLogs();

    return () => {
      subscription.remove();
    };
  }, []);

  // ... rest of your app
}
```

### Replace Console Logs (Optional)

You can replace console.log calls:

```typescript
// Before
console.log('User action');
console.error('Error occurred', error);

// After
import logger from './lib/logger';
logger.info('User action');
logger.error('Error occurred', error);
```

### Axios Interceptor Integration

The logger can be integrated with your axios interceptors:

```typescript
// In axiosIntance.ts
import logger from './lib/logger';

axiosInstance.interceptors.response.use(
  (response) => {
    logger.debug('API Response', {
      url: response.config.url,
      status: response.status,
      duration: Date.now() - (response.config as any).metadata?.startTime
    });
    return response;
  },
  (error) => {
    logger.error('API Error', error, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status
    });
    return Promise.reject(error);
  }
);
```

## Configuration

The logger uses these constants (can be adjusted in `logger.ts`):

- `BATCH_SIZE`: 10 logs per batch
- `BATCH_INTERVAL`: 30000ms (30 seconds)
- `MAX_LOCAL_LOGS`: 1000 logs stored locally

## Backend Integration

Logs are sent to: `POST /logs/frontend`

The endpoint:
- ✅ No authentication required (allows logging even when user not logged in)
- ✅ Writes to central log file
- ✅ Includes user context, session, platform info
- ✅ Never fails (silent error handling)

## Industry Comparison

### Our Approach vs Industry Standards

| Feature | Our Implementation | Industry Standard | Status |
|---------|-------------------|-------------------|--------|
| Structured Logging | ✅ JSON format | ✅ Required | ✅ Matches |
| Batching | ✅ 10 logs / 30s | ✅ Recommended | ✅ Matches |
| Offline Support | ✅ AsyncStorage | ✅ Required | ✅ Matches |
| Error Resilience | ✅ Silent failures | ✅ Required | ✅ Matches |
| Context Info | ✅ User, session, platform | ✅ Required | ✅ Matches |
| Centralized | ✅ Backend API | ✅ Common | ✅ Matches |

### Alternative Approaches (Industry)

Many companies also use:
- **Sentry** - Error tracking and logging
- **LogRocket** - Session replay + logging
- **Datadog** - Full observability platform
- **Firebase Crashlytics** - Crash reporting

Our custom solution is:
- ✅ **Cost-effective** (no per-user fees)
- ✅ **Full control** (customize as needed)
- ✅ **Integrated** (works with existing backend)
- ✅ **Privacy-focused** (data stays in your infrastructure)

## Best Practices

1. **Don't log sensitive data**
   ```typescript
   // ❌ Bad
   logger.info('User logged in', { password: userPassword });
   
   // ✅ Good
   logger.info('User logged in', { userId: user.id });
   ```

2. **Use appropriate log levels**
   - `DEBUG`: Development debugging
   - `INFO`: Normal operations
   - `WARNING`: Potential issues
   - `ERROR`: Errors that don't crash app
   - `CRITICAL`: Severe issues requiring immediate attention

3. **Include context**
   ```typescript
   // ✅ Good - includes context
   logger.error('Payment failed', error, {
     orderId: order.id,
     amount: order.amount,
     paymentMethod: order.paymentMethod
   });
   ```

4. **Don't over-log**
   - Avoid logging in tight loops
   - Use DEBUG level for verbose logging
   - Only log meaningful events

## Troubleshooting

### Logs not appearing in backend

1. Check API_BASE_URL is set correctly
2. Check network connectivity
3. Check local logs: `await logger.getLocalLogs()`
4. Manually sync: `await logger.syncLocalLogs()`

### Too many API calls

- Increase `BATCH_SIZE` or `BATCH_INTERVAL`
- Check if batching is working: logs should queue locally

### Storage issues

- Logs are automatically trimmed to 1000 entries
- Clear manually: `await logger.clearLocalLogs()`

## Summary

This logging system follows industry best practices:
- ✅ Structured, batched, offline-capable
- ✅ Integrated with your backend
- ✅ No code changes needed to existing loggers
- ✅ Production-ready and scalable

