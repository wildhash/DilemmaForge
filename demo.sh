#!/bin/bash

# DilemmaForge Demo Script
# This script provides automated testing scenarios for the DilemmaForge game

echo "=========================================="
echo "  DilemmaForge - Demo & Testing Script"
echo "=========================================="
echo ""

# Check if devvit is installed
if ! command -v devvit &> /dev/null; then
    echo "❌ Devvit CLI not found. Please install it first:"
    echo "   npm install -g devvit"
    exit 1
fi

echo "✅ Devvit CLI found"
echo ""

# Function to display menu
show_menu() {
    echo "Select a demo scenario:"
    echo ""
    echo "1. Test Scenario 1: First Vote (Cooperate)"
    echo "2. Test Scenario 2: Multiple Users, Mixed Votes"
    echo "3. Test Scenario 3: All Cooperate (≥70%)"
    echo "4. Test Scenario 4: All Defect (≥70%)"
    echo "5. Test Scenario 5: View History"
    echo "6. Run Local Playtest"
    echo "7. Build Project"
    echo "8. Upload to Reddit"
    echo "9. Exit"
    echo ""
    read -p "Enter your choice (1-9): " choice
}

# Test scenario descriptions
scenario_1() {
    echo ""
    echo "📋 Test Scenario 1: First Vote (Cooperate)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Steps:"
    echo "1. Open the DilemmaForge post"
    echo "2. Click the '🤝 Cooperate' button"
    echo "3. Verify: Toast shows 'Vote submitted: 🤝 Cooperate'"
    echo "4. Verify: UI shows 'You chose: Cooperate'"
    echo "5. Verify: Vote is locked (can't vote again)"
    echo "6. Verify: Current results show 1 cooperate vote (100%)"
    echo ""
    echo "Expected Results:"
    echo "✓ Vote successfully submitted"
    echo "✓ UI updates to locked state"
    echo "✓ Results show 1 cooperate vote"
    echo "✓ Percentage shows 100%"
    echo ""
}

scenario_2() {
    echo ""
    echo "📋 Test Scenario 2: Multiple Users, Mixed Votes"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Setup:"
    echo "- User 1: Cooperate"
    echo "- User 2: Cooperate"
    echo "- User 3: Defect"
    echo "- User 4: Defect"
    echo "- User 5: Defect"
    echo ""
    echo "Expected Results:"
    echo "✓ Total Votes: 5"
    echo "✓ Cooperate: 2 (40%)"
    echo "✓ Defect: 3 (60%)"
    echo "✓ Outcome: Mixed (neither ≥70%)"
    echo "✓ Points: Defectors get +5, Cooperators get 0"
    echo ""
}

scenario_3() {
    echo ""
    echo "📋 Test Scenario 3: All Cooperate (≥70%)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Setup:"
    echo "- 7 users: Cooperate"
    echo "- 1 user: Defect"
    echo ""
    echo "Expected Results:"
    echo "✓ Total Votes: 8"
    echo "✓ Cooperate: 7 (87.5%)"
    echo "✓ Defect: 1 (12.5%)"
    echo "✓ Outcome: All Cooperate"
    echo "✓ Points: Everyone gets +3"
    echo ""
}

scenario_4() {
    echo ""
    echo "📋 Test Scenario 4: All Defect (≥70%)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Setup:"
    echo "- 1 user: Cooperate"
    echo "- 7 users: Defect"
    echo ""
    echo "Expected Results:"
    echo "✓ Total Votes: 8"
    echo "✓ Cooperate: 1 (12.5%)"
    echo "✓ Defect: 7 (87.5%)"
    echo "✓ Outcome: All Defect"
    echo "✓ Points: Everyone gets +1"
    echo ""
}

scenario_5() {
    echo ""
    echo "📋 Test Scenario 5: View History"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Steps:"
    echo "1. Vote for several days"
    echo "2. Click 'View History' button"
    echo "3. Verify: Emoji grid displays past votes"
    echo "4. Verify: Statistics show correct totals"
    echo "5. Verify: Streak count is accurate"
    echo ""
    echo "Expected Results:"
    echo "✓ Emoji grid shows voting history"
    echo "✓ 🤝 for cooperate days"
    echo "✓ ⚔️ for defect days"
    echo "✓ Statistics are accurate"
    echo ""
}

run_playtest() {
    echo ""
    echo "🎮 Starting Local Playtest..."
    echo ""
    npm run dev
}

build_project() {
    echo ""
    echo "🔨 Building Project..."
    echo ""
    npm run build
}

upload_project() {
    echo ""
    echo "📤 Uploading to Reddit..."
    echo ""
    npm run upload
}

# Main loop
while true; do
    show_menu
    
    case $choice in
        1) scenario_1 ;;
        2) scenario_2 ;;
        3) scenario_3 ;;
        4) scenario_4 ;;
        5) scenario_5 ;;
        6) run_playtest ;;
        7) build_project ;;
        8) upload_project ;;
        9) 
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please select 1-9."
            ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    clear
done
