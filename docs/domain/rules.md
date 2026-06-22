# Recess Domain Rules

> These rules describe the intended product model, not necessarily current implementation. Inspect the code and tests before treating any rule as implemented behavior.

## Work Session lifecycle

- The Work Session clock runs during Focus Blocks, Reward Games, Recesses, and Back to Work Countdowns. It pauses only during a Time Out.
- Work Session goals accept fifteen minutes through eight hours in fifteen-minute steps and default to three hours.
- Starting a Work Session requires Energy Low, Steady, or High and initializes Momentum to Steady for that session.
- The Scheduler sizes the final Focus Block to consume all remaining Work Session time, even when that requires a shorter-than-normal block.
- Completing the final Focus Block completes the Work Session without a final Recess or Recess Pass.
- Completing the originally declared duration permanently marks the Work Session complete.
- A Work Session Extension preserves the same history, starts a new Scheduler-decided Focus Block immediately, and earns Coins at the standard new-block rate.
- Each extension accepts fifteen through one hundred twenty minutes in fifteen-minute steps; cumulative added time cannot exceed eight hours.
- Added time is optional. Ending during a Work Session Extension never reverses original completion.
- Ending before the original goal records an incomplete Work Session and an incomplete partial Focus Block. The partial block still earns duration-based Coins.

## Focus and recovery

- A user cannot directly end a Focus Block. They may start a Time Out or end the entire Work Session.
- Ordinary Focus durations clamp to fifteen through sixty minutes. Recess durations clamp to five through twenty minutes.
- The Scheduler begins from preferred cadence with 25/5 as the default and applies Energy, Momentum, and two-thirds-progress modifiers in order.
- An eligible selected-Task total caps proposed Focus duration.
- If remaining time cannot contain the chosen game decision window, maximum animation, and five-minute Recess, the current Focus is final.
- A Focus Block completes at its first Recess prompt.
- Declining the prompt creates a Focus Block Extension and defers one earned Recess. Recesses and Recess Passes never stack.
- Focus Block Extension time earns one Coin per two completed minutes, rounded down independently; it does not receive a separate extension bonus.
- When the user eventually accepts a Recess prompt, one adjusted Recess follows.
- A Recess may end early but cannot be extended.
- Ending a Recess early immediately begins the Back to Work Countdown.
- The Wind-Down Signal begins exactly two minutes before a Focus Block or Recess ends when the phase has more than two minutes remaining.
- The Back to Work Countdown lasts ten seconds, cannot be paused, and starts the next Focus Block automatically.

## Reward Game and Recess Pass

- Every completed non-final Focus Block that proceeds to Recess receives exactly one Recess Pass when the Block List is non-empty.
- An empty Block List skips Reward Game and Recess Pass without consuming a rotation slot, then continues to Scheduler-finalized Recess.
- The Reward Game occurs before Recess. Its time consumes Work Session time but not Recess time.
- Games rotate Cards, then Wheel, then Slots, then repeat across Work Sessions and worker restarts.
- The Reward Game always selects exactly one Block List entry when entries exist; it has no empty outcome.
- Cards uses a ten-second decision window with no reserved animation time. Wheel and Slots each use a five-second decision window and a maximum three-second animation.
- The durable outcome commits before presentation begins. Reduced motion does not change candidates, deadlines, or outcomes.
- Each game provides three free rerolls. Further rerolls cost five Coins when the minimum Recess budget can still be preserved.
- If the decision window expires, the game automatically selects an available result and proceeds.
- The Scheduler finalizes Recess duration after the Reward Game resolves, using actual remaining Work Session time.
- The Recess Pass remains valid for the Recess and expires when the Back to Work Countdown begins.

## Block List enforcement

- Block List entries are browser websites. Native-application blocking is explicitly unsupported in v1.
- Every Block List entry is eligible for selection by the Reward Game.
- Entries are canonical hostnames: lowercase, without protocol, path, port, query, fragment, case difference, or trailing dot.
- Matching is exact hostname or subdomain; lookalikes such as `notexample.com` never match `example.com`.
- Block List enforcement remains active during Focus Blocks, Reward Games, Back to Work Countdowns, and Time Outs without a Hall Pass.
- During enforcement, matching normal tabs are closed. Recess remembers each closed URL occurrence and its multiplicity.
- When policy permits, remembered destinations reopen as inactive tabs. Window, group, active state, navigation stack, form state, scroll state, and private or incognito contexts are not recorded or restored.
- Granting a Recess Pass or Hall Pass restores only remembered occurrences for that destination. Removing an entry or ending the Work Session restores every remembered occurrence that is now allowed.
- Pass expiry, Back to Work Countdown, and Time Out resume re-close matching open tabs when policy again blocks them.
- Private or incognito contexts and unsupported destination kinds return explicit excluded or capability outcomes.

## Time Out and Hall Pass

- A Time Out may begin only during a Focus Block, including a Focus Block Extension.
- It suspends the active Focus Block and Work Session clocks and ends only when the user manually resumes.
- Every five minutes, the system reports elapsed Time Out duration and may show contextual return incentives.
- At ten elapsed minutes, Momentum lowers one qualitative state exactly once.
- Attempting to use a Block List entry presents the one-Coin-per-completed-active-minute rate and asks for confirmation before issuing a Hall Pass.
- Confirmation requires at least one Coin but creates no upfront debit.
- Only one Hall Pass may be active. Confirming another destination replaces the current pass.
- Charges accrue only while the Hall Pass destination is actively foregrounded in the browser’s focused window.
- If the user cannot pay the next recurring charge, access is revoked immediately while the Time Out remains active.

