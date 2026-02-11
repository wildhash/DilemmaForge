/**
 * Redis key generation utilities for DilemmaForge.
 * 
 * All keys follow the pattern: post:{postId}:...
 * This ensures data isolation between different DilemmaForge posts.
 */

/**
 * Redis key generators for DilemmaForge data storage.
 * 
 * Key structure:
 * - User votes: post:{postId}:user:{userId}:day:{YYYY-MM-DD}:vote
 * - Daily counts: post:{postId}:day:{YYYY-MM-DD}:cooperate|defect
 * - Daily results: post:{postId}:day:{YYYY-MM-DD}:results
 * - Finalization: post:{postId}:day:{YYYY-MM-DD}:finalized
 * - User data: post:{postId}:user:{userId}:stats|history
 */
export const REDIS_KEYS = {
  /**
   * Key for storing a user's vote for a specific day.
   * Value: JSON-serialized UserVote object
   * 
   * @param postId - The post ID
   * @param userId - The user ID
   * @param day - ISO date string (YYYY-MM-DD)
   * @returns Redis key string
   */
  userVote: (postId: string, userId: string, day: string): string => 
    `post:${postId}:user:${userId}:day:${day}:vote`,

  /**
   * Key for storing daily cooperate vote count.
   * Value: Integer as string
   * 
   * @param postId - The post ID
   * @param day - ISO date string (YYYY-MM-DD)
   * @returns Redis key string
   */
  dailyCooperateCount: (postId: string, day: string): string => 
    `post:${postId}:day:${day}:cooperate`,

  /**
   * Key for storing daily defect vote count.
   * Value: Integer as string
   * 
   * @param postId - The post ID
   * @param day - ISO date string (YYYY-MM-DD)
   * @returns Redis key string
   */
  dailyDefectCount: (postId: string, day: string): string => 
    `post:${postId}:day:${day}:defect`,

  /**
   * Key for storing finalized daily results.
   * Value: JSON-serialized DailyResults object
   * 
   * @param postId - The post ID
   * @param day - ISO date string (YYYY-MM-DD)
   * @returns Redis key string
   */
  dailyResults: (postId: string, day: string): string => 
    `post:${postId}:day:${day}:results`,

  /**
   * Key for marking a day as finalized (prevents duplicate processing).
   * Value: String "true"
   * 
   * @param postId - The post ID
   * @param day - ISO date string (YYYY-MM-DD)
   * @returns Redis key string
   */
  dailyFinalized: (postId: string, day: string): string =>
    `post:${postId}:day:${day}:finalized`,

  /**
   * Key for storing user statistics.
   * Value: JSON-serialized UserStats object
   * 
   * @param postId - The post ID
   * @param userId - The user ID
   * @returns Redis key string
   */
  userStats: (postId: string, userId: string): string => 
    `post:${postId}:user:${userId}:stats`,

  /**
   * Key for storing user voting history.
   * Value: JSON array of history entries
   * 
   * @param postId - The post ID
   * @param userId - The user ID
   * @returns Redis key string
   */
  userHistory: (postId: string, userId: string): string => 
    `post:${postId}:user:${userId}:history`,
} as const;

/**
 * Constants for game configuration.
 * Extracted for easy modification and documentation.
 */
export const GAME_CONFIG = {
  /**
   * Threshold percentage for "all cooperate" outcome.
   * When cooperation rate reaches this, everyone gets +3 points.
   */
  COOPERATE_THRESHOLD: 70,

  /**
   * Threshold percentage for "all defect" outcome.
   * When defection rate reaches this, everyone gets +1 point.
   */
  DEFECT_THRESHOLD: 70,

  /**
   * Points awarded when ≥70% cooperate.
   */
  ALL_COOPERATE_POINTS: 3,

  /**
   * Points awarded when ≥70% defect.
   */
  ALL_DEFECT_POINTS: 1,

  /**
   * Points for defectors in mixed outcome.
   */
  MIXED_DEFECT_POINTS: 5,

  /**
   * Points for cooperators in mixed outcome.
   */
  MIXED_COOPERATE_POINTS: 0,

  /**
   * Maximum number of days to show in emoji share grid.
   */
  MAX_SHARE_GRID_DAYS: 30,

  /**
   * Number of emojis per row in share grid.
   */
  SHARE_GRID_ROW_LENGTH: 10,
} as const;
