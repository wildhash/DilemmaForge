# Contributing to DilemmaForge

Thank you for your interest in contributing to DilemmaForge! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Check if the issue already exists
- Use the issue template
- Provide clear reproduction steps
- Include screenshots if applicable
- Specify your environment (browser, device, etc.)

### Suggesting Features
- Open an issue with the `feature` label
- Describe the use case
- Explain the expected behavior
- Consider backward compatibility

### Code Contributions
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Update documentation
6. Submit a pull request

## 🔧 Development Setup

### Prerequisites
- Node.js v18 or higher
- npm v8 or higher
- Devvit CLI
- Git

### Initial Setup
```bash
git clone https://github.com/yourusername/DilemmaForge.git
cd DilemmaForge
npm install
```

### Running Locally
```bash
npm run dev
```

## 📝 Coding Standards

### TypeScript
- Use TypeScript for all new code
- Define interfaces for data structures
- Avoid `any` types
- Use proper typing for function parameters and returns

### Code Style
- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Follow existing naming conventions

### Comments
- Use JSDoc for functions
- Comment complex logic
- Keep comments up to date
- Avoid obvious comments

### Example
```typescript
/**
 * Calculates the outcome and points based on vote distribution
 * @param cooperateCount - Number of users who cooperated
 * @param defectCount - Number of users who defected
 * @returns Object with outcome type and point values
 */
function calculateResults(
  cooperateCount: number,
  defectCount: number
): {
  outcome: 'all-cooperate' | 'all-defect' | 'mixed';
  pointsForCooperators: number;
  pointsForDefectors: number;
} {
  // Implementation
}
```

## 🧪 Testing

### Before Submitting
- Run local playtest
- Test your changes manually
- Verify existing functionality still works
- Test on mobile viewports
- Check for console errors

### Test Coverage
- Add tests for new features
- Update tests for changed functionality
- Ensure tests are maintainable
- Document test scenarios

### Running Tests
```bash
# Run game logic tests
node tests/game-logic.test.ts

# Manual testing
npm run dev
```

## 📚 Documentation

### Update Documentation
When making changes, update:
- README.md - User-facing features
- API.md - API changes
- TESTING.md - New test scenarios
- Code comments - Complex logic

### Documentation Style
- Use clear, simple language
- Include examples
- Add screenshots for UI changes
- Keep formatting consistent

## 🔀 Pull Request Process

### Before Submitting
1. Update your branch with latest main
2. Resolve any conflicts
3. Test thoroughly
4. Update documentation
5. Write a clear PR description

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Tested on mobile
- [ ] All existing tests pass
- [ ] Added new tests if needed

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No console errors
- [ ] Backward compatible
```

### Review Process
1. Automated checks run
2. Maintainers review code
3. Address feedback
4. Changes approved
5. PR merged

## 🏗️ Architecture

### Project Structure
```
DilemmaForge/
├── src/
│   ├── main.tsx              # Main app component
│   ├── utils/
│   │   ├── game.ts           # Game logic
│   │   ├── streaks.ts        # Streak calculations
│   │   └── canvas-animation.ts # Animations
│   └── webview/
│       └── index.html        # WebView UI
├── tests/
│   └── game-logic.test.ts    # Tests
├── README.md                 # Main documentation
├── API.md                    # API reference
├── TESTING.md                # Testing guide
└── package.json              # Dependencies
```

### Key Components

**main.tsx**: 
- Custom Post component
- Vote submission logic
- UI rendering
- State management

**utils/game.ts**:
- Core game calculations
- Date utilities
- Emoji generation

**utils/streaks.ts**:
- Streak tracking
- Stats updates

## 💡 Ideas for Contribution

### Beginner-Friendly
- Fix typos in documentation
- Improve error messages
- Add more emoji options
- Enhance CSS styling

### Intermediate
- Add unit tests
- Improve mobile UI
- Add animations
- Optimize performance

### Advanced
- Implement leaderboards
- Add achievement system
- Build tournament mode
- Create admin dashboard

## 🐛 Bug Fix Guidelines

### Small Bugs
- Can be fixed directly
- Include test case
- Document the fix

### Large Bugs
- Open an issue first
- Discuss approach
- Break into smaller tasks
- Coordinate with maintainers

## 🎨 UI/UX Guidelines

### Design Principles
- Mobile-first approach
- Touch-friendly (min 44x44px buttons)
- Clear visual hierarchy
- Accessible colors
- Smooth animations

### Consistency
- Follow existing patterns
- Use Devvit components
- Match the app theme
- Test on various devices

## 🔒 Security

### Security Issues
- **Do not** open public issues for security vulnerabilities
- Email maintainers directly
- Provide detailed information
- Allow time for fixes before disclosure

### Secure Coding
- Validate all user input
- Sanitize data before storage
- Use parameterized queries
- Never commit secrets

## 📊 Performance

### Optimization Guidelines
- Minimize Redis operations
- Use atomic operations
- Cache when appropriate
- Avoid unnecessary re-renders

### Monitoring
- Check response times
- Monitor memory usage
- Track error rates
- Review Redis performance

## 🌍 Internationalization

### Future i18n Support
- Use string constants
- Avoid hardcoded text
- Support RTL languages
- Consider date/time formats

## 📦 Dependencies

### Adding Dependencies
- Justify the need
- Check bundle size impact
- Ensure compatibility
- Update documentation

### Updating Dependencies
- Test thoroughly
- Check for breaking changes
- Update package.json
- Document changes

## 🔄 Release Process

### Versioning
We use [Semantic Versioning](https://semver.org/):
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Tag created
- [ ] Announcement prepared

## 💬 Communication

### Channels
- GitHub Issues: Bug reports, features
- Pull Requests: Code discussions
- Discord: Real-time chat (if available)

### Etiquette
- Be respectful and professional
- Stay on topic
- Help other contributors
- Accept constructive feedback

## 🎓 Learning Resources

### Devvit
- [Official Docs](https://developers.reddit.com/docs)
- [API Reference](https://developers.reddit.com/docs/api)
- [Examples](https://developers.reddit.com/docs/examples)

### Game Theory
- [Prisoner's Dilemma](https://en.wikipedia.org/wiki/Prisoner%27s_dilemma)
- [Iterated Games](https://en.wikipedia.org/wiki/Iterated_prisoner%27s_dilemma)

### TypeScript
- [Official Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

## ❓ Questions?

If you have questions:
1. Check existing documentation
2. Search closed issues
3. Ask in discussions
4. Open a new issue

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Acknowledged in the README

Thank you for contributing to DilemmaForge! 🎉
