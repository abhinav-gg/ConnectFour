# Bot Game Testing Scenarios

This document provides comprehensive testing scenarios for the bot game system. All scenarios marked with **[BOT LOGIC]** contain new bot-specific functionality that requires thorough testing.

## Critical Bot Game Rules

### **[BOT LOGIC]** Core Bot Game Behavior
- ✅ No timers displayed or active in bot games
- ✅ No reconnection allowed - disconnection = immediate resignation
- ✅ Games terminate immediately when human player disconnects
- ✅ Bot games use zero time control (0|0|0)

---

## Test Scenarios Checklist

### 1. **[BOT LOGIC]** Bot Game Creation
**Purpose:** Verify bot games are created correctly with proper settings

#### Test Case 1.1: Standard Bot Game Creation
- [ ] Navigate to `/play/bots`
- [ ] Select any bot (1-8 difficulty levels)
- [ ] Choose any color (red/yellow/random)
- [ ] Click "Start Game"
- [ ] **Expected:** Game created successfully
- [ ] **Expected:** Redirected to game page
- [ ] **Expected:** No timer displays visible
- [ ] **Expected:** Game starts immediately

#### Test Case 1.2: Random Color Selection
- [ ] Create bot game with "Random" color
- [ ] **Expected:** Game assigns either red or yellow randomly
- [ ] **Expected:** Bot plays the opposite color
- [ ] **Expected:** Turn order matches color assignment

#### Test Case 1.3: Multiple Bot Difficulties
Test each bot level (1-8):
- [ ] Beginner Bot (Level 1)
- [ ] Easy Bot (Level 2) 
- [ ] Medium Bot (Level 3)
- [ ] Hard Bot (Level 4)
- [ ] Expert Bot (Level 5)
- [ ] Advanced Bot (Level 6)
- [ ] Master Bot (Level 7)
- [ ] Perfect Bot (Level 8)

**Expected for all:** Game creation successful, appropriate difficulty behavior

---

### 2. **[BOT LOGIC]** Timer Behavior
**Purpose:** Verify no timers are shown or active in bot games

#### Test Case 2.1: Timer Display Disabled
- [ ] Start any bot game
- [ ] **Expected:** No timer UI elements visible
- [ ] **Expected:** No countdown displays
- [ ] **Expected:** No time pressure indicators
- [ ] **Expected:** Game metadata shows 0|0|0 time control

#### Test Case 2.2: Compare with Regular Games
- [ ] Start a regular human vs human game
- [ ] **Expected:** Timers visible and active
- [ ] Start a bot game
- [ ] **Expected:** No timers visible
- [ ] **Expected:** Clear visual difference

---

### 3. **[BOT LOGIC]** Disconnection Handling
**Purpose:** Verify immediate resignation on disconnect with no reconnection

#### Test Case 3.1: Human Player Disconnects
- [ ] Start bot game
- [ ] Close browser tab/window during game
- [ ] **Expected:** Game ends immediately
- [ ] **Expected:** Bot wins by resignation
- [ ] **Expected:** No disconnect timer/job created
- [ ] Try to rejoin game using same shortcode
- [ ] **Expected:** "Bot game is no longer available" message

#### Test Case 3.2: Network Disconnection
- [ ] Start bot game
- [ ] Disconnect internet/network
- [ ] **Expected:** Game ends when disconnection detected
- [ ] Reconnect network
- [ ] Try to rejoin game
- [ ] **Expected:** Cannot rejoin, game terminated

#### Test Case 3.3: Browser Refresh During Bot Game
- [ ] Start bot game
- [ ] Refresh browser page (F5 or Ctrl+R)
- [ ] **Expected:** Cannot rejoin game
- [ ] **Expected:** Game session lost permanently

---

### 4. **[BOT LOGIC]** Game State Management
**Purpose:** Verify bot games maintain proper state

#### Test Case 4.1: Game Progression
- [ ] Start bot game as red (going first)
- [ ] Make several moves
- [ ] **Expected:** Bot responds immediately after each move
- [ ] **Expected:** No timer delays or countdowns
- [ ] **Expected:** Game state updates correctly

#### Test Case 4.2: Game Completion
- [ ] Play bot game to completion (win/loss/draw)
- [ ] **Expected:** Game ends normally
- [ ] **Expected:** Proper end game modal
- [ ] **Expected:** No timer references in end screen

#### Test Case 4.3: Mid-Game Resignation
- [ ] Start bot game
- [ ] Click resign button
- [ ] **Expected:** Game ends immediately
- [ ] **Expected:** Bot wins by resignation
- [ ] **Expected:** No reconnection possible

---

### 5. Regular Game Functionality (Regression Testing)
**Purpose:** Ensure bot changes don't break normal games

#### Test Case 5.1: Human vs Human Games
- [ ] Create casual game
- [ ] **Expected:** Timers work normally
- [ ] **Expected:** Disconnection creates 30-second timer
- [ ] **Expected:** Reconnection possible within timer
- [ ] **Expected:** Normal game flow maintained

#### Test Case 5.2: Competitive Games  
- [ ] Join ranked game
- [ ] **Expected:** All timer functionality works
- [ ] **Expected:** ELO changes calculated
- [ ] **Expected:** Disconnection handling normal

