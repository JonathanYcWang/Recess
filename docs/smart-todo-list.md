# Smart To-Do List — Feature Requirements for Recess

## Product Goal

Create a low-friction task system that removes setup overhead and helps the user immediately begin meaningful work.

The system should:

- Automatically guide users into the next best task
- Reduce decision fatigue
- Restore context instantly between focus sessions
- Make task management feel lightweight instead of administrative
- Keep the user “in flow” during a work block

---

# Core Product Philosophy

The to-do list is not just a storage system for tasks.

It is:

- a session orchestration system
- a context restoration system
- a momentum engine

The user should feel:

> “I open Recess and it already knows what I should do next.”

---

# Core UX Principles

## 1. Zero Setup Momentum

The user should never need to:

- manually reopen tabs
- remember where they left off
- decide what to work on every session
- repeatedly re-prioritize tasks

The system should automate those actions.

---

## 2. Resumeability

Every task should preserve working context:

- links
- notes
- progress
- estimated remaining effort
- last active timestamp

A user returning later should instantly continue.

---

## 3. Lightweight Input

Creating tasks should be extremely fast.

Good:

- one-line quick add
- natural language estimates
- auto parsing

Bad:

- forms
- multiple required fields
- modal-heavy flows

---

# Core Entities

## Task

### Required Fields

- id
- description
- completed
- priorityOrder
- estimatedDurationMinutes
- createdAt
- updatedAt

### Optional Fields

- links[]
- notes
- tags[]
- remainingEstimateMinutes
- lastWorkedAt
- completionConfidence
- energyLevel
- recurringRule
- parentTaskId

---

## Link

Represents tabs/resources associated with a task.

### Fields

- id
- url
- title
- favicon
- autoOpenEnabled
- autoCloseEnabled

---

## Focus Session

Represents one dedicated working session.

### Fields

- id
- taskId
- startedAt
- endedAt
- plannedDuration
- actualDuration
- completedTask
- interruptionCount
- sessionOutcome

---

# Main UX Flow

## Starting a Work Block

User starts a work block:

- Example: 2 hours

System:

1. Calculates available focus sessions
2. Determines best sequence of tasks
3. Automatically prepares the first task
4. Opens associated links
5. Starts the first focus session

The user should ideally:

- click one button
- immediately begin work

---

# Task Card Requirements

## Layout

Vertical stack of narrow cards.

Each card contains:

- checkbox
- task title
- estimated time
- optional progress indicator
- quick-open link icons
- drag handle
- active/in-progress state

---

## Card States

### Idle

Normal task.

### Active

Current session task.
Should visually stand out strongly.

### Paused

Previously active but unfinished.

### Completed

Collapsed/faded with completion animation.

---

# Task Editing

## Click Behavior

Clicking a card opens inline editing.

Editable fields:

- description
- estimate
- links
- notes
- tags

Avoid full-page editing experiences.

---

# Quick Add Input

Located at bottom of list.

Should support:

- natural language parsing
- ultra-fast entry

Examples:

- “Finish onboarding doc 30m”
- “Reply to recruiter 10m”
- “Fix navbar bug 1h”

Potential parsing:

- duration
- tags
- dates
- urgency

---

# Smart Scheduling Algorithm

## Goal

Determine:

- what task should happen next
- what can realistically fit into the remaining work block

---

# Inputs

## Hard Signals

- task order (priority)
- estimated duration
- remaining work block time
- completion status

## Soft Signals

- recent momentum
- context switching cost
- task age
- overdue tasks
- user energy patterns
- historical completion reliability

---

# Scheduling Rules

## Example Rules

### 1. Respect Priority

Higher tasks are preferred.

### 2. Avoid Impossible Tasks

Do not start a 90-minute task with 20 minutes left.

### 3. Minimize Context Switching

Prefer continuing partially completed tasks.

### 4. Prefer Quick Wins Strategically

Sometimes recommend short tasks to maintain momentum.

### 5. Preserve Deep Work

Avoid interrupting large tasks unnecessarily.

---

# Suggested Scheduling Formula

Conceptually:

```text
Score = PriorityWeight
      + MomentumWeight
      + ContextWeight
      - TimeMismatchPenalty
      - SwitchingCost
```
