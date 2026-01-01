# Time Calculations

## Overview

Recess dynamically adjusts focus session and break lengths based on three factors:

1. **Momentum** - How reliably you complete sessions
2. **Fatigue** - How much you've worked today
3. **Progress** - How close you are to your daily goal

This document explains each factor and how they influence session durations.

---

## The Three Factors

### 1. Momentum (M)

**What it is:**
A score between 0 and 1 that represents how well you're completing focus sessions.

**What it means:**

- **M = 1.0** → Perfect track record, completing every session
- **M = 0.5** → Neutral (starting point each day)
- **M = 0.0** → Struggling, abandoning most sessions

**How it updates:**
After each focus session, momentum moves halfway toward the outcome:

```
New Momentum = 0.5 × outcome + 0.5 × Old Momentum

Where outcome = 1 if completed, 0 if ended early
```

**Example:**
Starting momentum = 0.5 (neutral)

Complete a session:

```
New M = 0.5 × 1 + 0.5 × 0.5 = 0.75
```

Complete another:

```
New M = 0.5 × 1 + 0.5 × 0.75 = 0.875
```

Abandon next session:

```
New M = 0.5 × 0 + 0.5 × 0.875 = 0.4375
```

**Why it matters:**

- High momentum → You're in flow state → Can handle longer sessions
- Low momentum → You're struggling → Need shorter, achievable sessions to rebuild confidence

**Technical name:** CEWMA (Completion Exponentially Weighted Moving Average)

**Constants:**

```typescript
CEWMA_ALPHA = 0.5; // How fast momentum changes
CEWMA_STARTING_VALUE = 0.5; // Starting point each day
```

---

### 2. Fatigue (F)

**What it is:**
A measure of mental tiredness based on how much you've worked today.

**What it means:**

- **F = 0.0** → Fresh, just started
- **F = 0.5** → Halfway through daily target
- **F = 1.0** → Met daily target, quite tired
- **F > 1.0** → Working past target, very tired

**How it's calculated:**

Fatigue has two components:

**Component A: Base Fatigue** (from total accumulated work)

```
Base Fatigue = (completed_work / daily_target)²
```

Squared means fatigue accelerates as you work more. The last hour of work is more tiring than the first.

**Component B: Session Strain** (from recent session size)

```
Strain = (last_session_minutes / (0.5 × daily_target))²
```

This captures whether your recent session was "big" (longer than half your daily target).

**Combined:**

```
Fatigue = Base Fatigue + 0.5 × Session Strain
```

**Example:**
Daily target = 270 minutes (4.5 hours)

After 135 minutes of work (50% of target), last session was 60 minutes:

```
Base = (135 / 270)² = 0.5² = 0.25

Threshold for "big" session = 0.5 × 270 = 135 minutes
Strain = (60 / 135)² = 0.44² = 0.20

Fatigue = 0.25 + 0.5 × 0.20 = 0.35
```

**Why it matters:**

- High fatigue → Need shorter focus sessions
- High fatigue → Need longer breaks
- Recent big session → Extra fatigue even if total work is moderate

**Constants:**

```typescript
SESSION_STRAIN_WEIGHT = 0.5; // How much recent strain contributes
FATIGUE_SESSION_SIZE_THRESHOLD = 0.5; // 50% of daily target = "big" session
```

---

### 3. Progress (P)

**What it is:**
How far through your daily work goal you are.

**What it means:**

```
Progress = completed_work / daily_target
```

- **P = 0.0** → Just started
- **P = 0.5** → Halfway done
- **P = 1.0** → Goal met
- **P > 1.0** → Working past goal

**Why it matters:**

