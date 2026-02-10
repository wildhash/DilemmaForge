# DilemmaForge Quick Start Guide

Get DilemmaForge running in 5 minutes!

## 📦 Installation

### Step 1: Install Devvit CLI
```bash
npm install -g devvit
```

### Step 2: Login to Reddit
```bash
devvit login
```

### Step 3: Clone and Install
```bash
git clone https://github.com/wildhash/DilemmaForge.git
cd DilemmaForge
npm install
```

## 🚀 Local Development

### Start Playtest
```bash
npm run dev
```

This opens an interactive playground where you can:
- Test the voting interface
- Simulate multiple users
- View real-time results
- Test history and stats

## 🎮 Quick Test

### Test the Game Flow
1. **Open the playtest** - Run `npm run dev`
2. **Create a post** - Click "Create DilemmaForge Post"
3. **Vote** - Choose Cooperate or Defect
4. **Check results** - See vote counts update
5. **View history** - Click "View History" button

### Test Multiple Users
1. Open the playtest
2. Switch to different test users
3. Have each user vote
4. Watch the percentages change
5. See different outcomes based on vote distribution

## 📊 Understanding Outcomes

### All Cooperate (≥70% cooperate)
- **Example**: 7 cooperate, 1 defect
- **Result**: Everyone gets +3 points
- **Message**: "Cooperation pays off!"

### All Defect (≥70% defect)
- **Example**: 1 cooperate, 7 defect
- **Result**: Everyone gets +1 point
- **Message**: "Everyone defected!"

### Mixed (<70% either way)
- **Example**: 2 cooperate, 3 defect
- **Result**: Defectors get +5, Cooperators get 0
- **Message**: "The defectors won!"

## 🎯 Key Features

### ✅ One Vote Per Day
- Each user votes once per UTC day
- Vote is locked after submission
- Resets at midnight UTC

### ✅ Real-Time Results
- See vote counts update live
- View percentages in real-time
- Results visible to all voters

### ✅ Streaks & History
- Track consecutive voting days
- View past choices as emoji grid
- See lifetime statistics

### ✅ Mobile-First Design
- Optimized for mobile devices
- Touch-friendly buttons
- Swipe gestures (WebView)

## 🔧 Common Commands

```bash
# Start local development
npm run dev

# Build the project
npm run build

# Upload to Reddit
npm run upload

# Install to a subreddit
npm run install

# Run demo script
./demo.sh
```

## 📱 Testing on Mobile

### Browser DevTools
1. Open Chrome DevTools (F12)
2. Click device toolbar (Ctrl+Shift+M)
3. Select mobile device (e.g., iPhone 12)
4. Test touch interactions

### Real Device
1. Upload the app to Reddit
2. Install on a test subreddit
3. Open on your phone
4. Test the actual experience

## 🐛 Troubleshooting

### App won't start
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# Try logging out and back in
devvit logout
devvit login
npm run dev
```

### Vote not submitting
- Check you haven't already voted today
- Verify Redis is connected
- Check browser console for errors

### UI not updating
- Refresh the page
- Check network connection
- Verify state is being saved

## 📚 Next Steps

### 1. Customize the Game
- Edit `src/main.tsx` for UI changes
- Modify `src/utils/game.ts` for game logic
- Adjust scoring in `calculateResults()`

### 2. Deploy to Reddit
```bash
npm run build
npm run upload
devvit install <subreddit-name>
```

### 3. Monitor Usage
- Check post engagement
- Monitor vote patterns
- Gather user feedback

### 4. Learn More
- Read [README.md](./README.md) for full details
- Check [API.md](./API.md) for API reference
- Review [TESTING.md](./TESTING.md) for testing guide

## 💡 Tips

### For Developers
- Use TypeScript for type safety
- Follow existing code patterns
- Test changes in playtest first
- Keep changes minimal and focused

### For Testing
- Test with multiple users
- Try edge cases (0 votes, 1 vote, etc.)
- Test at different times of day
- Verify streak calculations

### For Deployment
- Test thoroughly before uploading
- Start with a small test subreddit
- Monitor for errors
- Gather user feedback early

## 🎉 Success Checklist

- [ ] Playtest runs without errors
- [ ] Can create a post
- [ ] Can submit a vote
- [ ] Vote is locked after submission
- [ ] Results update correctly
- [ ] History view works
- [ ] Streaks calculate properly
- [ ] Mobile responsive
- [ ] Ready to deploy!

## 🆘 Getting Help

### Resources
- [Devvit Documentation](https://developers.reddit.com/docs)
- [Devvit Discord](https://discord.gg/devvit)
- [GitHub Issues](https://github.com/wildhash/DilemmaForge/issues)

### Common Questions

**Q: How do I test with multiple users?**
A: Use the user switcher in the playtest interface to simulate different users.

**Q: When do points get awarded?**
A: Points are calculated at midnight UTC when the day's results are finalized.

**Q: Can I change the 70% threshold?**
A: Yes! Edit the `calculateResults()` function in `src/utils/game.ts`.

**Q: How do I customize the UI?**
A: Edit the component in `src/main.tsx`. The UI uses Devvit's block system.

**Q: Can I add more game modes?**
A: Absolutely! The code is designed to be extensible. Add new logic in the utils folder.

## 🚢 Ready to Ship?

Before deploying to production:
1. ✅ All tests pass
2. ✅ Mobile tested
3. ✅ Error handling verified
4. ✅ Documentation reviewed
5. ✅ User feedback gathered
6. ✅ Performance acceptable

---

**Happy Forging! ⚖️**
