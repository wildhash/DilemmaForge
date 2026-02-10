// Game state types
export type Choice = 'cooperate' | 'defect' | null;

export interface UserVote {
  choice: Choice;
  timestamp: number;
  day: string;
}

export interface DailyResults {
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

export interface UserStats {
  totalScore: number;
  currentStreak: number;
  longestStreak: number;
  totalVotes: number;
  cooperateCount: number;
  defectCount: number;
  history: string[]; // Array of day strings with user's choices
}

// Utility functions
export function getCurrentDay(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

  if (cooperatePercent >= 70) {
    // ≥70% cooperate = +3 all
    return {
      outcome: 'all-cooperate',
      pointsForCooperators: 3,
      pointsForDefectors: 3,
    };
  } else if (defectPercent >= 70) {
    // ≥70% defect = +1 all
    return {
      outcome: 'all-defect',
      pointsForCooperators: 1,
      pointsForDefectors: 1,
    };
  } else {
    // Mixed: defectors +5, cooperators 0
    return {
      outcome: 'mixed',
      pointsForCooperators: 0,
      pointsForDefectors: 5,
    };
  }
}

export function getEmojiForChoice(choice: Choice): string {
  if (choice === 'cooperate') return '🤝';
  if (choice === 'defect') return '⚔️';
  return '⬜';
}

export function generateShareGrid(history: { day: string; choice: Choice }[]): string {
  // Generate a shareable emoji grid (max last 30 days)
  const recent = history.slice(-30);
  let grid = 'DilemmaForge Streak:\n';
  
  let row = '';
  recent.forEach((item, index) => {
    row += getEmojiForChoice(item.choice);
    if ((index + 1) % 10 === 0) {
      grid += row + '\n';
      row = '';
    }
  });
  
  if (row) {
    grid += row + '\n';
  }
  
  return grid;
}
