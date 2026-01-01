# Dynamic Session Duration Calculations

**Completed Work Time**

- Tracks progress toward the daily goal.
- The system stops once the target is reached.
- **Progress through the day forumla:**
    - W = completed_work_minutes_today
    - T = user_target_work_minutes_today
    - P = W / T

**Productivity MomentumCompletion Exponentially Weighted Moving Average (CEWMA)**

- This represents how likely the user is to complete the *next* work session, based on what just happened?
- Starts each day the CEWMA starts at **0.5** (neutral)
    - c is either:
        - **1** if the session completed
        - **0** if the session was abandoned
- α decides how big that move is.
    - With α = 0.5
    - The score moves **halfway** toward success or failure each time.
    - One session has a *big* impact.
    - This is exactly what you want when:
        - The user only has ~**3 sessions per day**
        - Each session represents a large fraction of the day
- **Formula: C_ewma ← α*c + (1-α)*C_ewma**
    - After each session c = 1 if the session completed, else 0.
    - α = 0.5
    - C_ewma starts at 0.5
    - Interpretation:
        - C_ewma ≈ 1.0 → you’re reliably finishing sessions → safe to extend.
        - C_ewma ≈ 0.0 → repeated abandonment → shrink aggressively.

**Fatigue Proxy**

A nonlinear proxy derived only from:

- Total completed work time today
- Length of recent sessions

Fatigue increases slowly early in the day and faster after sustained work. It caps how long the next session can be.

- **Base Fatigue Formula:**
    - W = completed_work_minutes_today
    - T = user_target_work_minutes_today
    - **fatigue_base = (W / T)^2**
    - At half their target (W = 0.5T) → fatigue = 0.25
    - At their target (W = T) → fatigue = 1.0
    - Past target (W > T) → fatigue rises quickly
- **Recent session strain:**
    - **session_strain = (last_completed_work_minutes / (0.5*T))^2**
    - Any session longer than **half their daily goal** is “big.”
- **Final fatigue score**
    - **fatigue = fatigue_base + 0.5 * session_strain**
        - "Session strain matters about **half as much** as total-day accumulation."

**Working Session Duration Calculation**

- T = user target work minutes today
- W = completed work minutes today
- M = CEWMA in 0,1 (higher = more momentum / stability)
- F = Fatigue score
- P = Progress in the day

**Working Session = 10 + 35*M − 25*F − 10*P**

- **10**: Minimum session length
- **+35*M**: if you’re reliably completing sessions, you earn longer sessions
- **−25*F**: fatigue is the main limiter
- **−10*P**: as you approach the end of the day/goal, slightly shorten to keep completion high

**Break Duration Calculation**

- T = user target work minutes today
- W = completed work minutes today
- M = CEWMA in 0,1 (higher = more momentum / stability)
- F = Fatigue score
- P = Progress in the day

**Break = 5 + 10*F + 2*P + 4*M**

- **5**: minimum break length
- **+10*F**: fatigue is the main driver of longer breaks
- **+2*P**: later in the day you can justify slightly longer recovery
- **+4*M**: when momentum is high, longer breaks are *less risky* (they’re more likely to come back), so you allow a bit more recovery; when momentum is low, breaks stay closer to the minimum to avoid drift
- Does the math works so that longer sessions will result in long break?