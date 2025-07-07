# Background Processing with Celery

This document explains the background processing system implemented to handle heavy OCR operations without blocking other API requests.

## Problem Solved

Previously, the rate list image processing was blocking other API requests because:

- OCR processing (Gemini API calls) was CPU and time-intensive
- Background tasks were running in the same process as the main FastAPI application
- Other requests had to wait for the processing to complete

## Solution: Celery + Redis

We've implemented a proper asynchronous task queue using:

- **Celery**: Distributed task queue for Python
- **Redis**: Message broker and result backend
- **Separate Worker Process**: Dedicated process for heavy computations

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FastAPI App   │    │   Redis Broker  │    │  Celery Worker  │
│                 │    │                 │    │                 │
│ - Upload Image  │───▶│ - Queue Tasks   │───▶│ - Process OCR   │
│ - Return TaskID │    │ - Store Results │    │ - Parse Data    │
│ - Check Status  │◀───│                 │◀───│ - Save to DB    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### 2. Install Dependencies

```bash
pip install celery redis
```

### 3. Start Redis

**Development:**

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or using Homebrew (macOS)
brew install redis
brew services start redis
```

**Production:**
Redis is included in the Docker Compose setup.

### 4. Start Celery Worker

**Development:**

```bash
# From the backend directory
python start_celery.py

# Or directly with Celery
celery -A app.celery_app worker --loglevel=info --queues=ratelist
```

**Production:**
The Celery worker is automatically started in the Docker container.

## API Changes

### Upload Image Endpoint

**Before:**

```json
{
  "message": "Upload received. Processing in background."
}
```

**After:**

```json
{
  "message": "Upload received. Processing in background.",
  "task_id": "abc123-def456-ghi789"
}
```

### New Task Status Endpoint

```http
GET /ratelist/task_status/{task_id}
```

**Response:**

```json
{
  "state": "PROGRESS",
  "status": "Processing rate data...",
  "progress": 60
}
```

**Possible States:**

- `PENDING`: Task is queued
- `STARTED`: Task has started
- `PROGRESS`: Task is running (with progress updates)
- `SUCCESS`: Task completed successfully
- `FAILURE`: Task failed

## Benefits

### 1. Non-Blocking Operations

- OCR processing no longer blocks other API requests
- Multiple uploads can be processed simultaneously
- API remains responsive during heavy processing

### 2. Better User Experience

- Immediate response with task ID
- Real-time progress updates
- Ability to cancel or retry tasks

### 3. Scalability

- Multiple worker processes can be added
- Tasks can be distributed across multiple servers
- Better resource utilization

### 4. Monitoring and Debugging

- Task status tracking
- Detailed error reporting
- Progress monitoring

## Monitoring

### Check Worker Status

```bash
celery -A app.celery_app inspect active
celery -A app.celery_app inspect stats
```

### Monitor Queue

```bash
celery -A app.celery_app inspect reserved
```

### View Task Results

```python
from app.celery_app import celery_app
result = celery_app.AsyncResult('task_id')
print(result.state, result.info)
```

## Error Handling

The system includes comprehensive error handling:

1. **Task Timeouts**: 30-minute hard limit, 25-minute soft limit
2. **Database Rollback**: Failed tasks don't corrupt data
3. **File Cleanup**: Temporary files are automatically removed
4. **Status Updates**: Database status is updated on failure
5. **Detailed Logging**: All operations are logged for debugging

## Performance Improvements

### Before (Blocking)

- Upload: 2-3 seconds
- Processing: 15-30 seconds (blocks other requests)
- Total blocking time: 15-30 seconds

### After (Non-Blocking)

- Upload: 2-3 seconds (immediate response)
- Processing: 15-30 seconds (background)
- Other requests: Unaffected

## Troubleshooting

### Common Issues

1. **Redis Connection Error**

   ```
   Error: Redis connection failed
   Solution: Ensure Redis is running on localhost:6379
   ```

2. **Worker Not Processing Tasks**

   ```
   Error: Tasks stuck in PENDING state
   Solution: Check if Celery worker is running
   ```

3. **Database Connection Issues**
   ```
   Error: Database session errors in worker
   Solution: Ensure database is accessible from worker
   ```

### Debug Commands

```bash
# Check Redis
redis-cli ping

# Check Celery worker
celery -A app.celery_app inspect ping

# Monitor tasks
celery -A app.celery_app events

# Purge queue (emergency)
celery -A app.celery_app purge
```

## Migration Guide

### For Frontend Developers

Update your upload handling to use the new task-based approach:

```javascript
// Old approach
const response = await uploadImage(formData);
// Wait for processing...

// New approach
const response = await uploadImage(formData);
const taskId = response.data.task_id;

// Poll for status
const checkStatus = async () => {
  const statusResponse = await getTaskStatus(taskId);
  if (statusResponse.data.state === "SUCCESS") {
    // Processing complete
  } else if (statusResponse.data.state === "FAILURE") {
    // Handle error
  } else {
    // Still processing, check again in 2 seconds
    setTimeout(checkStatus, 2000);
  }
};
```

This new system ensures that your API remains responsive and scalable while handling heavy background processing tasks.
