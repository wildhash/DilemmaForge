# DilemmaForge API Documentation

## Overview
DilemmaForge uses Redis for data persistence and provides a clean API for vote submission, data retrieval, and statistics calculation.

## Data Models

### UserVote
Represents a single user's vote for a specific day.

```typescript
interface UserVote {
  choice: 'cooperate' | 'defect' | null;
  timestamp: number;        // Unix timestamp in milliseconds
  day: string;             // Format: YYYY-MM-DD
}
```

### DailyResults
Aggregate results for a specific day.

```typescript
interface DailyResults {
  day: string;
  totalVotes: number;
  cooperateCount: number;
  defectCount: number;
  cooperatePercent: number;
  defectPercent: number;
  outcome: 'all-cooperate' | 'all-defect' | 'mixed';
  pointsForCooperators: number;
  pointsForDefectors: number;
}
```

### UserStats
Cumulative statistics for a user.

```typescript
interface UserStats {
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  totalVotes: number;
  cooperateCount: number;
  defectCount: number;
  history: string[];  // Serialized history entries
}
```

## Redis Key Schema

### Vote Storage
```
post:{postId}:user:{userId}:day:{YYYY-MM-DD}:vote
```
Stores: JSON stringified UserVote
- One per user per day
- Prevents duplicate voting
- Includes timestamp for audit

### Daily Aggregates
```
post:{postId}:day:{YYYY-MM-DD}:cooperate
post:{postId}:day:{YYYY-MM-DD}:defect
```
Stores: Integer count
- Incremented atomically with `incrBy`
- Used for real-time vote counting
- Never decremented

### Daily Results
```
post:{postId}:day:{YYYY-MM-DD}:results
```
Stores: JSON stringified DailyResults
- Calculated at midnight UTC
- Cached for performance
- Includes point awards

### User Statistics
```
post:{postId}:user:{userId}:stats
```
Stores: JSON stringified UserStats
- Updated after each vote
- Includes lifetime totals
- Streak calculations

### User History
```
post:{postId}:user:{userId}:history
```
Stores: JSON array of history entries
- Each entry: `{ day, choice }`
- Used for streak calculation
- Used for emoji grid generation

## Core Functions

### getCurrentDay()
Returns the current UTC day as a string.

```typescript
function getCurrentDay(): string
```

**Returns**: String in format `YYYY-MM-DD`

**Example**:
```typescript
const today = getCurrentDay(); // "2024-02-10"
```

---

### calculateResults()
Calculates the outcome and point distribution based on vote counts.

```typescript
function calculateResults(
  cooperateCount: number,
  defectCount: number
): {
  outcome: DailyResults['outcome'];
  pointsForCooperators: number;
  pointsForDefectors: number;
}
```

**Parameters**:
- `cooperateCount`: Number of cooperate votes
- `defectCount`: Number of defect votes

**Returns**: Object with outcome and points

**Logic**:
- If `cooperatePercent >= 70%`: All get +3 points
- If `defectPercent >= 70%`: All get +1 point
- Otherwise (mixed): Defectors get +5, Cooperators get 0

**Examples**:
```typescript
// All Cooperate
calculateResults(7, 1);
// => { outcome: 'all-cooperate', pointsForCooperators: 3, pointsForDefectors: 3 }

// All Defect
calculateResults(1, 7);
// => { outcome: 'all-defect', pointsForCooperators: 1, pointsForDefectors: 1 }

// Mixed
calculateResults(2, 3);
// => { outcome: 'mixed', pointsForCooperators: 0, pointsForDefectors: 5 }
```

---

### getEmojiForChoice()
Returns the emoji representation for a choice.

```typescript
function getEmojiForChoice(choice: Choice): string
```

**Parameters**:
- `choice`: 'cooperate' | 'defect' | null

**Returns**: 
- `'🤝'` for cooperate
- `'⚔️'` for defect
- `'⬜'` for null

---

### generateShareGrid()
Generates a shareable emoji grid from voting history.

```typescript
function generateShareGrid(
  history: { day: string; choice: Choice }[]
): string
```

**Parameters**:
- `history`: Array of voting history entries (max 30 used)

**Returns**: Multi-line string with emoji grid

**Format**:
```
DilemmaForge Streak:
🤝🤝⚔️🤝⚔️🤝🤝🤝⚔️🤝
🤝⚔️🤝🤝🤝
```

---

### calculateStreak()
Calculates current and longest streak from history.

```typescript
function calculateStreak(
  history: { day: string; choice: Choice }[]
): {
  currentStreak: number;
  longestStreak: number;
}
```

**Parameters**:
- `history`: Array of voting history entries

**Returns**: Current and longest streak counts

**Logic**:
- Current streak: consecutive days from today backwards
- Longest streak: maximum consecutive days in all history
- Breaks on skipped days

---

### updateUserStats()
Updates user statistics after a vote.

```typescript
function updateUserStats(
  currentStats: UserStats,
  newVote: { choice: Choice; day: string },
  points: number
): UserStats
```

**Parameters**:
- `currentStats`: Current user statistics
- `newVote`: New vote to add
- `points`: Points to award

**Returns**: Updated UserStats object

---

## Vote Submission Flow

