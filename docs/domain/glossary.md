# Recess Ubiquitous Language Glossary

> This glossary defines the intended product model. It does not indicate which behavior is currently implemented; inspect the code and tests to determine current behavior.

The root `CONTEXT.md` is the compact source of canonical terms. This document expands those definitions with relationships and scenarios.

## Work rhythm

### Work Session

A user-declared, continuous period of work. Its clock runs during Focus Blocks, Reward Games, Recesses, and Back to Work Countdowns, and pauses only during a Time Out.

Goals accept fifteen minutes through eight hours in fifteen-minute steps and default to three hours. Completing the originally declared duration marks the Work Session complete. A later Work Session Extension retains its history without replacing that completion.

### Focus Block

A Scheduler-defined interval of focused effort within a Work Session. It is an internal work-rhythm boundary: the user sees a continuous Work Session timer and cannot directly end an individual Focus Block.

Ordinary Focus durations clamp to fifteen through sixty minutes. A Focus Block completes at its first Recess prompt. Declining that prompt continues the same block as a Focus Block Extension without stacking additional Recesses.

The final Focus Block consumes exact remaining Work Session time even when that is below fifteen minutes and creates no final Recess or Recess Pass.

### Recess

An earned recovery interval after a completed non-final Focus Block. The Scheduler determines its duration after the Reward Game resolves, clamping to five through twenty minutes and using actual remaining Work Session time.

A Recess may end early but cannot be extended. If the user completes the final Focus Block and ends the Work Session, no final Recess occurs.

### Time Out

A user-initiated suspension for a necessary interruption during a Focus Block, including a Focus Block Extension. It pauses both the Focus Block and Work Session clocks and ends only when the user manually resumes.

A Time Out is not a Recess: Block List enforcement continues, no Recess Pass is awarded, and access requires a Hall Pass. After ten elapsed minutes, Momentum lowers one qualitative state exactly once.

### Focus Block Extension

The continuation of a completed Focus Block after the user declines its Recess prompt. The earned Recess remains singular and deferred while the Scheduler reruns with current Profile, progress, Task, remaining-time, and game-budget inputs.

Extension time earns one Coin per two completed minutes, rounded down independently. Momentum and Focus Block Streak advance only at the first prompt, not at later extension prompts.

### Work Session Extension

Optional time added after the originally declared Work Session duration is complete. Each extension accepts fifteen through one hundred twenty minutes in fifteen-minute steps, and cumulative added time cannot exceed eight hours.

The original completion remains recorded, and the extension begins with a new Scheduler-decided Focus Block at the standard Coin rate while retaining the same Work Session context.

### Wind-Down Signal

A visual, audible, or otherwise accessible cue that begins exactly two minutes before a Focus Block or Recess ends when the phase has more than two minutes remaining.

### Back to Work Countdown

The ten-second transition between a Recess and the next Focus Block. Block List enforcement resumes when the countdown begins, and the next Focus Block starts automatically at zero. The countdown cannot be paused.

## Access and rewards

### Block List

The user-defined collection of websites whose access Recess controls. Every entry is eligible for selection by the Reward Game. Native-application blocking is unsupported in v1.

Entries are canonical hostnames: lowercase, without protocol, path, port, query, fragment, case difference, or trailing dot. Matching is exact hostname or subdomain; lookalikes such as `notexample.com` never match `example.com`.

During enforcement, matching normal tabs are closed. Recess remembers each closed URL occurrence and its multiplicity. When policy permits, remembered destinations reopen as inactive tabs. Window, group, active state, navigation stack, form state, scroll state, and private or incognito contexts are not recorded or restored.

### Reward Game

A chance-based interaction that selects one Block List entry before a Recess. It always produces a Recess Pass when the Block List is non-empty; there is no empty result.

Reward Game time consumes Work Session time but precedes the Recess timer. Games rotate Cards, then Wheel, then Slots, then repeat. An empty Block List skips the game and Recess Pass without consuming a rotation slot.

Each game type owns a fixed decision window and automatically resolves if the user does not choose in time. Cards uses a ten-second decision window with no reserved animation time. Wheel and Slots each use a five-second decision window and a maximum three-second animation. The durable outcome commits before presentation begins.

Each game provides three free rerolls. Further rerolls cost five Coins when the minimum Recess budget can still be preserved.

### Recess Pass

Earned temporary access to exactly one Block List entry for the duration of a Recess. It expires when the Back to Work Countdown begins.

### Hall Pass

Coin-funded access to exactly one Block List entry during a Time Out. Only one Hall Pass may be active, and approving a different destination replaces it.

The universal recurring rate is one Coin per completed active minute while the destination is foregrounded in the browser’s focused window. Access ends immediately when the user can no longer pay the next charge.

## Tasks and planning

### Task

A user-defined unit of work with an original Time Estimate, accumulated Focused Time, and a status of To Do, In Progress, or Completed. Tasks are optional during a Work Session.

A Task is created To Do with a required title and an original estimate from fifteen minutes through eight hours. Estimate choices use fifteen-minute steps through one hour and thirty-minute steps afterward. The original estimate cannot mutate after creation.

A Task becomes In Progress when it first becomes the Active Task. Completed Tasks leave the active Task List but remain represented in Work History.

### Task List

The manually ordered collection of incomplete Tasks. Its order is the user’s priority signal; Tasks do not carry a separate priority field.

### Active Task

