### Scheduler States Stored

- workSessionStartTime
- workSessionDuration
- workSessionElapsed
- currentPhase
- currentPhaseStartTime
- currentPhaseDuration
- currentPhaseElapsed
- timeOutStartTime

Naming convention:"duration" for declared lengths, "elapsed" for accumulated time, "start time" for timestamps. Time always stored in seconds

### Time tracking rules

#### Work Session start

```
workSessionStartTime = Date.now()
workSessionDuration = declaredGoal // e.g. 180 minutes
workSessionElapsed = 0
```

#### Focus Block start

```
currentPhase = 'FOCUS_BLOCK'
currentPhaseDuration = scheduledDuration // from SchedulerService
currentPhaseElapsed = 0
currentPhaseStartTime = Date.now()
timeOutStartTime = null
```

#### Focus Block ticking (UI only — never stored)

```
// currentPhaseStartTime = when this phase last started or resumed
// currentPhaseElapsed = time accumulated before the last resume (e.g. before a Time Out)
// Together they represent total time spent in this phase

const displayPhaseRemaining = currentPhaseDuration
  - currentPhaseElapsed
  - (Date.now() - currentPhaseStartTime)

const displaySessionElapsed = workSessionElapsed
  + (Date.now() - currentPhaseStartTime)

const displaySessionRemaining = workSessionDuration - displaySessionElapsed

```

#### Time Out starts (during Focus Block)

```
// Freeze how much of the Focus Block was completed
currentPhaseElapsed += Date.now() - currentPhaseStartTime

// Record when Time Out began
timeOutStartTime = Date.now()

// Switch phase
currentPhase = 'TIME_OUT'
currentPhaseStartTime = Date.now()
```

#### Time Out ends — Focus Block resumes

```
// Discard Time Out duration — does not count toward anything
timeOutStartTime = null

// Resume Focus Block from where it left off
currentPhase = 'FOCUS_BLOCK'
currentPhaseStartTime = Date.now()
// currentPhaseElapsed preserved — Focus Block picks up from here
// currentPhaseDuration unchanged
```

#### Focus Block completes

```
// Add Focus Block duration to Work Session elapsed
workSessionElapsed += currentPhaseDuration

// Clear current phase
currentPhaseElapsed = 0
currentPhaseStartTime = null
currentPhaseDuration = null
```

#### Recess starts

```
currentPhase = 'RECESS'
currentPhaseDuration = selectedVariantDuration  // from Reward Game outcome
currentPhaseElapsed = 0
currentPhaseStartTime = Date.now()
```

#### Recess ticking (UI only — never stored)

```
const displayPhaseRemaining = currentPhaseDuration
  - currentPhaseElapsed
  - (Date.now() - currentPhaseStartTime)

const displaySessionElapsed = workSessionElapsed
  + (Date.now() - currentPhaseStartTime)

const displaySessionRemaining = workSessionDuration - displaySessionElapsed
```

#### Recess completes

```
// Add Recess duration to Work Session elapsed
workSessionElapsed += currentPhaseDuration

// Clear current phase
currentPhaseElapsed = 0
currentPhaseStartTime = null
currentPhaseDuration = null
```

#### Reward Game and Back to Work Countdown

Duration for Reward Game set to a constant value of 1 min
Back to work countdown set to duration of 7 seconds

Same pattern as Recess — phase starts, duration tracked, elapsed added to workSessionElapsed on completion. Time Out cannot occur during these phases per the rules file.

#### Browser restart recovery

```
// Background worker wakes up cold
// Reads from storage:
currentPhase               // which phase was active
currentPhaseStartTime      // when it started
currentPhaseElapsed        // how much was already done
currentPhaseDuration       // how long it should last
workSessionElapsed         // how much Work Session time accumulated
timeOutStartTime           // null unless mid-Time Out

// If mid-Focus Block:
displayPhaseRemaining = currentPhaseDuration
  - currentPhaseElapsed
  - (Date.now() - currentPhaseStartTime)

// If mid-Time Out:
// Focus Block timer frozen at currentPhaseElapsed
// Time Out duration = Date.now() - timeOutStartTime
```
