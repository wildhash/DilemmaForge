// Enhanced game utilities with streak tracking

import { Choice, UserStats } from './game.js';

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

export function updateUserStats(
  currentStats: UserStats,
  newVote: { choice: Choice; day: string },
  points: number
): UserStats {
  const history = [
    ...currentStats.history,
    { day: newVote.day, choice: newVote.choice },
  ];

  // Parse history entries: Some may be strings (legacy format), others are objects
  // Default to 'cooperate' for unparseable entries to maintain backwards compatibility
  const { currentStreak, longestStreak } = calculateStreak(
    history.map(h => typeof h === 'string' ? { day: h, choice: 'cooperate' as Choice } : h)
  );

  return {
    totalScore: currentStats.totalScore + points,
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStats.longestStreak),
    totalVotes: currentStats.totalVotes + 1,
    cooperateCount: currentStats.cooperateCount + (newVote.choice === 'cooperate' ? 1 : 0),
    defectCount: currentStats.defectCount + (newVote.choice === 'defect' ? 1 : 0),
    history: history.map(h => typeof h === 'string' ? h : JSON.stringify(h)),
  };
}

export function isValidChoice(choice: any): choice is Choice {
  return choice === 'cooperate' || choice === 'defect';
}