---

### 6. **[BOT LOGIC]** Error Handling
**Purpose:** Test edge cases and error conditions

#### Test Case 6.1: Invalid Bot Selection
- [ ] Try to create game with non-existent bot ID
- [ ] **Expected:** Proper error message
- [ ] **Expected:** No game created

#### Test Case 6.2: Multiple Concurrent Bot Games
- [ ] Try to start second bot game while first is active
- [ ] **Expected:** "Already in a game" error
- [ ] **Expected:** Cannot create multiple bot games

#### Test Case 6.3: Bot Game with Invalid Time Control
- [ ] Attempt to force time control on bot game (if possible via API)
- [ ] **Expected:** Time control overridden to 0|0|0
- [ ] **Expected:** No timers shown regardless

---

### 7. **[BOT LOGIC]** UI/UX Testing
**Purpose:** Verify user interface behaves correctly

#### Test Case 7.1: Bot Selection Interface
- [ ] All 8 bot levels display correctly
- [ ] Bot avatars/icons load properly
- [ ] Difficulty descriptions accurate
- [ ] Color selection works (red/yellow/random)

#### Test Case 7.2: In-Game UI
- [ ] No timer elements visible
- [ ] Player info displays correctly
- [ ] Bot opponent shows as bot (not human player)
- [ ] Move animations work properly

#### Test Case 7.3: Game End UI
- [ ] End game modal displays properly
- [ ] No timer-related information shown
- [ ] Proper win/loss/draw messaging
- [ ] No reconnection options presented

---

### 8. **[BOT LOGIC]** Performance Testing
**Purpose:** Verify bot games perform well

#### Test Case 8.1: Bot Response Time
- [ ] Make moves against different bot levels
- [ ] **Expected:** Bot responds within 1-2 seconds maximum
- [ ] **Expected:** No UI blocking during bot thinking
- [ ] **Expected:** Smooth move animations

#### Test Case 8.2: Multiple Bot Games (Different Users)
- [ ] Have multiple users start bot games simultaneously
- [ ] **Expected:** All games function independently
- [ ] **Expected:** No performance degradation
- [ ] **Expected:** Bot responses remain fast

---

### 9. Backend API Testing
**Purpose:** Verify backend properly handles bot game logic

#### Test Case 9.1: Game Creation API
- [ ] POST to create bot game endpoint
- [ ] **Expected:** Game created with 0|0|0 time control
- [ ] **Expected:** Bot identity properly assigned
- [ ] **Expected:** Human player assigned correctly

#### Test Case 9.2: Disconnection API
- [ ] Simulate disconnect during bot game
- [ ] **Expected:** Game immediately transitions to resignation state
- [ ] **Expected:** No disconnect job created in queue
- [ ] **Expected:** Game marked as ended

#### Test Case 9.3: Reconnection API
- [ ] Try to rejoin bot game after disconnect
- [ ] **Expected:** 404 "Bot game is no longer available"
- [ ] **Expected:** No game data returned

---

### 10. Database/Storage Testing
**Purpose:** Verify proper data handling

#### Test Case 10.1: Game Storage
- [ ] Complete bot game
- [ ] **Expected:** Game properly stored in database
- [ ] **Expected:** Time control recorded as 0|0|0
- [ ] **Expected:** Bot identity preserved in player data

#### Test Case 10.2: Disconnection Records
- [ ] Disconnect from bot game
- [ ] **Expected:** Game marked as resignation
- [ ] **Expected:** No disconnection timeout records
- [ ] **Expected:** Final state properly recorded

---

## Testing Notes

### **[BOT LOGIC]** Priority Testing Areas
1. **Disconnection handling** - Most critical functionality
2. **Timer disabling** - Core UI requirement  
3. **No reconnection** - Security and UX requirement
4. **Game creation** - Entry point validation

### Test Environment Setup
- Use different browsers (Chrome, Firefox, Safari, Edge)
- Test on different devices (desktop, mobile, tablet)
- Test with different network conditions
- Use different user accounts

### Debugging Information
When testing, check browser console for:
- `[BOT GAME]` prefixed log messages
- Error messages related to timers
- Disconnection job creation (should not happen)
- Game state transitions

### Expected Error Messages
- "Bot game is no longer available" - When trying to rejoin
- "Reconnection not allowed in bot games" - Internal error handling
- "Already in a game" - When creating second bot game

---

## Manual Testing Workflow

1. **Start with bot game creation** - Test Case 1.1
2. **Verify timer absence** - Test Case 2.1  
3. **Test disconnection** - Test Case 3.1
4. **Verify no reconnection** - Test Case 3.1 (continued)
5. **Test normal game** - Test Case 5.1 (regression)
6. **Test edge cases** - Test Cases 6.1-6.3

## Success Criteria

### ✅ Bot Games Must:
- Show no timers anywhere in UI
- End immediately on disconnect
- Prevent all reconnection attempts
- Use 0|0|0 time control internally
- Function smoothly with bot responses

### ✅ Regular Games Must:
- Continue working exactly as before
- Show timers normally
- Allow disconnection/reconnection
- Maintain all existing functionality

---

*All test cases marked with **[BOT LOGIC]** contain new functionality requiring careful validation. Regular test cases ensure no regression in existing features.*