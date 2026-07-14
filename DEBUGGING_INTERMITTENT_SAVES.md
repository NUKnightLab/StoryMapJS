# Strategy for Debugging Intermittent Save Failures

## The Actual Problem (User-Reported Symptom)

**What we know:**
- Users experience save failures
- User retries the save (immediately or later)
- Retry succeeds WITHOUT user changing data
- This happens intermittently (not every time)

**What we DON'T know:**
- What error message the user sees
- Whether the failure is at the storage layer or elsewhere
- What varies between the failing and succeeding requests
- Whether this is even related to the S3 errors we found in logs

## What We Found in Logs (May or May Not Be Related)

We found these S3 errors in production logs:
1. `RequestHeaderSectionTooLarge` - HTTP headers exceed 8KB limit
2. `KeyTooLongError` - S3 object key exceeds 1024 bytes

**CRITICAL**: We have NOT confirmed these are the errors users experience intermittently. These could be:
- Unrelated errors from different operations
- One-time occurrences from specific edge cases
- Not the "intermittent save failure" issue at all

## Current Knowledge Gaps

### Gap 1: We don't know what errors users actually see
- Need to capture every error that reaches the user
- Need to know which errors are intermittent vs permanent

### Gap 2: We can't correlate failures with retries
- When a save fails, we don't track it
- When a save succeeds, we don't know if it's a retry
- No way to identify "same data, different outcome"

### Gap 3: We don't log successful operations
- Only logging failures means we can't see the pattern
- Need to see: fail → success sequences
- Need to measure: how often saves fail vs succeed

### Gap 4: We don't capture request variance
- What changes between attempt 1 (fail) and attempt 2 (success)?
- Key length? Content size? Timing? Connection state?

## Diagnostic Strategy (What We've Implemented)

### 1. Log ALL Storage Operations (Success and Failure)

**Added logging to save operations:**
```
[SAVE_ATTEMPT] save_json: key=... key_len=... content_size=...
[SAVE_SUCCESS] save_json: key=...
[SAVE_ATTEMPT] save_bytes_from_data: key=... key_len=... content_size=... type=...
[SAVE_SUCCESS] save_bytes_from_data: key=...
```

**Purpose**:
- See every save attempt (fail or succeed)
- Track key lengths and content sizes
- Identify patterns in successful vs failed saves

### 2. Log ALL Errors with Complete Context

**Added to exception handler:**
```
[STORAGE_ERROR] ClientError: {error_code} in {function}()
[STORAGE_ERROR] Key: {key}... (len={length})
[STORAGE_ERROR] Content size: {size}
[STORAGE_ERROR] Error response: {full_response}
```

**Purpose**:
- Capture EVERY error, not just specific codes
- See full S3 error response
- Understand error distribution (which errors are common?)

### 3. Enhanced Specific Error Diagnostics

**For known problematic errors** (`KeyTooLongError`, `RequestHeaderSectionTooLarge`):
- Break down key into components
- Show exact byte lengths
- Log boto3 configuration

**Purpose**: If these ARE the intermittent errors, we'll understand why

## How to Use This Data

### When the intermittent issue occurs:

1. **Identify the error:**
   ```bash
   grep "\[STORAGE_ERROR\]" /var/log/storymapjs/error.log | tail -50
   ```
   This shows the actual error code and response

2. **Find the failed save attempt:**
   ```bash
   grep "\[SAVE_ATTEMPT\]" /var/log/storymapjs/error.log | grep -B 2 -A 10 "STORAGE_ERROR"
   ```
   This shows what was being saved when it failed

3. **Look for retry pattern:**
   ```bash
   grep "key=storymapjs/USER_ID/STORYMAP_ID" /var/log/storymapjs/error.log
   ```
   Replace USER_ID and STORYMAP_ID from the failed save.
   This shows all attempts for the same StoryMap

4. **Compare failure to success:**
   Look at the `key_len` and `content_size` values:
   - Are they identical? → Error is not data-dependent
   - Are they different? → Identifies what changed between attempts

### What patterns to look for:

**Pattern 1: Same key/size, different outcomes**
```
[SAVE_ATTEMPT] save_json: key=storymapjs/user/map/draft.json... key_len=856 content_size=12345
[STORAGE_ERROR] ClientError: RequestHeaderSectionTooLarge
[SAVE_ATTEMPT] save_json: key=storymapjs/user/map/draft.json... key_len=856 content_size=12345
[SAVE_SUCCESS] save_json: key=storymapjs/user/map/draft.json...
```
**Conclusion**: Error is intermittent even with identical data → Likely boto3/S3/network issue

**Pattern 2: Different size, different outcomes**
```
[SAVE_ATTEMPT] save_json: key_len=856 content_size=12345
[STORAGE_ERROR] ClientError: RequestHeaderSectionTooLarge
[SAVE_ATTEMPT] save_json: key_len=745 content_size=10000
[SAVE_SUCCESS]
```
**Conclusion**: User changed something (removed image, edited content) → Data-dependent error

**Pattern 3: Specific error code dominates**
```
[STORAGE_ERROR] ClientError: RequestHeaderSectionTooLarge (90% of errors)
[STORAGE_ERROR] ClientError: KeyTooLongError (5% of errors)
[STORAGE_ERROR] ClientError: SlowDown (5% of errors)
```
**Conclusion**: Focus investigation on the dominant error

**Pattern 4: No errors in logs but user reports failure**
```
[SAVE_ATTEMPT] save_json
[SAVE_SUCCESS] save_json
(but user says it failed)
```
**Conclusion**: Error is happening outside storage layer (frontend? middleware? nginx?)

## Next Steps Based on Findings

### If errors ARE in logs:
- Focus on the specific error code identified
- Analyze the pattern (data-dependent vs intermittent)
- Implement targeted fix

### If errors NOT in logs:
- Add logging at API layer (before storage calls)
- Check nginx/gunicorn logs for upstream issues
- Add frontend error tracking

### If errors are intermittent with identical data:
- Investigate boto3 retry behavior
- Check S3 service status during failure times
- Consider connection pooling issues
- Look at AWS Signature V4 generation variance

### If errors are data-dependent:
- Implement validation (key length, content size limits)
- Add user-facing warnings before save
- Provide clearer error messages

## Current State

**What we've deployed:**
1. Comprehensive logging of all save operations
2. Full error context capture
3. Success tracking for correlation
4. Slug length limiting (200 chars) to prevent one class of long keys

**What we're waiting for:**
- Real production error occurrence
- Log analysis to identify actual error
- Pattern identification (intermittent vs data-dependent)

**No assumptions** - just data collection and analysis.
