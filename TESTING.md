# DilemmaForge Testing Guide

## Overview
This document provides comprehensive testing procedures for the DilemmaForge game.

## Prerequisites
- Devvit CLI installed and configured
- Node.js v18 or higher
- Access to a Reddit test subreddit

## Manual Testing Procedures

### 1. Initial Setup Test
**Objective**: Verify the app can be installed and loads correctly

**Steps**:
1. Run `npm install` to install dependencies
2. Run `npm run dev` to start playtest
3. Verify the DilemmaForge UI loads without errors
4. Check that all UI elements are visible

**Expected Results**:
- ✅ App loads without errors
- ✅ UI displays correctly
- ✅ All buttons and text are visible

---

### 2. First Vote Test (Cooperate)
**Objective**: Test voting for the first time with Cooperate option

**Steps**:
1. Open the DilemmaForge post
2. Click the "🤝 Cooperate" button
3. Observe the toast notification
4. Verify the UI updates

**Expected Results**:
- ✅ Toast shows "Vote submitted: 🤝 Cooperate"
- ✅ UI displays "You chose: Cooperate"
- ✅ Vote is locked (buttons disabled or removed)
- ✅ Current results show 1 cooperate vote (100%)
- ✅ Cannot vote again

---

### 3. First Vote Test (Defect)
**Objective**: Test voting for the first time with Defect option

**Steps**:
1. Open the DilemmaForge post (with a new user)
2. Click the "⚔️ Defect" button
3. Observe the toast notification
4. Verify the UI updates

**Expected Results**:
- ✅ Toast shows "Vote submitted: ⚔️ Defect"
- ✅ UI displays "You chose: Defect"
- ✅ Vote is locked
- ✅ Current results reflect the defect vote
- ✅ Cannot vote again

---

### 4. Multiple Users - Mixed Votes
**Objective**: Test aggregate results with mixed votes

**Test Data**:
- User 1: Cooperate
- User 2: Cooperate
- User 3: Defect
- User 4: Defect
- User 5: Defect

**Expected Results**:
- ✅ Total Votes: 5
- ✅ Cooperate: 2 (40%)
- ✅ Defect: 3 (60%)
- ✅ Outcome: Mixed (neither ≥70%)
- ✅ Points calculation: Defectors will get +5, Cooperators get 0

---

### 5. All Cooperate Scenario (≥70%)
**Objective**: Test when ≥70% of players cooperate

**Test Data**:
- 7 users vote Cooperate
- 1 user votes Defect

**Expected Results**:
- ✅ Total Votes: 8
- ✅ Cooperate: 7 (87.5%)
- ✅ Defect: 1 (12.5%)
- ✅ Outcome: All Cooperate
- ✅ Points: Everyone gets +3

---

### 6. All Defect Scenario (≥70%)
**Objective**: Test when ≥70% of players defect

**Test Data**:
- 1 user votes Cooperate
- 7 users vote Defect

**Expected Results**:
- ✅ Total Votes: 8
- ✅ Cooperate: 1 (12.5%)
- ✅ Defect: 7 (87.5%)
- ✅ Outcome: All Defect
- ✅ Points: Everyone gets +1

---

### 7. Exact 70% Threshold Tests
**Objective**: Test the exact 70% boundary conditions

**Test 7a: Exact 70% Cooperate**
- Input: 7 cooperate, 3 defect
- Expected: All Cooperate outcome (+3 for everyone)

**Test 7b: Exact 70% Defect**
- Input: 3 cooperate, 7 defect
- Expected: All Defect outcome (+1 for everyone)

---

### 8. History View Test
**Objective**: Test the user history and stats display

**Steps**:
1. Vote for multiple days
2. Click "View History" button
3. Verify emoji grid displays
4. Check statistics

**Expected Results**:
- ✅ Emoji grid shows past votes
- ✅ 🤝 for cooperate days
- ✅ ⚔️ for defect days
- ✅ Total score is displayed
- ✅ Current streak count
- ✅ Longest streak count
- ✅ Cooperate vs Defect ratio

---

### 9. Streak Tracking Test
**Objective**: Verify streak calculations work correctly

**Steps**:
1. Vote for 3 consecutive days
2. Check current streak (should be 3)
3. Skip a day
4. Vote again
5. Check current streak (should reset to 1)
6. Verify longest streak is still 3

**Expected Results**:
- ✅ Current streak increments correctly
- ✅ Streak resets when a day is missed
- ✅ Longest streak is preserved

---

### 10. Daily Reset Test
**Objective**: Test that votes reset at midnight UTC

**Steps**:
1. Vote during the current day
2. Wait for midnight UTC (or change system time for testing)
3. Refresh/reload the post
4. Verify can vote again

**Expected Results**:
- ✅ Vote is locked before midnight
- ✅ Vote becomes available after midnight UTC
- ✅ Previous day's vote is preserved in history
- ✅ New day shows 0 votes initially

---

### 11. Mobile Responsiveness Test
**Objective**: Test UI on mobile devices

