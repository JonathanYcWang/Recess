Here is exasctly how I want the logic for the countdown timers to work.

Currently we are using:
totalWorkSessionRemaining, initialFocusTime and initialBreakTime.

Rename the three to:
workSessionDurationRemaining - this value starts as initialWorkSessionDuration and will be reduced over time with the logic detailed below.
initialFocusSessionDuration - this value is the default value of DEFAULT_FOCUS_TIME
initialBreakSessionDuration - this value is the default value of DEFAULT_BREAK_TIME


I would like to add 3 variables. 
initialWorkSessionDuration - this value is the default value of DEFAULT_TOTAL_WORK_DURATION
focusSessionDurationRemaining - this value starts as the initialFocusSessionDuration and will be reduced over time with the logic detailed below. 
breakSessionDurationRemaining - this value starts as the initialBreakSessionDuration and will be reduced over time with the logic detailed below. 


Then I would like add back timestamps but use it in a specifc way.
Throughout, nothing outside of the hook will ever interact with the timestamps. They will always be dealing with focusSessionDurationRemaining, breakSessionDurationRemaining, and workSessionDurationRemaining.

For focus sessions:
focusSessionEntryTimeStamp - this value is set to the time stamp whenever entering the DURING_SESSION state each time (not only when a new focus session starts, please add a comment clarifiying this). This can either be from the BEFORE_SESSION, PAUSED, or BACK_TO_IT state.
currentTimeStamp - this is the current timestamp of the system.
focusSessionDurationRemaining = initialFocusSessionDuration - (currentTimeStamp - focusSessionEntryTimeStamp) this will always be up to date.
    
Once the focusSessionDurationRemaining is less than or equal to 0, consider that focus session to be completed and enter the REWARD_SELECTION state.
Or if the user decides to end the focus session early.
    Then reduce workSessionDurationRemaining value by completedFocusSessionDuration = initialFocusSessionDuration - focusSessionDurationRemaining.
If the workSessionDurationRemaining value is less than or equal to 0, then set workSessionDurationRemaining to 0 and consider that work session to be completed and enter the SESSION_COMPLETE state


For break sessions:
breakSessionEntryTimeStamp - this value is set to the time stamp when the session enters the BREAK state.
currentTimeStamp - this is the current timestamp of the system.
breakSessionDurationRemaining = initialBreakSessionDuration - (currentTimeStamp - breakSessionEntryTimeStamp) this will always be up to date.
Once the breakSessionDurationRemaining is less than or equal to 0, consider that break session to be completed and enter the BACK_TO_IT state.
