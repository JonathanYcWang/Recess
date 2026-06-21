# Recess Domain Rules

> These rules describe the intended product model, not necessarily current implementation. Inspect the code and tests before treating any rule as implemented behavior.

## Work Session lifecycle

- The Work Session clock runs during Focus Blocks, Reward Games, Recesses, and Back to Work Countdowns. It pauses only during a Time Out.
- The Scheduler sizes the final Focus Block to consume all remaining Work Session time, even when that requires a shorter-than-normal block.
- Completing the final Focus Block completes the Work Session without a final Recess or Recess Pass.
- Completing the originally declared duration permanently marks the Work Session complete.
- A Work Session Extension preserves the same history, starts a new Focus Block immediately, and earns Coins at the standard new-block rate.
- Added time is optional. Ending during a Work Session Extension never reverses original completion.
- Ending before the original goal records an incomplete Work Session and an incomplete partial Focus Block. The partial block still earns duration-based Coins.

## Focus and recovery

- A user cannot directly end a Focus Block. They may start a Time Out or end the entire Work Session.
- A Focus Block completes at its first Recess prompt.
- Declining the prompt creates a Focus Block Extension and defers one earned Recess. Recesses and Recess Passes never stack.
- Focus Block Extension time earns Coins at a reduced rate.
- When the user eventually accepts a Recess prompt, one adjusted Recess follows.
- A Recess may end early but cannot be extended.
- Ending a Recess early immediately begins the Back to Work Countdown.
- The Wind-Down Signal begins exactly two minutes before a Focus Block or Recess ends.
- The Back to Work Countdown lasts ten seconds and starts the next Focus Block automatically.

## Reward Game and Recess Pass

- Every completed non-final Focus Block that proceeds to Recess receives exactly one Recess Pass.
- The Reward Game occurs before Recess. Its time consumes Work Session time but not Recess time.
- The Reward Game always selects exactly one Block List entry; it has no empty outcome.
- Each game provides three free rerolls. Further rerolls cost Coins.
- Each game type defines a fixed decision window appropriate to its interaction. Animation time is separate from the choice portion.
- If the decision window expires, the game automatically selects an available result and proceeds.
- The Scheduler finalizes Recess duration after the Reward Game resolves, using actual remaining Work Session time.
- The Recess Pass remains valid for the Recess and expires when the Back to Work Countdown begins.

## Block List enforcement

- Every Block List entry is eligible for selection by the Reward Game.
- Block List enforcement remains active during Focus Blocks, Reward Games, Back to Work Countdowns, and Time Outs without a Hall Pass.
- Enforcement prevents access while preserving browser-tab and native-application state whenever the platform permits.
- Recess does not force-close and later reconstruct blocked destinations.

## Time Out and Hall Pass

- A Time Out may begin only during a Focus Block, including a Focus Block Extension.
- It suspends the active Focus Block and Work Session clocks and ends only when the user manually resumes.
- Every five minutes, the system reports elapsed Time Out duration and may show contextual return incentives, including next-Recess proximity, Pet state, and Coin spending.
- Attempting to use a Block List entry presents the universal recurring Coin rate and asks for confirmation before issuing a Hall Pass.
- Only one Hall Pass may be active. Confirming another destination replaces the current pass.
- Charges accrue only while the Hall Pass destination is actively foregrounded and used.
- The interface shows cumulative Coins spent during the active Hall Pass.
- If the user cannot pay the next recurring charge, access is revoked immediately while the Time Out remains active.

## Tasks

- Task use is optional. Users may select or change Tasks at any time during a Work Session.
- Several Tasks may be selected for a Focus Block, but only one Active Task receives Focused Time.
- A Task becomes In Progress when it first becomes Active and begins receiving Focused Time.
- When a Focus Block ends, its Task selection resets. Incomplete Tasks remain on the Task List for later selection.
- The Task List is manually ordered and has no separate priority property.
- The original Time Estimate is preserved, Focused Time is recorded separately, and estimated remaining work is derived from both.
- Completing a Task removes it from the active Task List while retaining it in Work History.

## Coins and progression

- Focused duration earns Coins. Focus Block Extension time earns Coins at a reduced rate; it does not receive an extension bonus.
- A new Focus Block created by a Work Session Extension earns at the standard rate even without an intervening Recess.
- Focus Block Streak and Work Session Streak milestones award Coins; ordinary advancement does not.
- The Focus Block Streak counts completed Focus Blocks within one Work Session and resets when a new Work Session starts.
- The Work Session Streak advances when a Work Session starts within fifteen minutes after an enabled Work Start Reminder.
- Missing a reminder or starting more than fifteen minutes late resets the Work Session Streak. Periods without reminders are neutral.
- XP and Levels are not part of the intended model.

## Pet and personalization

- The Onboarding Quiz is brief and required. It seeds adaptive Workstyle Profile defaults.
- The Personalization Quiz is deeper and optional. It enriches the same profile and assigns the Pet once.
- Later profile changes never replace the assigned Pet.
- Pet mood and needs are expressive, recoverable feedback. The Pet cannot die, disappear, permanently lose progress, or reduce gameplay rewards.
- Coins may buy Pet mood boosts and cosmetics; basic wellbeing is not contingent on spending.
- The Workstyle Profile evolves from Recess-specific Workstyle Signals rather than MBTI.
- Energy and Momentum are shown to users as qualitative states while internal representations may remain numeric.
- A Recess Check-In is optional. Answering it updates the Workstyle Profile; dismissing it is neutral.

## Work History and Insights

- Work History preserves factual Work Session, Focus Block, Recess, Time Out, Task, and outcome records.
- Insights derive interpretations from Work History without altering its factual records.
- Preserving both Time Estimate and Focused Time enables estimate-versus-actual Insights.

## Follow-up domain interviews

### Adaptive scheduling — TODO

Resolve Scheduler inputs, weighting, minimum and maximum durations, Work Session progress behavior, adaptation, and feedback rules. Keep Task recommendation and sequencing under the Task Planner.

### Work start scheduling — TODO

Resolve Work Start Reminder recurrence, exceptions, skips, time-zone behavior, editing semantics, and lifecycle while preserving the agreed fifteen-minute late-start window.
