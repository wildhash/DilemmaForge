import { Devvit, useState, useAsync } from '@devvit/public-api';
import {
  Choice,
  UserVote,
  DailyResults,
  UserStats,
  getCurrentDay,
  getNextMidnightUTC,
  calculateResults,
  getEmojiForChoice,
  generateShareGrid,
} from './utils/game.js';
import {
  calculateStreak,
  updateUserStats,
  isValidChoice,
} from './utils/streaks.js';
import { REDIS_KEYS } from './utils/constants.js';

// Configure Devvit
Devvit.configure({
  redditAPI: true,
  redis: true,
  media: false,
});

/**
 * Helper to safely parse JSON with error handling.
 * @param data - String to parse
* @param fallback - Value to return if parsing fails (optional)
* @returns Parsed object, fallback, or null (if no fallback provided)
 */
function safeJSONParse<T>(data: string | null | undefined): T | null;
function safeJSONParse<T>(data: string | null | undefined, fallback: T): T;
function safeJSONParse<T>(
  data: string | null | undefined,
  fallback?: T
): T | null {
  if (!data) return fallback ?? null;
  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback ?? null;
  }
}

function createLockId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function releaseLock(
  context: any,
  lockKey: string,
  lockId: string,
  label: string
): Promise<void> {
  try {
    const currentLockId = await context.redis.get(lockKey);
    if (currentLockId === lockId) {
      await context.redis.del(lockKey);
    }
  } catch (error) {
    console.error(`Error releasing ${label} lock:`, error);
  }
}

/**
 * Finalizes daily results and stores them in Redis.
 * Idempotent - safe to call multiple times for the same day.
 * 
 * @param context - Devvit context with redis access
 * @param postId - The post ID
 * @param day - ISO date string (YYYY-MM-DD)
 */
async function finalizeDailyResults(
  context: any,
  postId: string,
  day: string
): Promise<void> {
  try {
    const lockKey = REDIS_KEYS.dailyFinalizeLock(postId, day);
    const lockId = createLockId();
    const lockAcquired = await context.redis.set(lockKey, lockId, {
      nx: true,
      expiration: new Date(Date.now() + 30_000),
    });

    if (!lockAcquired) {
      return;
    }

    try {
      const finalizedKey = REDIS_KEYS.dailyFinalized(postId, day);

      const resultsKey = REDIS_KEYS.dailyResults(postId, day);
      const [alreadyFinalized, existingResultsData] = await Promise.all([
        context.redis.get(finalizedKey),
        context.redis.get(resultsKey),
      ]);

      if (existingResultsData) {
        if (!alreadyFinalized) {
          await context.redis.set(finalizedKey, 'true');
        }
        return;
      }
      
      // Get vote counts
      const cooperateKey = REDIS_KEYS.dailyCooperateCount(postId, day);
      const defectKey = REDIS_KEYS.dailyDefectCount(postId, day);
      
      const [cooperateCountStr, defectCountStr] = await Promise.all([
        context.redis.get(cooperateKey),
        context.redis.get(defectKey),
      ]);
      
      const cooperateCount = parseInt(cooperateCountStr || '0', 10);
      const defectCount = parseInt(defectCountStr || '0', 10);
      
      if (isNaN(cooperateCount) || isNaN(defectCount)) {
        console.error(`Invalid vote counts for ${day}: cooperate=${cooperateCountStr}, defect=${defectCountStr}`);
        return;
      }
      
      if (cooperateCount === 0 && defectCount === 0) {
        return; // No votes to finalize
      }
      
      // Calculate results
      const { outcome, pointsForCooperators, pointsForDefectors } = 
        calculateResults(cooperateCount, defectCount);
      
      // Store finalized results
      const results: DailyResults = {
        day,
        totalVotes: cooperateCount + defectCount,
        cooperateCount,
        defectCount,
        cooperatePercent: (cooperateCount / (cooperateCount + defectCount)) * 100,
        defectPercent: (defectCount / (cooperateCount + defectCount)) * 100,
        outcome,
        pointsForCooperators,
        pointsForDefectors,
      };

      await context.redis.mSet({
        [resultsKey]: JSON.stringify(results),
        [finalizedKey]: 'true',
      });
      
      console.log(`Finalized results for ${day}: ${outcome} (${cooperateCount}C/${defectCount}D)`);
    } finally {
      await releaseLock(context, lockKey, lockId, 'finalize');
    }
  } catch (error) {
    console.error(`Error finalizing results for ${day}:`, error);
    // Don't throw - allow app to continue
  }
}