**Steps**:
1. Open on mobile device or use browser dev tools
2. Test in portrait mode
3. Test in landscape mode
4. Test swipe gestures (if WebView is enabled)

**Expected Results**:
- ✅ UI scales properly on mobile
- ✅ Buttons are touch-friendly (min 44x44px)
- ✅ Text is readable
- ✅ No horizontal scrolling
- ✅ Swipe gestures work smoothly

---

### 12. WebView Swipe Test
**Objective**: Test swipe gesture functionality

**Steps**:
1. Open WebView version
2. Swipe left on the card
3. Verify Defect is selected
4. Refresh and swipe right
5. Verify Cooperate is selected

**Expected Results**:
- ✅ Swipe left triggers Defect
- ✅ Swipe right triggers Cooperate
- ✅ Visual feedback during swipe
- ✅ Card animates away after selection
- ✅ Confirmation screen appears

---

### 13. Error Handling Test
**Objective**: Test error scenarios

**Steps**:
1. Try to vote twice on the same day
2. Try to vote with invalid data
3. Test with no internet connection
4. Test with Redis unavailable

**Expected Results**:
- ✅ Cannot vote twice (validation works)
- ✅ Appropriate error messages
- ✅ App doesn't crash
- ✅ User-friendly error toasts

---

### 14. Concurrent Votes Test
**Objective**: Test multiple users voting simultaneously

**Steps**:
1. Have 5+ users open the post at the same time
2. All users vote within a few seconds
3. Verify all votes are counted

**Expected Results**:
- ✅ All votes are recorded
- ✅ No votes are lost
- ✅ Counts are accurate
- ✅ No race conditions

---

### 15. Emoji Share Grid Test
**Objective**: Test the shareable emoji grid generation

**Steps**:
1. Vote for 15 days with varied choices
2. View history
3. Verify emoji grid formatting

**Expected Results**:
- ✅ Grid shows up to 30 most recent votes
- ✅ 10 emojis per row
- ✅ Correct emoji for each choice
- ✅ Header text present
- ✅ Properly formatted for sharing

---

## Automated Test Scenarios

### Run Automated Tests
```bash
# Run game logic tests
cd /home/runner/work/DilemmaForge/DilemmaForge
node tests/game-logic.test.ts
```

### Expected Output
All tests should pass with proper calculations for:
- Cooperation thresholds (≥70%)
- Defection thresholds (≥70%)
- Mixed outcomes
- Point calculations
- Date formatting
- Emoji generation
- Streak calculations

---

## Performance Testing

### Load Test
**Objective**: Test with high volume of votes

**Steps**:
1. Simulate 100+ concurrent users
2. Monitor response times
3. Check Redis performance
4. Verify no data loss

**Expected Results**:
- ✅ Response time < 2 seconds
- ✅ All votes counted accurately
- ✅ No timeouts
- ✅ No memory leaks

---

## Security Testing

### Data Validation
- ✅ User can only vote once per day
- ✅ Cannot manipulate vote counts
- ✅ Cannot access other users' data
- ✅ Input validation prevents injection

### Privacy
- ✅ Individual votes are private
- ✅ Only aggregate results are shown
- ✅ User stats are user-specific

---

## Checklist for Production Release

### Pre-Launch
- [ ] All manual tests pass
- [ ] Automated tests pass
- [ ] Mobile responsiveness verified
- [ ] Error handling tested
- [ ] Performance acceptable
- [ ] Security reviewed
- [ ] Documentation complete

### Post-Launch Monitoring
- [ ] Monitor error logs
- [ ] Track user engagement
- [ ] Monitor Redis usage
- [ ] Check vote accuracy
- [ ] Gather user feedback

---

## Troubleshooting

### Common Issues

**Issue**: Vote not submitting
- Check Redis connection
- Verify user authentication
- Check browser console for errors

**Issue**: Incorrect vote counts
- Check Redis key format
- Verify day calculation (UTC)
- Check for race conditions

**Issue**: UI not updating
- Check refresh mechanism
- Verify state management
- Check useAsync dependencies

**Issue**: Playtest not loading
```bash
devvit logout
devvit login
npm run dev
```

---

## Test Data Setup

### Sample Test Users
Create test users with different voting patterns:
- **User A**: Always cooperates
- **User B**: Always defects
- **User C**: Alternates
- **User D**: Random choices
- **User E**: Votes inconsistently (tests streak breaking)

### Sample Scenarios
1. **Scenario 1**: Majority cooperate (80%)
2. **Scenario 2**: Majority defect (80%)
3. **Scenario 3**: Evenly split (50/50)
4. **Scenario 4**: Just below threshold (69%)
5. **Scenario 5**: Just above threshold (71%)

---

## Regression Testing

After any code changes, verify:
- [ ] Existing votes still work
- [ ] Historical data intact
- [ ] Streaks calculate correctly
- [ ] UI displays properly
- [ ] No new errors introduced

---

## Conclusion

Follow this testing guide to ensure DilemmaForge functions correctly across all scenarios. Report any issues or unexpected behavior for further investigation.
