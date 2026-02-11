import { GAME_CONFIG } from './constants.js';

// Game state types

/**
 * A user's choice in the Prisoner's Dilemma.
 * Can be 'cooperate', 'defect', or null if no choice has been made.
 */
export type Choice = 'cooperate' | 'defect' | null;

/**
 * Represents a user's vote for a specific day.
 */
export interface UserVote {
  /** The user's choice (cooperate or defect) */
  choice: Choice;
  /** Unix timestamp in milliseconds when vote was cast */
  timestamp: number;
  /** ISO date string in format YYYY-MM-DD (UTC) */
  day: string;

  /** Whether points for this vote have been awarded (set after results finalize) */
  pointsAwarded?: boolean;
  /** Unix timestamp (ms) when points were awarded */
  pointsAwardedAt?: number;
}

/**
 * Aggregate results for a specific day's voting.
 */
export interface DailyResults {
  /** ISO date string in format YYYY-MM-DD (UTC) */
  day: string;
  /** Total number of votes cast */
  totalVotes: number;
  /** Number of cooperate votes */
  cooperateCount: number;
  /** Number of defect votes */
  defectCount: number;
  /** Percentage of cooperate votes (0-100) */
  cooperatePercent: number;
  /** Percentage of defect votes (0-100) */
  defectPercent: number;
  /** Outcome category based on vote distribution */
  outcome: 'all-cooperate' | 'all-defect' | 'mixed';
  /** Points awarded to users who chose cooperate */
  pointsForCooperators: number;
  /** Points awarded to users who chose defect */
  pointsForDefectors: number;
}

/**
 * History entry format - can be either string (legacy) or object.
* String format: JSON-serialized {day: string, choice: Choice} (legacy) or YYYY-MM-DD day string (older legacy)
 * Object format: {day: string, choice: Choice}
 */
export type HistoryEntry = string | { day: string; choice: Choice };

/**
 * Cumulative statistics for a user across all games.
 */
export interface UserStats {
  /** Total points accumulated across all games */
  totalScore: number;
  /** Current consecutive voting streak in days */
  currentStreak: number;
  /** Longest consecutive voting streak ever achieved */
  longestStreak: number;
  /** Total number of votes cast */
  totalVotes: number;
  /** Number of times user chose cooperate */
  cooperateCount: number;
  /** Number of times user chose defect */
  defectCount: number;
  /** 
   * Voting history - can be strings (legacy JSON-serialized) or objects.
   * Each entry represents a day's vote with format {day: YYYY-MM-DD, choice: Choice}
   */
  history: HistoryEntry[];
}

// Utility functions

/**
 * Gets the current UTC day as an ISO date string.
 * @returns ISO date string in format YYYY-MM-DD
 * @example getCurrentDay() // "2026-02-11"
 */
export function getCurrentDay(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the next midnight UTC as a Date object.
 * @returns Date object representing the start of the next UTC day
 */
export function getNextMidnightUTC(): Date {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return tomorrow;
}

/**
 * Calculates game outcome and point distribution based on vote counts.
 * 
 * Scoring rules:
 * - ≥70% cooperate: Everyone gets +3 points
 * - ≥70% defect: Everyone gets +1 point
 * - Mixed (neither ≥70%): Defectors get +5, Cooperators get 0
 * 
 * @param cooperateCount - Number of cooperate votes
 * @param defectCount - Number of defect votes
 * @returns Object containing outcome type and points for each choice
 * 
 * @example
 * calculateResults(7, 1) // 87.5% cooperate
 * // => { outcome: 'all-cooperate', pointsForCooperators: 3, pointsForDefectors: 3 }
 * 
 * @example
 * calculateResults(2, 3) // 40% cooperate, 60% defect (mixed)
 * // => { outcome: 'mixed', pointsForCooperators: 0, pointsForDefectors: 5 }
 */
export function calculateResults(cooperateCount: number, defectCount: number): {
  outcome: DailyResults['outcome'];
  pointsForCooperators: number;
  pointsForDefectors: number;
} {
  const totalVotes = cooperateCount + defectCount;
  if (totalVotes === 0) {
    return {
      outcome: 'mixed',
      pointsForCooperators: 0,
      pointsForDefectors: 0,
    };
  }

  const cooperatePercent = (cooperateCount / totalVotes) * 100;
  const defectPercent = (defectCount / totalVotes) * 100;

  if (cooperatePercent >= GAME_CONFIG.COOPERATE_THRESHOLD) {
    // ≥70% cooperate = +3 all
    return {
      outcome: 'all-cooperate',
      pointsForCooperators: GAME_CONFIG.ALL_COOPERATE_POINTS,
      pointsForDefectors: GAME_CONFIG.ALL_COOPERATE_POINTS,
    };
  } else if (defectPercent >= GAME_CONFIG.DEFECT_THRESHOLD) {
    // ≥70% defect = +1 all
    return {
      outcome: 'all-defect',
      pointsForCooperators: GAME_CONFIG.ALL_DEFECT_POINTS,
      pointsForDefectors: GAME_CONFIG.ALL_DEFECT_POINTS,
    };
  } else {
    // Mixed: defectors +5, cooperators 0
    return {
      outcome: 'mixed',
      pointsForCooperators: GAME_CONFIG.MIXED_COOPERATE_POINTS,
      pointsForDefectors: GAME_CONFIG.MIXED_DEFECT_POINTS,
    };
  }
}

/**
 * Gets the emoji representation for a choice.
 * @param choice - The user's choice
 * @returns Emoji string: 🤝 for cooperate, ⚔️ for defect, ⬜ for null
 */
export function getEmojiForChoice(choice: Choice): string {
  if (choice === 'cooperate') return '🤝';
  if (choice === 'defect') return '⚔️';
  return '⬜';
}

/**
 * Generates a shareable emoji grid representing voting history.
 * Creates a Wordle-style grid with emojis for the last 30 days.
 * 
 * @param history - Array of voting history entries
 * @returns Multi-line string with emoji grid (10 emojis per row)
 * 
 * @example
 * generateShareGrid([
 *   { day: '2024-01-01', choice: 'cooperate' },
 *   { day: '2024-01-02', choice: 'defect' }
 * ])
 * // => "DilemmaForge Streak:\n🤝⚔️\n"
 */
export function generateShareGrid(history: { day: string; choice: Choice }[]): string {
  // Generate a shareable emoji grid (max last 30 days)
  const recent = history.slice(-GAME_CONFIG.MAX_SHARE_GRID_DAYS);
  let grid = 'DilemmaForge Streak:\n';
  
  let row = '';
  recent.forEach((item, index) => {
    row += getEmojiForChoice(item.choice);
    if ((index + 1) % GAME_CONFIG.SHARE_GRID_ROW_LENGTH === 0) {
      grid += row + '\n';
      row = '';
    }
  });
  
  if (row) {
    grid += row + '\n';
  }
  
  return grid;
}