/**
 * Awards points to a user for a finalized day.
 * Idempotent - safe to call multiple times for the same user/day.
 * 
 * @param context - Devvit context with redis access
 * @param postId - The post ID
 * @param userId - The user ID
 * @param day - ISO date string (YYYY-MM-DD)
 */
async function awardUserPoints(
  context: any,
  postId: string,
  userId: string,
  day: string
): Promise<void> {
  try {
    // Check if already awarded
    const voteKey = REDIS_KEYS.userVote(postId, userId, day);
    const voteData = await context.redis.get(voteKey);
    
    if (!voteData) return;
    
    const vote = safeJSONParse<UserVote>(voteData);
    if (!vote?.choice) {
      console.error(`Invalid vote data for user ${userId} on ${day}`);
      return;
    }
    
    if (vote.pointsAwarded) return;
    
    // Ensure results exist before taking the per-user award lock.
    const resultsKey = REDIS_KEYS.dailyResults(postId, day);
    let resultsData = await context.redis.get(resultsKey);
    
    if (!resultsData) {
      await finalizeDailyResults(context, postId, day);
      resultsData = await context.redis.get(resultsKey);
    }

    if (!resultsData) return;
    
    const results = safeJSONParse<DailyResults>(resultsData);
    if (!results) {
      console.error(`Invalid results data for ${day}`);
      return;
    }
    
    // Determine points based on user's choice
    const points = vote.choice === 'cooperate' 
      ? results.pointsForCooperators 
      : results.pointsForDefectors;

    const scoreKey = REDIS_KEYS.userScore(postId, userId);
    const existingScore = await context.redis.get(scoreKey);
    if (!existingScore) {
      const statsKey = REDIS_KEYS.userStats(postId, userId);
      const statsData = await context.redis.get(statsKey);
      const stats = safeJSONParse<UserStats>(statsData);
      if (stats && typeof stats.totalScore === 'number' && !isNaN(stats.totalScore)) {
        await context.redis.set(scoreKey, String(stats.totalScore), { nx: true });
      }
    }

    const lockKey = REDIS_KEYS.userAwardLock(postId, userId, day);
    const lockId = createLockId();
    const lockAcquired = await context.redis.set(lockKey, lockId, {
      nx: true,
      expiration: new Date(Date.now() + 30_000),
    });

    if (!lockAcquired) {
      return;
    }

    try {
      const freshVoteData = await context.redis.get(voteKey);
      const freshVote = safeJSONParse<UserVote>(freshVoteData);

      if (!freshVote?.choice) {
        console.error(`Invalid vote data for user ${userId} on ${day}`);
        return;
      }

      if (freshVote.pointsAwarded) return;

      freshVote.pointsAwarded = true;
      freshVote.pointsAwardedAt = Date.now();

      const tx = await context.redis.watch(voteKey, scoreKey);
      await tx.multi();
      await tx.incrBy(scoreKey, points);
      await tx.set(voteKey, JSON.stringify(freshVote));
      await tx.exec();
      
      console.log(`Awarded ${points} points to user ${userId} for ${day}`);
    } finally {
      await releaseLock(context, lockKey, lockId, 'award');
    }
  } catch (error) {
    console.error(`Error awarding points to user ${userId} for ${day}:`, error);
    // Don't throw - allow app to continue
  }
}

