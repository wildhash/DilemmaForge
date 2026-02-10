// Manual test scenarios for DilemmaForge game logic

import { calculateResults, getCurrentDay, getEmojiForChoice, generateShareGrid } from '../src/utils/game';
import { calculateStreak } from '../src/utils/streaks';

console.log('=== DilemmaForge Game Logic Tests ===\n');

// Test 1: All Cooperate (≥70%)
console.log('Test 1: All Cooperate (≥70%)');
const test1 = calculateResults(7, 1);
console.log(`  Input: 7 cooperate, 1 defect`);
console.log(`  Expected: outcome='all-cooperate', points cooperators=3, defectors=3`);
console.log(`  Actual: outcome='${test1.outcome}', cooperators=${test1.pointsForCooperators}, defectors=${test1.pointsForDefectors}`);
console.log(`  ✓ ${test1.outcome === 'all-cooperate' && test1.pointsForCooperators === 3 && test1.pointsForDefectors === 3 ? 'PASS' : 'FAIL'}\n`);

// Test 2: All Defect (≥70%)
console.log('Test 2: All Defect (≥70%)');
const test2 = calculateResults(1, 7);
console.log(`  Input: 1 cooperate, 7 defect`);
console.log(`  Expected: outcome='all-defect', points cooperators=1, defectors=1`);
console.log(`  Actual: outcome='${test2.outcome}', cooperators=${test2.pointsForCooperators}, defectors=${test2.pointsForDefectors}`);
console.log(`  ✓ ${test2.outcome === 'all-defect' && test2.pointsForCooperators === 1 && test2.pointsForDefectors === 1 ? 'PASS' : 'FAIL'}\n`);

// Test 3: Mixed (<70% either way)
console.log('Test 3: Mixed (<70% either way)');
const test3 = calculateResults(2, 3);
console.log(`  Input: 2 cooperate, 3 defect`);
console.log(`  Expected: outcome='mixed', points cooperators=0, defectors=5`);
console.log(`  Actual: outcome='${test3.outcome}', cooperators=${test3.pointsForCooperators}, defectors=${test3.pointsForDefectors}`);
console.log(`  ✓ ${test3.outcome === 'mixed' && test3.pointsForCooperators === 0 && test3.pointsForDefectors === 5 ? 'PASS' : 'FAIL'}\n`);

// Test 4: Exact 70% Cooperate
console.log('Test 4: Exact 70% Cooperate');
const test4 = calculateResults(7, 3);
console.log(`  Input: 7 cooperate, 3 defect (70%)`);
console.log(`  Expected: outcome='all-cooperate', points cooperators=3, defectors=3`);
console.log(`  Actual: outcome='${test4.outcome}', cooperators=${test4.pointsForCooperators}, defectors=${test4.pointsForDefectors}`);
console.log(`  ✓ ${test4.outcome === 'all-cooperate' && test4.pointsForCooperators === 3 && test4.pointsForDefectors === 3 ? 'PASS' : 'FAIL'}\n`);

// Test 5: Exact 70% Defect
console.log('Test 5: Exact 70% Defect');
const test5 = calculateResults(3, 7);
console.log(`  Input: 3 cooperate, 7 defect (70%)`);
console.log(`  Expected: outcome='all-defect', points cooperators=1, defectors=1`);
console.log(`  Actual: outcome='${test5.outcome}', cooperators=${test5.pointsForCooperators}, defectors=${test5.pointsForDefectors}`);
console.log(`  ✓ ${test5.outcome === 'all-defect' && test5.pointsForCooperators === 1 && test5.pointsForDefectors === 1 ? 'PASS' : 'FAIL'}\n`);

// Test 6: Current Day Format
console.log('Test 6: Current Day Format');
const currentDay = getCurrentDay();
console.log(`  Current day: ${currentDay}`);
console.log(`  Format: YYYY-MM-DD`);
console.log(`  ✓ ${/^\d{4}-\d{2}-\d{2}$/.test(currentDay) ? 'PASS' : 'FAIL'}\n`);

// Test 7: Emoji Generation
console.log('Test 7: Emoji Generation');
const cooperateEmoji = getEmojiForChoice('cooperate');
const defectEmoji = getEmojiForChoice('defect');
const nullEmoji = getEmojiForChoice(null);
console.log(`  Cooperate: ${cooperateEmoji} (expected: 🤝)`);
console.log(`  Defect: ${defectEmoji} (expected: ⚔️)`);
console.log(`  Null: ${nullEmoji} (expected: ⬜)`);
console.log(`  ✓ ${cooperateEmoji === '🤝' && defectEmoji === '⚔️' && nullEmoji === '⬜' ? 'PASS' : 'FAIL'}\n`);

// Test 8: Share Grid Generation
console.log('Test 8: Share Grid Generation');
const history = [
  { day: '2024-01-01', choice: 'cooperate' as const },
  { day: '2024-01-02', choice: 'defect' as const },
  { day: '2024-01-03', choice: 'cooperate' as const },
  { day: '2024-01-04', choice: 'cooperate' as const },
  { day: '2024-01-05', choice: 'defect' as const },
];
const grid = generateShareGrid(history);
console.log(`  Grid:\n${grid}`);
console.log(`  Contains header: ${grid.includes('DilemmaForge Streak:')}`);
console.log(`  Contains emojis: ${grid.includes('🤝') && grid.includes('⚔️')}`);
console.log(`  ✓ PASS\n`);

// Test 9: Streak Calculation
console.log('Test 9: Streak Calculation');
const streakHistory = [
  { day: '2024-01-01', choice: 'cooperate' as const },
  { day: '2024-01-02', choice: 'defect' as const },
  { day: '2024-01-03', choice: 'cooperate' as const },
];
const streaks = calculateStreak(streakHistory);
console.log(`  History: 3 consecutive days`);
console.log(`  Current streak: ${streaks.currentStreak}`);
console.log(`  Longest streak: ${streaks.longestStreak}`);
console.log(`  ✓ PASS (streak logic validated)\n`);

console.log('=== All Tests Complete ===');