The one selected Task currently receiving Focused Time. Several Tasks may be selected for a Focus Block, but only the Active Task accumulates time.

### Time Estimate

The user’s original estimate of the focused-work duration needed to complete a Task. It remains unchanged so Insights can compare estimated and actual effort.

### Focused Time

The time accumulated while a Task is Active during Focus Blocks and Focus Block Extensions. Time Out, Reward Game, Recess, countdown, and inactive periods do not count. Estimated remaining work is derived from the original Time Estimate and Focused Time rather than by mutating the estimate.

### Task Planner

The service that walks incomplete Tasks in manual priority order and proposes enough Tasks for a scheduled Focus Block. The proposal is advisory; the user confirms or edits the selected set. The Task Planner never chooses Focus Block or Recess duration.

## Motivation and progression

### Coin

Recess’s spendable currency. Standard Focus time earns one Coin per completed minute. Focus Block Extension time earns one Coin per two completed minutes, with each phase rounded down independently.

Every qualifying Work Session Streak advancement and every Focus Block Streak milestone at multiples of three awards ten Coins. Coins fund Hall Passes, paid Reward Game rerolls, Pet mood boosts, and cosmetics.

### Pet

A virtual companion assigned once by the Personalization Quiz. Later Workstyle Profile changes do not replace it.

Its moods and needs react to work habits but remain recoverable. It cannot die, disappear, permanently lose progress, or impose gameplay penalties. Eight canonical moods exist: Calm, Focused, Curious, Happy, Restless, Hungry, Sleepy, and Sad.

### Focus Block Streak

The run of consecutive Focus Blocks completed within the current Work Session. It begins fresh with each Work Session and advances once at each block’s first Recess prompt. Counts of three, six, nine, and subsequent multiples award ten Coins.

### Work Session Streak

The run of enabled Work Start Reminders followed by a Work Session start within fifteen minutes after the reminder. Every qualifying advancement awards ten Coins. Missing a reminder or starting more than fifteen minutes late resets it; periods without an enabled reminder are neutral.

## Personalization

### Workstyle Profile

The evolving model of a user’s work preferences, friction patterns, and observed behavior. It begins from quiz answers and changes through behavior and feedback rather than assigning a permanent personality type.

It owns preferred cadence; Energy Low, Steady, or High; Momentum Low, Steady, Building, or Flowing; and six friction dimensions: Emotional Load, Motivation, Organization, Distraction, Starting, and Fatigue.

### Workstyle Signal

An adaptive dimension within the Workstyle Profile. Recess uses product-specific signals instead of MBTI.

### Energy

A Workstyle Signal representing current capacity for sustained focus and need for recovery. Users see qualitative states rather than an exact score.

### Momentum

A Workstyle Signal representing recent continuity and follow-through during work. Users see qualitative states rather than an exact score.

### Onboarding Quiz

The brief required questionnaire that collects current Energy, one approved preferred cadence of 15/5, 25/5, or 45/10, and one primary friction. It seeds adaptive defaults without assigning a Pet.

### Personalization Quiz

The optional deeper assessment that enriches the Workstyle Profile and assigns the user’s Pet once. After six screening questions, it stops when second-place friction leads third place by at least three points and returns the unordered top-two pair; otherwise it asks up to six deterministic tie-breakers. After twelve questions, a smaller second-to-third lead returns Balanced.

### Recess Check-In

An optional feeling and energy response near the end of a Recess. Its answer refines the Workstyle Profile; dismissing it is neutral.

## History and analysis

### Work History

The factual record of Work Sessions, Focus Blocks, Recesses, Time Outs, Tasks, and their outcomes. Facts are immutable and append-only.

### Insights

Patterns and interpretations derived from Work History. Insights explain past work and help the user make better future choices without rewriting the underlying facts.

Session and task families select the latest five or latest thirty resolved Work Sessions, or all time. Reminder adherence selects the latest five or latest thirty resolved non-neutral Reminder occurrences, or all time. Projections distinguish no relevant data, insufficient data, explicit zero, and calculated result.

## Adaptive scheduling

### Scheduler

The pure decision service that turns preferred cadence, Energy, Momentum, Work Session progress, selected Task remaining work, exact remaining time, and Reward Game budget into deterministic Focus and Recess durations plus named reason codes.

It begins from preferred cadence with 25/5 as the default and applies the approved Energy, Momentum, and two-thirds-progress modifiers in order. Ordinary Focus clamps to fifteen through sixty minutes and Recess to five through twenty minutes. An eligible selected-Task total caps proposed Focus.

If remaining time cannot contain the chosen game decision window, maximum animation, and five-minute Recess, the current Focus is final. A final Focus consumes exact remaining Work Session time; post-game Recess uses actual remaining time.

## Work start scheduling

### Work Start Reminder

A weekly local-wall-time schedule that follows the device time zone and daylight-saving changes. Each schedule has a stable identity, local clock time, selected weekdays, and enabled state.

Skip next marks the currently planned next logical occurrence neutral without changing the Work Session Streak. Same-day edits can create, retain, or resolve an active occurrence depending on the new time relative to the inclusive fifteen-minute qualification window.

A Work Session start at or after the scheduled instant and at or before fifteen minutes later satisfies the eligible logical occurrence inclusively. Notification delivery, failure, dismissal, and click path have no effect on success or miss determination.

Duplicate alarms and restart recovery are implementation invariants: each logical occurrence resolves once, and alarm identities map durably to occurrence identities.
