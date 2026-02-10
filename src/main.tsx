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

// Configure Devvit
Devvit.configure({
  redditAPI: true,
  redis: true,
  media: false,
});

// Redis key generators
const KEYS = {
  userVote: (postId: string, userId: string, day: string) => 
    `post:${postId}:user:${userId}:day:${day}:vote`,
  dailyCooperateCount: (postId: string, day: string) => 
    `post:${postId}:day:${day}:cooperate`,
  dailyDefectCount: (postId: string, day: string) => 
    `post:${postId}:day:${day}:defect`,
  dailyResults: (postId: string, day: string) => 
    `post:${postId}:day:${day}:results`,
  userStats: (postId: string, userId: string) => 
    `post:${postId}:user:${userId}:stats`,
  userHistory: (postId: string, userId: string) => 
    `post:${postId}:user:${userId}:history`,
};

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
    const { data: todayVote, loading: voteLoading } = useAsync(async () => {
      const voteKey = KEYS.userVote(postId, userId, currentDay);
      const voteData = await context.redis.get(voteKey);
      
      if (voteData) {
        const vote: UserVote = JSON.parse(voteData);
        setHasVotedToday(true);
        setUserChoice(vote.choice);
        return vote;
      }
      return null;
    }, {
      depends: [refreshKey],
    });

    // Load today's results
    const { data: todayResults, loading: resultsLoading } = useAsync(async () => {
      const resultsKey = KEYS.dailyResults(postId, currentDay);
      const resultsData = await context.redis.get(resultsKey);
      
      if (resultsData) {
        return JSON.parse(resultsData) as DailyResults;
      }
      
      // Calculate current counts (parallel fetch for better performance)
      const cooperateKey = KEYS.dailyCooperateCount(postId, currentDay);
      const defectKey = KEYS.dailyDefectCount(postId, currentDay);
      
      const [cooperateCountStr, defectCountStr] = await Promise.all([
        context.redis.get(cooperateKey),
        context.redis.get(defectKey),
      ]);
      
      const cooperateCount = parseInt(cooperateCountStr || '0');
      const defectCount = parseInt(defectCountStr || '0');
      
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
    const { data: userStats, loading: statsLoading } = useAsync(async () => {
      const statsKey = KEYS.userStats(postId, userId);
      const statsData = await context.redis.get(statsKey);
      
      if (statsData) {
        return JSON.parse(statsData) as UserStats;
      }
      
      return {
        totalScore: 0,
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
        const voteKey = KEYS.userVote(postId, userId, currentDay);
        const vote: UserVote = {
          choice,
          timestamp: Date.now(),
          day: currentDay,
        };
        
        // Save vote
        await context.redis.set(voteKey, JSON.stringify(vote));
        
        // Increment count
        if (choice === 'cooperate') {
          const cooperateKey = KEYS.dailyCooperateCount(postId, currentDay);
          await context.redis.incrBy(cooperateKey, 1);
        } else {
          const defectKey = KEYS.dailyDefectCount(postId, currentDay);
          await context.redis.incrBy(defectKey, 1);
        }
        
        // Update user history
        const historyKey = KEYS.userHistory(postId, userId);
        const historyData = await context.redis.get(historyKey);
        const history = historyData ? JSON.parse(historyData) : [];
        const newHistoryEntry = { day: currentDay, choice };
        history.push(newHistoryEntry);
        await context.redis.set(historyKey, JSON.stringify(history));
        
        // Update user stats (without points yet - awarded at midnight)
        const statsKey = KEYS.userStats(postId, userId);
        const currentStatsData = await context.redis.get(statsKey);
        const currentStats: UserStats = currentStatsData 
          ? JSON.parse(currentStatsData)
          : {
              totalScore: 0,
              currentStreak: 0,
              longestStreak: 0,
              totalVotes: 0,
              cooperateCount: 0,
              defectCount: 0,
              history: [],
            };
        
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
          text: 'Failed to submit vote. Please try again.',
          appearance: 'error',
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
      // Parse history entries
      const parsedHistory = userStats?.history?.map(h => {
        if (typeof h === 'string') {
          try {
            return JSON.parse(h);
          } catch {
            return { day: h, choice: 'cooperate' as Choice };
          }
        }
        return h;
      }) || [];

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
            <text size="medium" weight="bold">Emoji Grid</text>
            <text style="monospace" size="small">
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
    
    // This would process all active posts
    // For MVP, we'll handle this on-demand when users check results
    
    // In production, you'd:
    // 1. Get all active post IDs
    // 2. For each post, calculate final results
    // 3. Award points to users based on their votes
    // 4. Update streaks
    
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
