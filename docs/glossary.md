# Recess Ubiquitous Language Glossary

### Window

A fixed five-minute interval. The base unit all durations are built from.

### Phase

A scheduler-defined duration within a Session, typed by how the user's time is
meant to be used. The types are Focus, Recess, Pause, and Reward Selection
Phase.

### Session

A user-declared continuous period composed of multiple Phases. The declared
duration must be a multiple of five minutes. The timer runs during Focus and
Recess, and stops during Pause and Reward Selection Phase. A Session completes
either by reaching its declared duration or by the user ending it early.

### Focus

A Phase type for focused effort. The Blocked List is enforced throughout. Focus
transitions to Reward Selection Phase if Session time remains. If no time
remains after the next projected Recess, the Session ends on the Finished
Page.

### Reward Selection Phase

A Phase type where the user plays a game of chance to determine which Blocked
List entry is unblocked, and for how long. With no blocked sites, the user plays
for duration alone. Coins may be spent to re-roll.

### Recess

A Phase type for earned rest, entered on completing a Focus. The Scheduler
determines its duration, clamped to five through twenty minutes. The user may
end it early. No Recess occurs if no Session time remains. The rewarded entry is
whitelisted during the Recess; no other sites are accessible.

### Pause

A Phase type for a user-initiated interruption during a Focus. It stops the
Focus and Session clocks and ends only when the user resumes. Blocked List
enforcement continues. A pause timer shows how long the pause lasted. Coins may
be spent to unblock sites.

### Finished Page

Screen shown to signify the end of the Session.

### Upcoming Notice

A cue that appears near the end of a Focus or Recess. Currently a notification;
may expand.

### Blocked List

The user-defined collection of sites whose access Recess controls. Every entry is
eligible for selection by the Reward Selection Phase. Users may add and remove
entries when no Session is active, and add entries at any point during one.

Entries are canonical hostnames: lowercase, no protocol, path, port, query,
fragment, or trailing dot. Matching is exact hostname or subdomain — lookalikes
such as `notexample.com` never match `example.com`.

At the start of a Phase, sites on the Blocked List are remembered and automatically closed. Once permitted again, each URL closed at Phase start reopens in a new tab.

During a Focus Phase, visiting a blocked site closes it automatically.
During a Pause, Reward Selection Phase, or Recess Phase, visiting a blocked site
shows an overlay offering to spend Coins to unblock it for an interval, or to
close the site. This is limited per Session.

### Coin

Recess's spendable currency. Standard Focus time earns one Coin per completed
Window.

Coins pay for Reward Selection Phase re-rolls, site unblocks, and Pet experience
enhancements. A user with no Coins simply cannot buy these; the cost never
blocks the Session.

### Pet

A virtual companion whose moods and needs react to work habits but remain
recoverable. It cannot die, disappear, permanently lose progress, or impose
gameplay penalties.

Seven canonical moods: Calm, Focused, Happy, Restless, Hungry, Sleepy, Sad.
User interactions are not yet defined.

### Focus Streak

The run of consecutive Focus Phases completed within a Session without a Pause.
It begins fresh with each Session and advances as each Phase completes. Every
advancement awards bonus Coins.

### Session Streak

The run of enabled Start Reminders followed by a Session start within fifteen
minutes of the reminder. Every qualifying advancement awards Coins. Missing a
reminder or starting more than fifteen minutes late resets it; periods without an
enabled reminder are neutral.

### Check-In

An optional feeling multiple-choice response at the end of Phases, informing the
Scheduler. Dismissing it is neutral.

### Session Timeline

The factual record of all events during a Session. Facts are immutable and
append-only.

### Scheduler

A pure decision service turning current user context into the determined duration
of the next Phase. The scheduling algorithm is evolving; see `docs/architecture.md`
for current behavior.

### Start Reminder

A weekly local-wall-time schedule for when to work, following the device time
zone and daylight-saving changes. Alarms repeat weekly at the chosen start time.
