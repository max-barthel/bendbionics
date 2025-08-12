# Retry Mechanism Integration Guide

## Overview

The retry mechanism is now automatically applied to all API calls. No changes needed to existing code!

## Current Usage (Already Working)

Your existing `Form.tsx` component already benefits from the retry mechanism:

```typescript
// This line automatically includes retry logic
const result = await robotAPI.computePCC(params);
```

## Optional: Custom Retry Configuration

If you want to customize retry behavior for specific calls:

```typescript
// More aggressive retry for critical operations
const result = await robotAPI.computePCC(params, {
  maxRetries: 5,
  baseDelay: 500,
  maxDelay: 5000,
});

// Conservative retry for user-facing operations
const result = await robotAPI.computePCC(params, {
  maxRetries: 2,
  baseDelay: 2000,
  maxDelay: 15000,
});
```

## Optional: React Hook Usage

For components that need loading states and error handling:

```typescript
import { useRetryAPI } from "../hooks/useRetryAPI";

function MyComponent() {
  const { data, loading, error, execute, reset } = useRetryAPI();

  const handleSubmit = async () => {
    const result = await execute(params);
    if (result) {
      // Handle success
    }
  };

  return (
    <div>
      {loading && <div>Processing...</div>}
      {error && <div>Error: {error}</div>}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

## What's Retried Automatically

- Network timeouts and connection errors
- HTTP 408, 429, 500, 502, 503, 504 status codes
- Exponential backoff prevents server overload

## Default Configuration

- 3 retry attempts
- 1 second base delay
- 10 second maximum delay
- Exponential backoff (1s, 2s, 4s delays)

## Testing

The retry mechanism is tested in `src/api/__tests__/retry.test.ts`.

## No Breaking Changes

All existing code continues to work exactly as before, but now with automatic retry protection.