// Custom Post Component
Devvit.addCustomPostType({
  name: 'DilemmaForge',
  height: 'tall',
  render: (context) => {
    const [currentView, setCurrentView] = useState('game');
    const [hasVotedToday, setHasVotedToday] = useState(false);
    const [userChoice, setUserChoice] = useState<Choice>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const postId = context.postId || 'default';
    const userId = context.userId || 'anonymous';
    const currentDay = getCurrentDay();

    // Load user's vote for today
    const { data: todayVote, loading: voteLoading } = useAsync<any>(async () => {
      const voteKey = REDIS_KEYS.userVote(postId, userId, currentDay);
      const voteData = await context.redis.get(voteKey);
      
      if (voteData) {
        const vote = safeJSONParse<UserVote>(voteData);
        if (vote?.choice) {
          setHasVotedToday(true);
          setUserChoice(vote.choice);
          return vote;
        }
      }
      return null;
    }, {
      depends: [refreshKey],
    });

    // Load today's results
    const { data: todayResults, loading: resultsLoading } = useAsync<any>(async () => {
      const resultsKey = REDIS_KEYS.dailyResults(postId, currentDay);
      const resultsData = await context.redis.get(resultsKey);
      
      if (resultsData) {
        const results = safeJSONParse<DailyResults>(resultsData);
        if (results) return results;
      }
      
      // Calculate current counts (parallel fetch for better performance)
      const cooperateKey = REDIS_KEYS.dailyCooperateCount(postId, currentDay);
      const defectKey = REDIS_KEYS.dailyDefectCount(postId, currentDay);
      
      const [cooperateCountStr, defectCountStr] = await Promise.all([
        context.redis.get(cooperateKey),
        context.redis.get(defectKey),
      ]);
      
      const cooperateCount = parseInt(cooperateCountStr || '0', 10) || 0;
      const defectCount = parseInt(defectCountStr || '0', 10) || 0;
      
      const totalVotes = cooperateCount + defectCount;
      const cooperatePercent = totalVotes > 0 ? (cooperateCount / totalVotes) * 100 : 0;
      const defectPercent = totalVotes > 0 ? (defectCount / totalVotes) * 100 : 0;
      
      const { outcome, pointsForCooperators, pointsForDefectors } = 
        calculateResults(cooperateCount, defectCount);
      
      return {
        day: currentDay,
        totalVotes,
        cooperateCount,
        defectCount,
        cooperatePercent,
        defectPercent,
        outcome,
        pointsForCooperators,
        pointsForDefectors,
      } as DailyResults;
    }, {
      depends: [refreshKey],
    });

    // Load user stats
    const { data: userStats, loading: statsLoading } = useAsync<any>(async () => {
      const statsKey = REDIS_KEYS.userStats(postId, userId);
      const scoreKey = REDIS_KEYS.userScore(postId, userId);
      
      // Check and finalize yesterday if needed
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Try to finalize yesterday's results
      await finalizeDailyResults(context, postId, yesterdayStr);
      
      // Award points for yesterday if user voted
      await awardUserPoints(context, postId, userId, yesterdayStr);
      
      // Reload stats after potential point award
      const updatedStatsData = await context.redis.get(statsKey);

      const scoreData = await context.redis.get(scoreKey);
      
      if (updatedStatsData) {
        const stats = safeJSONParse<UserStats>(updatedStatsData);
        if (stats) {
          const totalScore = scoreData
            ? parseInt(scoreData || '0', 10) || 0
            : (typeof stats.totalScore === 'number' ? stats.totalScore : 0);

          if (!scoreData && totalScore > 0) {
            await context.redis.set(scoreKey, String(totalScore), { nx: true });
          }

          stats.totalScore = totalScore;
          return stats;
        }
      }

      const totalScore = parseInt(scoreData || '0', 10) || 0;
      
      return {
        totalScore,
        currentStreak: 0,
        longestStreak: 0,
        totalVotes: 0,
        cooperateCount: 0,
        defectCount: 0,
        history: [],
      } as UserStats;
    }, {
      depends: [refreshKey],
    });

    // Handle vote submission
    const handleVote = async (choice: Choice) => {
      if (!choice || hasVotedToday || !isValidChoice(choice)) return;

      try {
        const voteKey = REDIS_KEYS.userVote(postId, userId, currentDay);
        const vote: UserVote = {
          choice,
          timestamp: Date.now(),
          day: currentDay,
        };
        
        // Save vote (NX to avoid double-voting under rapid taps / concurrency)
        const setResult = await context.redis.set(voteKey, JSON.stringify(vote), {
          nx: true,
        });

        if (!setResult) {
          const existingVoteData = await context.redis.get(voteKey);
          const existingVote = safeJSONParse<UserVote>(existingVoteData);
          if (existingVote?.choice) {
            setHasVotedToday(true);
            setUserChoice(existingVote.choice);
          }
          
          context.ui.showToast({
            text: 'You already voted today',
            appearance: 'neutral',
          });
          return;
        }
        
        // Increment count
        if (choice === 'cooperate') {
          const cooperateKey = REDIS_KEYS.dailyCooperateCount(postId, currentDay);
          await context.redis.incrBy(cooperateKey, 1);
        } else {
          const defectKey = REDIS_KEYS.dailyDefectCount(postId, currentDay);
          await context.redis.incrBy(defectKey, 1);
        }
        
        // Update user history
        const historyKey = REDIS_KEYS.userHistory(postId, userId);
        const historyData = await context.redis.get(historyKey);
        const history = safeJSONParse<any[]>(historyData, []);
        const newHistoryEntry = { day: currentDay, choice };
        history.push(newHistoryEntry);
        await context.redis.set(historyKey, JSON.stringify(history));
        
        // Update user stats (without points yet - awarded at midnight)
        const statsKey = REDIS_KEYS.userStats(postId, userId);
        const currentStatsData = await context.redis.get(statsKey);
        const scoreKey = REDIS_KEYS.userScore(postId, userId);
        const scoreData = await context.redis.get(scoreKey);
        let totalScore = scoreData ? parseInt(scoreData || '0', 10) || 0 : 0;
        if (!scoreData && currentStatsData) {
          const existingStats = safeJSONParse<UserStats>(currentStatsData);
          if (existingStats && typeof existingStats.totalScore === 'number' && !isNaN(existingStats.totalScore)) {
            totalScore = existingStats.totalScore;
            if (totalScore > 0) {
              await context.redis.set(scoreKey, String(totalScore), { nx: true });
            }
          }
        }
        const currentStats: UserStats = safeJSONParse<UserStats>(
          currentStatsData,
          {
            totalScore,
            currentStreak: 0,
            longestStreak: 0,
            totalVotes: 0,
            cooperateCount: 0,
            defectCount: 0,
            history: [],
          }
        );

        currentStats.totalScore = totalScore;
        
        // Update stats (points will be added at midnight reveal)
        const updatedStats = updateUserStats(currentStats, newHistoryEntry, 0);
        await context.redis.set(statsKey, JSON.stringify(updatedStats));
        
        setHasVotedToday(true);
        setUserChoice(choice);
        setRefreshKey((prev) => prev + 1);
        
        context.ui.showToast({
          text: `Vote submitted: ${choice === 'cooperate' ? '🤝 Cooperate' : '⚔️ Defect'}`,
          appearance: 'success',
        });
      } catch (error) {
        console.error('Failed to submit vote:', error);
        context.ui.showToast({
          text: '❌ Failed to submit vote. Please try again.',
          appearance: 'neutral',
        });
      }
    };

    // Render loading state
    if (voteLoading || resultsLoading || statsLoading) {
      return (
        <vstack alignment="center middle" height="100%" gap="medium" padding="large">
          <text size="xlarge" weight="bold">DilemmaForge</text>
          <text size="medium">Loading...</text>
        </vstack>
      );
    }

    // Render game view
    if (currentView === 'game') {
      return (
        <vstack alignment="center middle" height="100%" gap="medium" padding="large">
          <vstack alignment="center middle" gap="small">
            <text size="xxlarge" weight="bold">⚖️ DilemmaForge</text>
            <text size="small" color="neutral-content-weak">
              Daily Prisoner's Dilemma
            </text>
          </vstack>

          <spacer size="medium" />

          {!hasVotedToday ? (
            <vstack alignment="center middle" gap="large" width="100%">
              <vstack gap="small" padding="medium" backgroundColor="blue-50" cornerRadius="medium" width="100%">
                <text size="small" weight="bold">💡 How it works:</text>
                <text size="small">
                  This is a daily Prisoner's Dilemma. Short-term betrayal vs long-term trust.
                  Your choice affects everyone's outcome!
                </text>
              </vstack>
              
              <text size="large" weight="bold" alignment="center">
                Make Your Choice Today
              </text>
              
              <text size="medium" alignment="center">
                Swipe or tap to choose:
              </text>

              <hstack gap="medium" width="100%">
                <vstack 
                  alignment="center middle" 
                  gap="small" 
                  padding="large"
                  backgroundColor="blue-100"
                  cornerRadius="large"
                  grow
                  onPress={() => handleVote('cooperate')}
                >
                  <text size="xxlarge">🤝</text>
                  <text size="large" weight="bold">Cooperate</text>
                  <text size="small" alignment="center">
                    Work together for mutual benefit
                  </text>
                </vstack>

                <vstack 
                  alignment="center middle" 
                  gap="small" 
                  padding="large"
                  backgroundColor="red-100"
                  cornerRadius="large"
                  grow
                  onPress={() => handleVote('defect')}
                >
                  <text size="xxlarge">⚔️</text>
                  <text size="large" weight="bold">Defect</text>
                  <text size="small" alignment="center">
                    Go solo for potential gain
                  </text>
                </vstack>
              </hstack>

              <vstack gap="small" padding="medium" backgroundColor="neutral-background-weak" cornerRadius="medium">
                <text size="small" weight="bold">Scoring:</text>
                <text size="small">≥70% cooperate: +3 points for all</text>
                <text size="small">≥70% defect: +1 point for all</text>
                <text size="small">Mixed: defectors +5, cooperators 0</text>
              </vstack>
            </vstack>
          ) : (
            <vstack alignment="center middle" gap="large" width="100%">
              <vstack alignment="center middle" gap="small">
                <text size="xxlarge">
                  {userChoice === 'cooperate' ? '🤝' : '⚔️'}
                </text>
                <text size="large" weight="bold">
                  You chose: {userChoice === 'cooperate' ? 'Cooperate' : 'Defect'}
                </text>
                <text size="medium" color="neutral-content-weak">
                  Vote locked for today
                </text>
              </vstack>

              <spacer size="small" />

              <vstack gap="small" padding="large" backgroundColor="neutral-background-weak" cornerRadius="medium" width="100%">
                <text size="medium" weight="bold" alignment="center">
                  Current Results
                </text>
                <text size="small" alignment="center">
                  {todayResults?.totalVotes || 0} total votes
                </text>
                <hstack gap="medium">
                  <vstack grow alignment="center middle">
                    <text size="large">🤝</text>
                    <text size="medium" weight="bold">
                      {todayResults?.cooperateCount || 0}
                    </text>
                    <text size="small">
                      {todayResults?.cooperatePercent.toFixed(1)}%
                    </text>
                  </vstack>
                  <vstack grow alignment="center middle">
                    <text size="large">⚔️</text>
                    <text size="medium" weight="bold">
                      {todayResults?.defectCount || 0}
                    </text>
                    <text size="small">
                      {todayResults?.defectPercent.toFixed(1)}%
                    </text>
                  </vstack>
                </hstack>
              </vstack>

              <text size="small" alignment="center" color="neutral-content-weak">
                Results finalize at midnight UTC
              </text>
            </vstack>
          )}

          <spacer size="medium" />

          {userStats && (
            <vstack gap="small" padding="medium" backgroundColor="neutral-background-weak" cornerRadius="medium" width="100%">
              <text size="medium" weight="bold">Your Stats</text>
              <hstack gap="large">
                <vstack gap="none">
                  <text size="small" color="neutral-content-weak">Score</text>
                  <text size="large" weight="bold">{userStats.totalScore}</text>
                </vstack>
                <vstack gap="none">
                  <text size="small" color="neutral-content-weak">Streak</text>
                  <text size="large" weight="bold">
                    🔥 {userStats.currentStreak}
                  </text>
                </vstack>
                <vstack gap="none">
                  <text size="small" color="neutral-content-weak">Total Votes</text>
                  <text size="large" weight="bold">{userStats.totalVotes}</text>
                </vstack>
              </hstack>
            </vstack>
          )}

          <button onPress={() => setCurrentView('history')}>
            View History
          </button>
        </vstack>
      );
    }

    // Render history view
    if (currentView === 'history') {
      const parsedHistory = (userStats?.history ?? [])
        .map((h) => {
          if (typeof h !== 'string') {
            if (h && typeof h.day === 'string' && (h.choice === null || isValidChoice(h.choice))) {
              return h;
            }
            return null;
          }

          if (/^\d{4}-\d{2}-\d{2}$/.test(h)) {
            return { day: h, choice: null as Choice };
          }

          try {
            const parsed = JSON.parse(h);
            if (
              parsed &&
              typeof parsed.day === 'string' &&
              (parsed.choice === null || isValidChoice(parsed.choice))
            ) {
              return { day: parsed.day, choice: parsed.choice };
            }
          } catch {
            // Ignore
          }
          return null;
        })
        .filter((h): h is { day: string; choice: Choice } => h !== null);

      return (
        <vstack alignment="center top" height="100%" gap="medium" padding="large">
          <hstack alignment="start middle" width="100%">
            <button onPress={() => setCurrentView('game')}>← Back</button>
            <spacer grow />
            <text size="large" weight="bold">Your History</text>
            <spacer grow />
          </hstack>

          <spacer size="small" />

          <vstack gap="small" width="100%">
            <hstack alignment="start middle" width="100%">
              <text size="medium" weight="bold">Emoji Grid</text>
              <spacer grow />
              <button 
                size="small" 
                onPress={() => {
                  if (parsedHistory.length > 0) {
                    const grid = generateShareGrid(parsedHistory.slice(-30));
                    // Note: Clipboard API not available in Devvit, show toast instead
                    context.ui.showToast({
                      text: 'Share your streak: ' + grid.split('\n')[0],
                      appearance: 'success',
                    });
                  }
                }}
              >
                📋 Copy
              </button>
            </hstack>
            <text size="small">
              {parsedHistory.length > 0
                ? generateShareGrid(parsedHistory.slice(-30))
                : 'No votes yet'}
            </text>
          </vstack>

          <vstack gap="small" width="100%">
            <text size="medium" weight="bold">Statistics</text>
            <text size="small">Total Score: {userStats?.totalScore || 0}</text>
            <text size="small">Current Streak: {userStats?.currentStreak || 0} days</text>
            <text size="small">Longest Streak: {userStats?.longestStreak || 0} days</text>
            <text size="small">
              Cooperate: {userStats?.cooperateCount || 0} | Defect: {userStats?.defectCount || 0}
            </text>
          </vstack>
        </vstack>
      );
    }

    return null;
  },
});

