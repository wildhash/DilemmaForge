# DilemmaForge ⚖️

A production-ready Reddit Devvit interactive post game implementing a daily Prisoner's Dilemma. Players vote once per UTC day to either **Cooperate** 🤝 or **Defect** ⚔️, with aggregate results revealed at midnight UTC.

## 🎮 Game Mechanics

### Daily Voting
- Each player can vote **once per UTC day**
- Choose between **Cooperate** or **Defect**
- Votes are locked after submission
- Results update in real-time

### Scoring System
The payoff structure follows classic game theory:

- **≥70% Cooperate**: Everyone gets **+3 points**
- **≥70% Defect**: Everyone gets **+1 point**
- **Mixed (<70% either way)**: 
  - Defectors: **+5 points**
  - Cooperators: **0 points**

### Persistence Features
- **Total Score**: Cumulative points across all games
- **Streaks**: Track consecutive days of participation
- **History**: View your past choices
- **Emoji Share Grid**: Shareable visual representation of your voting history
  - 🤝 = Cooperate
  - ⚔️ = Defect
  - ⬜ = No vote

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Devvit CLI](https://developers.reddit.com/docs/quickstart)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wildhash/DilemmaForge.git
   cd DilemmaForge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Devvit CLI** (if not already installed)
   ```bash
   npm install -g devvit
   ```

4. **Login to Devvit**
   ```bash
   devvit login
   ```

### Development

1. **Run local playtest**
   ```bash
   npm run dev
   ```
   This opens a local playground to test the app.

2. **Build the app**
   ```bash
   npm run build
   ```

3. **Upload to Reddit**
   ```bash
   npm run upload
   ```

4. **Install to a subreddit**
   ```bash
   npm run install
   ```

## 📱 Features

### Mobile-First Design
- Optimized for mobile viewports
- Touch-friendly button sizing
- Responsive layout

### Real-Time Updates
- Live vote counts
- Dynamic percentage calculations
- Instant feedback on vote submission

### Persistent Storage
Using Redis for:
- User votes (per day, per user)
- Daily aggregate results
- User statistics and history
- Streak tracking

### Data Structure

```typescript
// Vote Storage
post:{postId}:user:{userId}:day:{YYYY-MM-DD}:vote

// Daily Aggregates
post:{postId}:day:{YYYY-MM-DD}:cooperate
post:{postId}:day:{YYYY-MM-DD}:defect
post:{postId}:day:{YYYY-MM-DD}:results

// User Stats
post:{postId}:user:{userId}:stats
post:{postId}:user:{userId}:history
```

## 🎯 Usage

### Creating a DilemmaForge Post

1. Navigate to a subreddit where the app is installed
2. Click the subreddit menu (...)
3. Select "Create DilemmaForge Post"
4. A new interactive post will be created

### Playing the Game

1. **View the Post**: Open the DilemmaForge interactive post
2. **Make Your Choice**: Tap or swipe to choose Cooperate or Defect
3. **Vote Locked**: After voting, your choice is locked for the day
4. **Check Results**: View real-time vote counts and percentages
5. **Wait for Midnight**: Final results are calculated at midnight UTC
6. **Check Stats**: View your score, streak, and history

### Viewing History

- Tap "View History" to see your past votes
- See your emoji grid showing your voting pattern
- Check your statistics:
  - Total score
  - Current streak
  - Longest streak
  - Cooperate vs Defect ratio

## 🏗️ Architecture

### Core Components

1. **main.tsx**: Main Devvit app with Custom Post component
   - Handles UI rendering
   - Manages vote submission
   - Displays results and stats

2. **utils/game.ts**: Game logic and utilities
   - Vote calculation functions
   - Date/time utilities
   - Emoji generation
   - Score calculations

### Key Technologies

- **Devvit Public API**: Reddit's framework for interactive posts
- **Redis**: Persistent data storage
- **TypeScript**: Type-safe development
- **React-style hooks**: useState, useAsync for state management

### Redis Keys Pattern

```
post:{postId}:user:{userId}:day:{day}:vote        # User's daily vote
post:{postId}:day:{day}:cooperate                  # Daily cooperate count
post:{postId}:day:{day}:defect                     # Daily defect count
post:{postId}:day:{day}:results                    # Calculated results
post:{postId}:user:{userId}:stats                  # User statistics
post:{postId}:user:{userId}:history                # User vote history
```

## 📊 Demo Script

### Test Scenario 1: First Vote (Cooperate)

```bash
# In Devvit Playtest
1. Open the DilemmaForge post
2. Click the "🤝 Cooperate" button
3. Verify: Toast shows "Vote submitted: 🤝 Cooperate"
4. Verify: UI shows "You chose: Cooperate"
5. Verify: Vote is locked (can't vote again)
6. Verify: Current results show 1 cooperate vote (100%)
```

### Test Scenario 2: Multiple Users, Mixed Votes

```bash
# Simulate multiple users voting
# User 1: Cooperate
# User 2: Cooperate
# User 3: Defect
# User 4: Defect
# User 5: Defect

Expected Results:
- Total Votes: 5
- Cooperate: 2 (40%)
- Defect: 3 (60%)
- Outcome: Mixed (neither ≥70%)
- Points: Defectors get +5, Cooperators get 0
```

### Test Scenario 3: All Cooperate (≥70%)

```bash
# Simulate 8 users voting
# 7 users: Cooperate
# 1 user: Defect

Expected Results:
- Total Votes: 8
- Cooperate: 7 (87.5%)
- Defect: 1 (12.5%)
- Outcome: All Cooperate
- Points: Everyone gets +3
```

### Test Scenario 4: All Defect (≥70%)

```bash
# Simulate 8 users voting
# 1 user: Cooperate
# 7 users: Defect

Expected Results:
- Total Votes: 8
- Cooperate: 1 (12.5%)
- Defect: 7 (87.5%)
- Outcome: All Defect
- Points: Everyone gets +1
```

### Test Scenario 5: View History

```bash
1. After voting for several days
2. Click "View History"
3. Verify: Emoji grid displays past votes
4. Verify: Statistics show correct totals
5. Verify: Streak count is accurate
```

## 🔧 Configuration

### devvit.yaml

```yaml
name: DilemmaForge
version: 1.0.0
permissions:
  - redisStorage    # For persistent data
  - scheduler       # For midnight reveals (future)
```

### Environment

No environment variables required for basic operation.

## 📈 Future Enhancements

- [ ] WebView UI with swipe gestures
- [ ] Animated midnight reveals
- [ ] Leaderboards
- [ ] Achievement system
- [ ] Custom subreddit theming
- [ ] Push notifications for results
- [ ] Multi-day tournament modes
- [ ] Social sharing integration

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Vote not submitting
- Check Redis connection
- Verify user is authenticated
- Check console for errors

### Playtest not loading
```bash
devvit logout
devvit login
npm run dev
```

## 📝 License

MIT License - feel free to use and modify.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## 📞 Support

- [Reddit Devvit Documentation](https://developers.reddit.com/docs)
- [Devvit Discord](https://discord.gg/devvit)

---

**Built with ❤️ for Reddit Devvit**