- Late in the day → Slightly shorter focus sessions (you're close to done)
- Late in the day → Slightly longer breaks (you've earned them)

**Not the primary driver:**
Progress has smaller weights than fatigue. It's a gentle nudge, not a major factor.

---

## Focus Session Duration

**Goal:** Longer sessions when you're in flow, shorter when struggling or tired.

**Formula:**

```
Duration = BASE + MOMENTUM_WEIGHT × M - FATIGUE_WEIGHT × F - PROGRESS_WEIGHT × P
```

**In plain English:**
Start with a baseline (10 minutes), then:

- **Add** time for high momentum (up to +35 minutes)
- **Subtract** time for fatigue (up to -25 minutes)
- **Subtract** a bit for progress (up to -10 minutes)

**Constants:**

```typescript
BASE_WORK_MINUTES = 10; // Minimum baseline
MOMENTUM_WORK_WEIGHT = 35; // Reward for consistency
FATIGUE_WORK_WEIGHT = 25; // Primary limiter
PROGRESS_WORK_WEIGHT = 10; // Gentle late-day reduction
MIN_WORK_SESSION_MINUTES = 5; // Hard floor
```

**Example Scenarios:**

**Scenario 1: Fresh start (neutral state)**

```
M = 0.5, F = 0.0, P = 0.0
Duration = 10 + 35(0.5) - 25(0) - 10(0) = 27.5 minutes → rounds to 28 minutes
```

**Scenario 2: High momentum, not tired**

```
M = 0.9, F = 0.2, P = 0.3
Duration = 10 + 35(0.9) - 25(0.2) - 10(0.3) = 10 + 31.5 - 5 - 3 = 33.5 → 34 minutes
```

**Scenario 3: Low momentum, tired, late in day**

```
M = 0.3, F = 0.8, P = 0.9
Duration = 10 + 35(0.3) - 25(0.8) - 10(0.9) = 10 + 10.5 - 20 - 9 = -8.5
→ Clamped to MIN (5 minutes)
```

**Scenario 4: High momentum, very tired**

```
M = 0.85, F = 1.2, P = 1.1
Duration = 10 + 35(0.85) - 25(1.2) - 10(1.1) = 10 + 29.75 - 30 - 11 = -1.25
→ Clamped to MIN (5 minutes)
```

**Why these weights?**

- **Momentum is the biggest positive factor** (35) because being in flow state is powerful
- **Fatigue is the biggest negative factor** (25) because tired focus is ineffective
- **Progress is minor** (10) because being "close to done" shouldn't drastically change sessions
- **BASE is low** (10) to allow formula to have room to work without making tiny sessions

**Additional constraint:**
Session duration can't exceed `workSessionDurationRemaining`. If you only have 15 minutes left in your daily goal, you can't get a 30-minute session.

---

## Break Duration

**Goal:** Longer breaks when tired or later in the day, shorter when fresh.

**Formula:**

```
Duration = BASE + FATIGUE_WEIGHT × F + PROGRESS_WEIGHT × P + MOMENTUM_WEIGHT × M
```

**In plain English:**
Start with a baseline (5 minutes), then:

- **Add** time for fatigue (up to +10 minutes) - primary driver
- **Add** a bit for progress (up to +2 minutes) - late day bonus
- **Add** time for momentum (up to +4 minutes) - you've earned it

**Constants:**

```typescript
BASE_BREAK_MINUTES = 5; // Minimum baseline
FATIGUE_BREAK_WEIGHT = 10; // Primary driver
PROGRESS_BREAK_WEIGHT = 2; // Slight late-day increase
MOMENTUM_BREAK_WEIGHT = 4; // Reward for consistency
```

**Example Scenarios:**

**Scenario 1: Fresh start**

```
F = 0.0, P = 0.0, M = 0.5
Duration = 5 + 10(0) + 2(0) + 4(0.5) = 5 + 0 + 0 + 2 = 7 minutes
```

**Scenario 2: Moderate fatigue, good momentum**

```
F = 0.5, P = 0.4, M = 0.8
Duration = 5 + 10(0.5) + 2(0.4) + 4(0.8) = 5 + 5 + 0.8 + 3.2 = 14 minutes
```

**Scenario 3: Very tired, late in day, high momentum**

```
F = 1.2, P = 0.95, M = 0.85
Duration = 5 + 10(1.2) + 2(0.95) + 4(0.85) = 5 + 12 + 1.9 + 3.4 = 22.3 → 22 minutes
```

**Scenario 4: Struggling, early in day**

```
F = 0.2, P = 0.1, M = 0.3
Duration = 5 + 10(0.2) + 2(0.1) + 4(0.3) = 5 + 2 + 0.2 + 1.2 = 8.4 → 8 minutes
```

**Why these weights?**

- **Fatigue is the primary driver** (10) because breaks are for recovery
- **Momentum adds break time** (4) because consistent workers deserve longer breaks
- **Progress adds a bit** (2) because end-of-day breaks should be longer
- **All weights are positive** - breaks never get shorter than baseline, only longer

**Note on reward selection:**
The calculated break duration is a suggestion. When the user selects a reward, the reward's duration (5-30 minutes, user's choice) overrides the calculated value. The calculation still matters for the "Back to It" transition logic.

---

## When Calculations Happen

**At app startup:**

- Momentum = 0.5 (neutral)
- Fatigue = 0 (no work yet)
- Progress = 0 (no work yet)
- Calculate initial session durations

**After each focus session (completed or abandoned):**

1. Update momentum based on completion
2. Update `completedWorkMinutesToday` and `lastCompletedSessionMinutes`
3. Recalculate fatigue
4. Recalculate progress
5. Calculate new `nextFocusDuration` and `nextBreakDuration`

**Where:**
All calculations happen in `src/lib/session-duration-calculator.ts`

All calls to these functions happen in `src/store/slices/timerSlice.ts`

---

## Design Philosophy

### Why Not Fixed Durations (Like Pomodoro)?

**Problem with 25-minute Pomodoros:**

- Too long when you're tired or struggling
- Too short when you're in deep flow
- Same duration morning vs. afternoon doesn't make sense

**Our approach:**

- Sessions adapt to YOUR current state
- Rewards consistency (momentum)
- Prevents burnout (fatigue)
- Makes goals achievable when struggling (short sessions rebuild momentum)

### Why Exponential Weighting for Momentum?

**Linear average would be:**

```
Average = (sessions_completed / total_sessions)
```

**Problems:**

- Early mistakes stick around forever
- Doesn't reflect current state
- Can't "recover" from bad start

**Exponential weighting:**

- Recent sessions matter more
- You can recover from early struggles
- Reflects current momentum, not historical average

### Why Square Fatigue Components?

```
Base Fatigue = (completed / target)²
```

**Linear would be:**

```
Base Fatigue = completed / target
```

**Why square?**

- Fatigue accelerates nonlinearly (last hour is much harder than first)
- Captures reality of mental tiredness
- Creates steeper curve as you approach goal

### Why Separate Session Strain?

You could work 2 hours by doing:

- Four 30-minute sessions → Manageable
- One 120-minute session → Exhausting

Session strain captures this. A recent big session is more fatiguing than many small ones totaling the same time.

---

## Tuning the System

If you wanted to adjust the behavior:

**Make momentum more impactful:**

- Increase `MOMENTUM_WORK_WEIGHT` (currently 35)
- Increase `MOMENTUM_BREAK_WEIGHT` (currently 4)

**Make fatigue less punishing:**

- Decrease `FATIGUE_WORK_WEIGHT` (currently 25)
- Decrease `SESSION_STRAIN_WEIGHT` (currently 0.5)

**Lengthen all sessions:**

- Increase `BASE_WORK_MINUTES` (currently 10)
- Increase `BASE_BREAK_MINUTES` (currently 5)

**Change how fast momentum updates:**

- Increase `CEWMA_ALPHA` toward 1.0 → More reactive to recent sessions
- Decrease `CEWMA_ALPHA` toward 0.0 → More stable, slower to change

**All these constants live in:**
`src/lib/constants.ts`

---

## Common Questions

**Q: Why can momentum go below 0.5 (starting value)?**

A: Because abandoning sessions is penalized. If you start at 0.5 and abandon the first session, you drop to 0.25. This makes sense - you're doing worse than neutral.

**Q: Can fatigue exceed 1.0?**

A: Yes! If you work past your daily target, fatigue can go above 1.0. The formulas handle this - sessions get shorter, breaks get longer.

**Q: Why does progress reduce focus session length?**

A: Psychological benefit. When you're at 90% of your goal, shorter sessions feel more achievable and help you push through the finish line rather than getting stuck on one long final session.

**Q: What if I work inconsistently - long sessions some days, short others?**

A: Momentum and fatigue reset each day (implicitly - we track `completedWorkMinutesToday`, not across days). Each day starts fresh at M=0.5, F=0.

**Q: Can I game the system by ending sessions early to get shorter durations?**

A: You could, but momentum would drop, making sessions shorter but also less rewarding. The system is designed to incentivize completion, not abandonment.

---

## Debugging Calculation Issues

If session durations seem wrong:

1. **Check current values in Redux DevTools:**

   ```
   state.timer.momentum
   state.timer.completedWorkMinutesToday
   state.timer.targetWorkMinutesToday
   state.timer.lastCompletedSessionMinutes
   ```

2. **Manually calculate expected fatigue:**

   ```
   base = (completed / target)²
   strain = (lastSession / (0.5 × target))²
   fatigue = base + 0.5 × strain
   ```

3. **Manually calculate expected duration:**

   ```
   focus = 10 + 35M - 25F - 10P
   break = 5 + 10F + 2P + 4M
   ```

4. **Check if duration is being clamped:**

   - Focus sessions have a floor of 5 minutes
   - Focus sessions can't exceed `workSessionDurationRemaining`

5. **Look for state update issues:**
   - Did momentum update correctly after last session?
   - Is `completedWorkMinutesToday` accurate?
   - Is `lastCompletedSessionMinutes` set?

If calculations don't match, the issue is likely in `timerSlice.ts` state updates, not the formulas themselves.