## Tasks

- Task use is optional. Users may select or change Tasks at any time during a Work Session.
- Several Tasks may be selected for a Focus Block, but only one Active Task receives Focused Time.
- A Task becomes In Progress when it first becomes Active and begins receiving Focused Time.
- When a Focus Block ends, its Task selection resets. Incomplete Tasks remain on the Task List for later selection.
- The Task List is manually ordered and has no separate priority property.
- The original Time Estimate is preserved, Focused Time is recorded separately, and estimated remaining work is derived from both.
- Standard Focus and Focus Block Extension seconds count toward Focused Time; Time Out, Reward Game, Recess, countdown, and inactive periods do not.
- Completing a Task removes it from the active Task List while retaining it in Work History.
- The Task Planner walks incomplete Tasks in manual order and proposes enough Tasks for a scheduled Focus Block. The proposal is advisory; the user confirms or edits the selected set.
- The Task Planner never chooses Focus Block or Recess duration.

## Coins and progression

- Standard Focus time earns one Coin per completed minute.
- Focus Block Extension time earns one Coin per two completed minutes, rounded down independently; it does not receive a separate extension bonus.
- A new Focus Block created by a Work Session Extension earns at the standard rate even without an intervening Recess.
- Every qualifying Work Session Streak advancement awards ten Coins.
- Focus Block Streak milestones at counts of three, six, nine, and subsequent multiples award ten Coins.
- The Focus Block Streak counts completed Focus Blocks within one Work Session and resets when a new Work Session starts. It advances once at each block’s first Recess prompt.
- The Work Session Streak advances when a Work Session starts within fifteen minutes after an enabled Work Start Reminder occurrence.
- Missing a reminder or starting more than fifteen minutes late resets the Work Session Streak. Periods without reminders are neutral.
- Paid Reward Game rerolls cost five Coins. Pet mood boosts cost ten Coins.
- XP and Levels are not part of the intended model.

## Pet and personalization

- The Onboarding Quiz is brief and required. It collects Energy, one approved cadence, and one primary friction without assigning a Pet.
- The Personalization Quiz is deeper and optional. It enriches the same profile and assigns the Pet once.
- Later profile changes never replace the assigned Pet.
- Eight canonical moods exist: Calm, Focused, Curious, Happy, Restless, Hungry, Sleepy, and Sad.
- Restless triggers at ten minutes in Time Out and recovers to Happy on resume or Focus start.
- Hungry triggers every third completed Focus Block and recovers to Happy on a later completed Focus Block.
- Sleepy triggers from a Low-Energy Recess Check-In and recovers to Happy on a later completed Recess.
- Sad triggers from an incomplete Work Session or missed Reminder and recovers to Happy on a later completed Work Session.
- A new trigger at the current boundary wins; otherwise recovery applies. Happy becomes Calm at the next trigger-free lifecycle boundary.
- Pet mood changes never alter Coins, rewards, Scheduler decisions, Block List access, Task behavior, Pet identity, or permanent progress.
- Coins may buy Pet mood boosts and cosmetics; basic wellbeing is not contingent on spending.
- The Workstyle Profile evolves from Recess-specific Workstyle Signals rather than MBTI.
- Energy and Momentum are shown to users as qualitative states.
- A Recess Check-In is optional. Answering it updates the Workstyle Profile; dismissing it is neutral.

## Work Start Reminder and Work Session Streak

- A Work Start Reminder is a weekly local-wall-time schedule that follows the device time zone and daylight-saving changes.
- Each schedule has a stable identity, local clock time, selected weekdays, and enabled state.
- Skip next marks the currently planned next logical occurrence neutral without changing the Work Session Streak.
- Editing today’s enabled schedule to a time within the preceding inclusive fifteen-minute window creates or retains an active occurrence eligible for a Work Session start.
- Editing to more than fifteen minutes in the past resolves the occurrence missed. Disabling or deleting today’s schedule resolves its planned or active occurrence neutral.
- A Work Session start at or after the scheduled instant and at or before fifteen minutes later satisfies the eligible logical occurrence inclusively.
- Occurrences with overlapping inclusive eligibility windows coalesce into one logical outcome window and one Streak consequence.
- Notification delivery, failure, dismissal, and click path have no effect on success or miss determination.
- Work Session Streak advancement and reset rules use reminder occurrences rather than pre-created sessions.
- Every qualifying advancement awards ten Coins. There is no milestone-only exception.
- Duplicate alarms and restart recovery are implementation invariants without inventing new product behavior.

## Work History and Insights

- Work History preserves factual Work Session, Focus Block, Recess, Time Out, Task, and outcome records. Facts are immutable and append-only.
- Insights derive interpretations from Work History without altering its factual records.
- Session and task families select the latest five or latest thirty resolved Work Sessions, or all time.
- Reminder adherence selects the latest five or latest thirty resolved non-neutral Reminder occurrences, or all time.
- A Task completed in a selected window contributes its full-lifetime original estimate and Focused Time facts.
- Projections distinguish no relevant data, insufficient data, explicit zero, and calculated result.
- Every Insight result carries a stable formula identifier, human-readable explanation inputs, and underlying fact identities.
- Preserving both Time Estimate and Focused Time enables estimate-versus-actual Insights.
- The Scheduler owns adaptive timing; the Task Planner owns Task recommendation and sequencing.