### 1. Check Existing Vote
```typescript
const voteKey = KEYS.userVote(postId, userId, currentDay);
const existingVote = await context.redis.get(voteKey);
if (existingVote) {
  // User already voted today
  return;
}
```

### 2. Save Vote
```typescript
const vote: UserVote = {
  choice,
  timestamp: Date.now(),
  day: currentDay,
};
await context.redis.set(voteKey, JSON.stringify(vote));
```

### 3. Increment Counter
```typescript
if (choice === 'cooperate') {
  const cooperateKey = KEYS.dailyCooperateCount(postId, currentDay);
  await context.redis.incrBy(cooperateKey, 1);
} else {
  const defectKey = KEYS.dailyDefectCount(postId, currentDay);
  await context.redis.incrBy(defectKey, 1);
}
```

### 4. Update History
```typescript
const historyKey = KEYS.userHistory(postId, userId);
const historyData = await context.redis.get(historyKey);
const history = historyData ? JSON.parse(historyData) : [];
history.push({ day: currentDay, choice });
await context.redis.set(historyKey, JSON.stringify(history));
```

### 5. Update Stats
```typescript
const statsKey = KEYS.userStats(postId, userId);
const currentStats = await context.redis.get(statsKey);
const updatedStats = updateUserStats(currentStats, newVote, 0);
await context.redis.set(statsKey, JSON.stringify(updatedStats));
```

## Result Retrieval Flow

### 1. Get Vote Counts
```typescript
const cooperateKey = KEYS.dailyCooperateCount(postId, currentDay);
const defectKey = KEYS.dailyDefectCount(postId, currentDay);

const cooperateCount = parseInt((await context.redis.get(cooperateKey)) || '0');
const defectCount = parseInt((await context.redis.get(defectKey)) || '0');
```

### 2. Calculate Percentages
```typescript
const totalVotes = cooperateCount + defectCount;
const cooperatePercent = totalVotes > 0 ? (cooperateCount / totalVotes) * 100 : 0;
const defectPercent = totalVotes > 0 ? (defectCount / totalVotes) * 100 : 0;
```

### 3. Determine Outcome
```typescript
const { outcome, pointsForCooperators, pointsForDefectors } = 
  calculateResults(cooperateCount, defectCount);
```

### 4. Build Results Object
```typescript
const results: DailyResults = {
  day: currentDay,
  totalVotes,
  cooperateCount,
  defectCount,
  cooperatePercent,
  defectPercent,
  outcome,
  pointsForCooperators,
  pointsForDefectors,
};
```

## Midnight Reveal Process

### Scheduler Job
```typescript
Devvit.addSchedulerJob({
  name: 'midnight_reveal',
  onRun: async (event, context) => {
    // 1. Get all active post IDs
    // 2. For each post:
    //    - Calculate final results
    //    - Award points to all voters
    //    - Update streaks
    //    - Cache results
  },
});
```

### Point Distribution
```typescript
// For each user who voted
const vote = await getUserVote(postId, userId, previousDay);
const points = vote.choice === 'cooperate' 
  ? results.pointsForCooperators 
  : results.pointsForDefectors;

// Update user stats with points
await updateUserStats(userId, points);
```

## Error Handling

### Vote Validation
```typescript
if (!isValidChoice(choice)) {
  throw new Error('Invalid choice');
}

if (hasVotedToday) {
  throw new Error('Already voted today');
}
```

### Redis Errors
```typescript
try {
  await context.redis.set(key, value);
} catch (error) {
  console.error('Redis error:', error);
  context.ui.showToast({
    text: 'Failed to save vote. Please try again.',
    appearance: 'error',
  });
}
```

## Performance Considerations

### Atomic Operations
- Use `incrBy` for vote counting (atomic)
- Avoid read-modify-write patterns
- Use pipelining for multiple operations

### Caching
- Cache daily results after midnight
- Cache user stats locally in component state
- Use `useAsync` dependencies for smart updates

### Optimization
- Minimize Redis round trips
- Batch operations when possible
- Use indexes for efficient queries

## Security

### Validation
- Validate all user input
- Check vote status before accepting
- Verify user authentication

### Privacy
- Don't expose individual votes
- Only show aggregate results
- User can only see their own history

### Rate Limiting
- One vote per day per user
- Prevent spam voting
- Validate timestamps

## Testing

### Unit Tests
```typescript
// Test vote calculation
const result = calculateResults(7, 3);
assert.equal(result.outcome, 'all-cooperate');
assert.equal(result.pointsForCooperators, 3);
```

### Integration Tests
```typescript
// Test full vote flow
await submitVote('cooperate');
const results = await getResults();
assert.equal(results.cooperateCount, 1);
```

## Monitoring

### Metrics to Track
- Total votes per day
- Cooperate vs Defect ratio
- Average response time
- Error rate
- Redis memory usage

### Logging
```typescript
console.log('Vote submitted:', { userId, choice, day });
console.error('Vote failed:', { userId, error });
```

## Migration & Updates

### Schema Changes
- Always backward compatible
- Migrate data gracefully
- Version your data structures

### Data Cleanup
- Archive old daily results
- Keep last 90 days of data
- Aggregate older statistics

---

## Support

For questions or issues:
- Check the [README](./README.md)
- Review [TESTING.md](./TESTING.md)
- Open an issue on GitHub
