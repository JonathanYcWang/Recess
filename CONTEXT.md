# Recess

Recess helps people sustain a declared period of work by adaptively alternating focused effort and earned recovery while controlling access to distracting sites and apps.

> This glossary defines the intended product language. It does not indicate which behavior is currently implemented.

## Work rhythm

**Work Session**:
A user-declared, continuous period of work. Its clock runs through every active phase and pauses only during a Time Out; completing the originally declared duration marks it complete even if the user later adds optional time.

**Focus Block**:
A Scheduler-defined interval of focused effort within a Work Session. It is an internal work-rhythm boundary rather than a timer the user starts or ends directly.

**Recess**:
An earned recovery interval after a completed Focus Block, except when the Work Session ends. Its duration is chosen by the Scheduler.

**Time Out**:
A user-initiated suspension of the active Focus Block and Work Session clock for a necessary interruption. Block List enforcement remains active unless the user obtains a Hall Pass.

**Focus Block Extension**:
The continuation of a completed Focus Block after the user declines its Recess prompt. The earned Recess is deferred while the Scheduler determines the next prompt.

**Work Session Extension**:
Optional time added after the originally declared Work Session duration is complete. It preserves the same Work Session history without changing its completed status.

**Wind-Down Signal**:
A multimodal cue that indicates a Focus Block or Recess is approaching its end.

**Back to Work Countdown**:
The transition interval between a Recess and the next Focus Block.

## Access and rewards

**Block List**:
The user-defined collection of websites and native applications whose access Recess controls. Entries are inaccessible during Focus Blocks and Time Outs unless an applicable pass permits access.

**Reward Game**:
A chance-based interaction between a completed Focus Block and its Recess. It selects one Block List entry to receive a Recess Pass.

**Recess Pass**:
Earned temporary access to exactly one Block List entry for the duration of a Recess.

**Hall Pass**:
Coin-funded, metered access to exactly one Block List entry during a Time Out. Charges accrue only while that destination is actively used.

## Tasks and planning

**Task**:
A user-defined unit of work with an original Time Estimate, accumulated Focused Time, and a status of To Do, In Progress, or Completed.

**Task List**:
The manually ordered collection of incomplete Tasks.

**Active Task**:
The one selected Task currently receiving Focused Time during a Focus Block.

**Time Estimate**:
The user’s original estimate of the focused-work duration needed to complete a Task.

**Focused Time**:
The time recorded while a Task is Active. Recess derives estimated remaining work from Focused Time and the original Time Estimate.

**Task Planner**:
The intended service that will automatically recommend and sequence Tasks within a Work Session.

## Motivation and progression

**Coin**:
Recess’s spendable currency. Coins are earned from focused time and Streak milestones and spent on Hall Passes, paid Reward Game rerolls, Pet mood boosts, and cosmetics.

**Pet**:
A virtual companion assigned once by the Personalization Quiz. Its moods and needs react to work habits but remain recoverable and never cause permanent loss or gameplay penalties.

**Focus Block Streak**:
The run of consecutive Focus Blocks completed within the current Work Session. Each Work Session starts a new Focus Block Streak.

**Work Session Streak**:
The run of enabled Work Start Reminders followed by a Work Session start within fifteen minutes after the reminder.

## Personalization

**Workstyle Profile**:
The evolving model of a user’s work preferences, friction patterns, and observed behavior. Quizzes seed it, while ongoing behavior and Recess Check-Ins refine it.

**Workstyle Signal**:
An adaptive dimension within the Workstyle Profile used to describe the user’s current working state.

**Energy**:
A Workstyle Signal describing the user’s current capacity for sustained focus and need for recovery.

**Momentum**:
A Workstyle Signal describing the user’s recent continuity and follow-through during work.

**Onboarding Quiz**:
The brief required narrative questionnaire that seeds initial Workstyle Profile defaults.

**Personalization Quiz**:
The optional deeper narrative assessment that enriches the Workstyle Profile and assigns the user’s Pet once.

**Recess Check-In**:
An optional feeling and energy response near the end of a Recess that updates the Workstyle Profile.

## History and analysis

**Work History**:
The factual record of Work Sessions, Focus Blocks, Recesses, Time Outs, Tasks, and their outcomes.

**Insights**:
Patterns and interpretations derived from Work History to help the user understand and improve how they work.

## Adaptive scheduling — TODO

**Scheduler**:
Definition pending a dedicated domain interview. Its known boundary is determining Focus Block and Recess durations from factors including Energy, Momentum, Work Session progress, the Workstyle Profile, and Task context; Task recommendation and sequencing belong to the Task Planner.

## Work start scheduling — TODO

**Work Start Reminder**:
Definition pending a dedicated domain interview. Its known boundary is a recurring prompt rather than a pre-created Work Session; a start within fifteen minutes after it advances the Work Session Streak.
