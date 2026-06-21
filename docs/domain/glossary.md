# Recess Ubiquitous Language Glossary

> This glossary defines the intended product model. It does not indicate which behavior is currently implemented; inspect the code and tests to determine current behavior.

The root `CONTEXT.md` is the compact source of canonical terms. This document expands those definitions with relationships and scenarios.

## Work rhythm

### Work Session

A user-declared, continuous period of work. Its clock runs during Focus Blocks, Reward Games, Recesses, and Back to Work Countdowns, and pauses only during a Time Out.

Completing the originally declared duration marks the Work Session complete. A later Work Session Extension retains its history without replacing that completion.

### Focus Block

A Scheduler-defined interval of focused effort within a Work Session. It is an internal work-rhythm boundary: the user sees a continuous Work Session timer and cannot directly end an individual Focus Block.

A Focus Block completes at its first Recess prompt. Declining that prompt continues the same block as a Focus Block Extension without stacking additional Recesses.

### Recess

An earned recovery interval after a completed non-final Focus Block. The Scheduler determines its duration after the Reward Game resolves.

A Recess may end early but cannot be extended. If the user completes the final Focus Block and ends the Work Session, no final Recess occurs.

### Time Out

A user-initiated suspension for a necessary interruption during a Focus Block. It pauses both the Focus Block and Work Session clocks and ends only when the user manually resumes.

A Time Out is not a Recess: Block List enforcement continues, no Recess Pass is awarded, and access requires a Hall Pass.

### Focus Block Extension

The continuation of a completed Focus Block after the user declines its Recess prompt. The earned Recess remains singular and deferred while the Scheduler determines the next prompt.

### Work Session Extension

Optional time added after the originally declared Work Session duration is complete. The original completion remains recorded, and the extension begins with a new Focus Block while retaining the same Work Session context.

### Wind-Down Signal

A visual, audible, or otherwise accessible cue that begins two minutes before a Focus Block or Recess ends.

### Back to Work Countdown

The ten-second transition between a Recess and the next Focus Block. Block List enforcement resumes when the countdown begins, and the next Focus Block starts automatically at zero.

## Access and rewards

### Block List

The user-defined collection of websites and, in the intended product, native applications whose access Recess controls. Every entry is eligible for selection by the Reward Game.

Enforcement prevents access while preserving tab or application state whenever the platform allows. It does not intentionally destroy and reconstruct the user’s context.

### Reward Game

A chance-based interaction that selects one Block List entry before a Recess. It always produces a Recess Pass; there is no empty result.

Reward Game time consumes Work Session time but precedes the Recess timer. Each game type owns a fixed decision window and automatically resolves if the user does not choose in time.

### Recess Pass

Earned temporary access to exactly one Block List entry for the duration of a Recess. It expires when the Back to Work Countdown begins.

### Hall Pass

Coin-funded access to exactly one Block List entry during a Time Out. Only one Hall Pass may be active, and approving a different destination replaces it.

The universal recurring rate accrues only while the destination is actively used. Access ends immediately when the user can no longer pay the next charge.

## Tasks and planning

### Task

A user-defined unit of work with an original Time Estimate, accumulated Focused Time, and a status of To Do, In Progress, or Completed. Tasks are optional during a Work Session.

A Task becomes In Progress when it first becomes the Active Task. Completed Tasks leave the active Task List but remain represented in Work History.

### Task List

The manually ordered collection of incomplete Tasks. Its order is the user’s priority signal; Tasks do not carry a separate priority field.

### Active Task

The one selected Task currently receiving Focused Time. Several Tasks may be selected for a Focus Block, but only the Active Task accumulates time.

### Time Estimate

The user’s original estimate of the focused-work duration needed to complete a Task. It remains unchanged so Insights can compare estimated and actual effort.

### Focused Time

The time accumulated while a Task is Active during Focus Blocks. Estimated remaining work is derived from the original Time Estimate and Focused Time rather than by mutating the estimate.

### Task Planner

The intended service that recommends and sequences Tasks within a Work Session. It owns Task planning; the Scheduler owns adaptive timing.

## Motivation and progression

### Coin

Recess’s spendable currency. Focused duration earns Coins, while Focus Block Extension time earns them at a reduced rate. Streak milestones provide additional awards.

Coins fund Hall Passes, rerolls beyond the three free rerolls in a Reward Game, Pet mood boosts, and cosmetics.

### Pet

A virtual companion assigned once by the Personalization Quiz. Later Workstyle Profile changes do not replace it.

Its moods and needs react to work habits but remain recoverable. It cannot die, disappear, permanently lose progress, or impose gameplay penalties.

### Focus Block Streak

The run of consecutive Focus Blocks completed within the current Work Session. It begins fresh with each Work Session and advances at each first Recess prompt.

### Work Session Streak

The run of enabled Work Start Reminders followed by a Work Session start within fifteen minutes after the reminder. Missing a reminder or starting later resets it; periods without an enabled reminder are neutral.

## Personalization

### Workstyle Profile

The evolving model of a user’s work preferences, friction patterns, and observed behavior. It begins from quiz answers and changes through behavior and feedback rather than assigning a permanent personality type.

### Workstyle Signal

An adaptive dimension within the Workstyle Profile. Recess uses product-specific signals instead of MBTI.

### Energy

A Workstyle Signal representing current capacity for sustained focus and need for recovery. Users see qualitative states rather than an exact score.

### Momentum

A Workstyle Signal representing recent continuity and follow-through during work. Users see qualitative states rather than an exact score.

### Onboarding Quiz

The brief required narrative questionnaire that seeds adaptive defaults in the Workstyle Profile.

### Personalization Quiz

The optional deeper narrative assessment that enriches the Workstyle Profile and assigns the user’s Pet once.

### Recess Check-In

An optional feeling and energy response near the end of a Recess. Its answer refines the Workstyle Profile; dismissing it is neutral.

## History and analysis

### Work History

The factual record of Work Sessions, Focus Blocks, Recesses, Time Outs, Tasks, and their outcomes.

### Insights

Patterns and interpretations derived from Work History. Insights explain past work and help the user make better future choices without rewriting the underlying facts.

## Adaptive scheduling — TODO

### Scheduler

A dedicated domain interview must resolve its inputs, constraints, adaptation, and feedback rules. Its known boundary is adaptive Focus Block and Recess timing using Energy, Momentum, Work Session progress, Workstyle Profile data, and Task context.

## Work start scheduling — TODO

### Work Start Reminder

A dedicated domain interview must resolve recurrence, exceptions, time zones, and lifecycle. Its known boundary is a recurring prompt rather than a pre-created Work Session, with a fifteen-minute late-start window for the Work Session Streak.
