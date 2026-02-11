// Enhanced game utilities with streak tracking

import { Choice, UserStats, HistoryEntry } from './game.js';

/**
 * Calculates current and longest voting streaks from history.
 * 
 * A streak is defined as consecutive days with votes, without any gaps.
 * Current streak counts backwards from today, longest streak is the maximum
 * consecutive sequence found in all history.
 * 
 * @param history - Array of voting history entries with day and choice
 * @returns Object with currentStreak (days from today) and longestStreak (all-time max)
 * 
 * @example
 * // User voted 3 consecutive days ending today
 * calculateStreak([
 *   { day: '2026-02-09', choice: 'cooperate' },
 *   { day: '2026-02-10', choice: 'defect' },
 *   { day: '2026-02-11', choice: 'cooperate' }
 * ])
 * // => { currentStreak: 3, longestStreak: 3 }
 * 
 * @example
 * // User has a gap in voting history
 * calculateStreak([
 *   { day: '2026-02-08', choice: 'cooperate' },
 *   { day: '2026-02-09', choice: 'cooperate' },
 *   // gap on 2026-02-10
 *   { day: '2026-02-11', choice: 'cooperate' }
 * ])
 * // => { currentStreak: 1, longestStreak: 2 }
 */
export function calculateStreak(history: { day: string; choice: Choice }[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (history.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Sort history by day in descending order (most recent first)
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.day).getTime() - new Date(a.day).getTime()
  );

  // Calculate current streak
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedHistory.length; i++) {
    const historyDate = new Date(sortedHistory[i].day);
    historyDate.setUTCHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setUTCDate(expectedDate.getUTCDate() - i);
    expectedDate.setUTCHours(0, 0, 0, 0);
    
    if (historyDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let lastDate: Date | null = null;
  
  for (const item of sortedHistory) {
    const currentDate = new Date(item.day);
    currentDate.setUTCHours(0, 0, 0, 0);
    
    if (lastDate === null) {
      tempStreak = 1;
    } else {
      const daysDiff = Math.floor(
        (lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    
    lastDate = currentDate;
  }
  
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

/**
 * Updates user statistics after a new vote is cast.
 * 
 * Handles legacy history format (strings) and new format (objects).
 * Recalculates streaks and increments counters.
 * 
 * @param currentStats - Current user statistics
 * @param newVote - New vote to add to history
 * @param points - Points to award for this vote (usually 0 until finalized)
 * @returns Updated UserStats with new vote incorporated
 * 
 * @example
 * updateUserStats(
 *   { totalScore: 10, currentStreak: 2, longestStreak: 5, ... },
 *   { choice: 'cooperate', day: '2026-02-11' },
 *   0 // Points awarded later at midnight
 * )
 */
export function updateUserStats(
  currentStats: UserStats,
  newVote: { choice: Choice; day: string },
  points: number
): UserStats {
  const history = [
    ...currentStats.history,
    { day: newVote.day, choice: newVote.choice },
  ];

  // Parse legacy string history entries and ignore corrupted entries.
  const normalizedHistory = history
    .map((h) => normalizeHistoryEntry(h))
    .filter((h): h is { day: string; choice: Choice } => h !== null);

  const { currentStreak, longestStreak } = calculateStreak(normalizedHistory);

  return {
    totalScore: currentStats.totalScore + points,
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStats.longestStreak),
    totalVotes: currentStats.totalVotes + 1,
    cooperateCount: currentStats.cooperateCount + (newVote.choice === 'cooperate' ? 1 : 0),
    defectCount: currentStats.defectCount + (newVote.choice === 'defect' ? 1 : 0),
    history: normalizedHistory,
  };
}

/**
 * Validates that a value is a valid Choice type.
 * Type guard for runtime validation.
 * 
 * @param choice - Value to validate
 * @returns True if choice is 'cooperate' or 'defect', false otherwise
 */
export function isValidChoice(choice: any): choice is Choice {
  return choice === 'cooperate' || choice === 'defect';
}

/**
* Parses a history entry string.
* Handles legacy formats and ignores corrupted data.
 * 
 * @param entry - String to parse (expected to be JSON-serialized history entry)
* @returns Parsed history entry, or null if unparseable
 * @internal
 */
function parseHistoryEntry(entry: string): { day: string; choice: Choice } | null {
  try {
    const parsed = JSON.parse(entry);
    if (
      parsed &&
      typeof parsed.day === 'string' &&
      (parsed.choice === null || isValidChoice(parsed.choice))
    ) {
      return { day: parsed.day, choice: parsed.choice };
    }
  } catch {
    // Fall through
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(entry)) {
    return { day: entry, choice: null };
  }

  return null;
}

function normalizeHistoryEntry(
  entry: HistoryEntry
): { day: string; choice: Choice } | null {
  if (typeof entry === 'string') {
    return parseHistoryEntry(entry);
  }

  if (entry && typeof entry.day === 'string') {
    if (entry.choice === null || isValidChoice(entry.choice)) {
      return entry;
    }
  }

  return null;
}