// Scheduler: Process midnight UTC reveals
Devvit.addSchedulerJob({
  name: 'midnight_reveal',
  onRun: async (event, context) => {
    console.log('Running midnight reveal job');
    
    // NOTE: For this MVP/demo, results are finalized on-demand when users load stats
    // This ensures points are awarded correctly without needing to track all active posts
    // The finalizeDailyResults() and awardUserPoints() functions handle this automatically
    // when a user opens the post after midnight UTC
    
    // Future production enhancement could iterate through active posts:
    // 1. Get all active post IDs from a registry
    // 2. For each post, call finalizeDailyResults(context, postId, yesterday)
    // 3. Iterate through all voters and call awardUserPoints()
    // 4. Update streaks for all users
    
    return;
  },
});

// Menu action to create a new DilemmaForge post
Devvit.addMenuItem({
  label: 'Create DilemmaForge Post',
  location: 'subreddit',
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    const subreddit = await reddit.getCurrentSubreddit();
    
    const post = await reddit.submitPost({
      title: 'DilemmaForge - Daily Prisoner\'s Dilemma',
      subredditName: subreddit.name,
      preview: (
        <vstack alignment="center middle" height="100%" padding="large" gap="medium">
          <text size="xxlarge">⚖️</text>
          <text size="large" weight="bold">DilemmaForge</text>
          <text size="medium">Will you cooperate or defect today?</text>
        </vstack>
      ),
    });

    ui.showToast({
      text: 'DilemmaForge post created!',
      appearance: 'success',
    });

    ui.navigateTo(post);
  },
});

export default Devvit;
