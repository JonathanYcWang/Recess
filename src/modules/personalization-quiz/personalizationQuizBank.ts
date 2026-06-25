import type { FrictionDimension } from '@/modules/workstyle-profile';
import {
  frictionScoreEffects,
  PERSONALIZATION_QUIZ_BANK_VERSION,
  type PersonalizationQuizBank,
  type PersonalizationQuizScenario,
} from './personalizationQuizTypes';

const pair = (
  a: FrictionDimension,
  b: FrictionDimension
): readonly [FrictionDimension, FrictionDimension] => (a < b ? [a, b] : [b, a]);

const screeningScenarios: PersonalizationQuizScenario[] = [
  {
    id: 'psq-screen-01',
    kind: 'screening',
    text: 'When you first sit down to work, what usually happens?',
    options: [
      {
        id: 'psq-screen-01-a',
        text: 'I feel tense or weighed down before I even begin.',
        scoringEffects: frictionScoreEffects({ 'emotional-load': 2, starting: 1 }),
      },
      {
        id: 'psq-screen-01-b',
        text: 'I delay because nothing about the task feels engaging yet.',
        scoringEffects: frictionScoreEffects({ motivation: 2, starting: 1 }),
      },
      {
        id: 'psq-screen-01-c',
        text: 'I stall while trying to figure out where to begin.',
        scoringEffects: frictionScoreEffects({ organization: 2, starting: 1 }),
      },
      {
        id: 'psq-screen-01-d',
        text: 'I open the work, then quickly drift to something easier.',
        scoringEffects: frictionScoreEffects({ distraction: 2, starting: 1 }),
      },
    ],
  },
  {
    id: 'psq-screen-02',
    kind: 'screening',
    text: 'Partway through a focus block, what most often pulls you off track?',
    options: [
      {
        id: 'psq-screen-02-a',
        text: 'Worry or pressure builds and makes the work feel heavier.',
        scoringEffects: frictionScoreEffects({ 'emotional-load': 2, fatigue: 1 }),
      },
      {
        id: 'psq-screen-02-b',
        text: 'The task stops feeling worth the effort.',
        scoringEffects: frictionScoreEffects({ motivation: 2, fatigue: 1 }),
      },
      {
        id: 'psq-screen-02-c',
        text: 'I realize the next step is unclear or the plan fell apart.',
        scoringEffects: frictionScoreEffects({ organization: 2, distraction: 1 }),
      },
      {
        id: 'psq-screen-02-d',
        text: 'Notifications, tabs, or nearby activity catch my attention.',
        scoringEffects: frictionScoreEffects({ distraction: 2, organization: 1 }),
      },
    ],
  },
  {
    id: 'psq-screen-03',
    kind: 'screening',
    text: 'When a task feels large or unclear, what is your typical reaction?',
    options: [
      {
        id: 'psq-screen-03-a',
        text: 'I feel overwhelmed and need to settle myself first.',
        scoringEffects: frictionScoreEffects({ 'emotional-load': 2, organization: 1 }),
      },
      {
        id: 'psq-screen-03-b',
        text: 'I put it off because I cannot see why it matters yet.',
        scoringEffects: frictionScoreEffects({ motivation: 2, starting: 1 }),
      },
      {
        id: 'psq-screen-03-c',
        text: 'I break it apart, list steps, or reorganize before acting.',
        scoringEffects: frictionScoreEffects({ organization: 2, starting: 1 }),
      },
      {
        id: 'psq-screen-03-d',
        text: 'I switch to smaller tasks that feel easier to finish.',
        scoringEffects: frictionScoreEffects({ distraction: 2, motivation: 1 }),
      },
    ],
  },
  {
    id: 'psq-screen-04',
    kind: 'screening',
    text: 'Near the end of a long work session, what makes it hardest to keep going?',
    options: [
      {
        id: 'psq-screen-04-a',
        text: 'Stress or frustration spikes when things drag on.',
        scoringEffects: frictionScoreEffects({ 'emotional-load': 2, fatigue: 1 }),
      },
      {
        id: 'psq-screen-04-b',
        text: 'The remaining work feels pointless or unrewarding.',
        scoringEffects: frictionScoreEffects({ motivation: 2, fatigue: 1 }),
      },
      {
        id: 'psq-screen-04-c',
        text: 'Loose ends pile up and I lose track of priorities.',
        scoringEffects: frictionScoreEffects({ organization: 2, fatigue: 1 }),
      },
      {
        id: 'psq-screen-04-d',
        text: 'My mind and body feel drained and slow.',
        scoringEffects: frictionScoreEffects({ fatigue: 2, 'emotional-load': 1 }),
      },
    ],
  },
  {
    id: 'psq-screen-05',
    kind: 'screening',
    text: 'When several tasks are waiting, what slows you down most?',
    options: [
      {
        id: 'psq-screen-05-a',
        text: 'I feel anxious about choosing wrong or falling behind.',
        scoringEffects: frictionScoreEffects({ 'emotional-load': 2, organization: 1 }),
      },
      {
        id: 'psq-screen-05-b',
        text: 'None of them feel interesting enough to start.',
        scoringEffects: frictionScoreEffects({ motivation: 2, starting: 1 }),
      },
      {
        id: 'psq-screen-05-c',
        text: 'I spend time sorting, comparing, or reprioritizing.',
        scoringEffects: frictionScoreEffects({ organization: 2, distraction: 1 }),
      },
      {
        id: 'psq-screen-05-d',
        text: 'I bounce between tasks without finishing any of them.',
        scoringEffects: frictionScoreEffects({ distraction: 2, starting: 1 }),
      },
    ],
  },
  {
    id: 'psq-screen-06',
    kind: 'screening',
    text: 'After a break, what makes it hardest to settle back in?',
    options: [
      {
        id: 'psq-screen-06-a',
        text: 'I carry stress from earlier and dread returning.',
        scoringEffects: frictionScoreEffects({ 'emotional-load': 2, starting: 1 }),
      },
      {
        id: 'psq-screen-06-b',
        text: 'The next block does not feel motivating enough to restart.',
        scoringEffects: frictionScoreEffects({ motivation: 2, starting: 1 }),
      },
      {
        id: 'psq-screen-06-c',
        text: 'I need to rebuild my plan before I can continue.',
        scoringEffects: frictionScoreEffects({ organization: 2, starting: 1 }),
      },
      {
        id: 'psq-screen-06-d',
        text: 'I keep checking messages or feeds instead of reopening work.',
        scoringEffects: frictionScoreEffects({ distraction: 2, starting: 1 }),
      },
    ],
  },
];

const tieBreakerScenarios: PersonalizationQuizScenario[] = [
  {
    id: 'psq-tie-01',
    kind: 'tie-breaker',
    disambiguates: pair('emotional-load', 'motivation'),
    text: 'Which feels more familiar on a hard day?',
    options: [
      {
        id: 'psq-tie-01-a',
        text: 'The work itself feels emotionally heavy, even when it matters.',
        scoringEffects: frictionScoreEffects({ 'emotional-load': 2 }),
      },
      {
        id: 'psq-tie-01-b',
        text: 'The work feels flat or uninteresting, even when it is manageable.',
        scoringEffects: frictionScoreEffects({ motivation: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-02',
    kind: 'tie-breaker',
    disambiguates: pair('emotional-load', 'organization'),
    text: 'When progress stalls, which is closer to the truth?',
    options: [
      {
        id: 'psq-tie-02-a',
        text: 'I feel tense or discouraged before I can think clearly.',
        scoringEffects: frictionScoreEffects({ 'emotional-load': 2 }),
      },
      {
        id: 'psq-tie-02-b',
        text: 'I cannot tell what to do next because the pieces are scattered.',
        scoringEffects: frictionScoreEffects({ organization: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-03',
    kind: 'tie-breaker',
    disambiguates: pair('emotional-load', 'distraction'),
    text: 'When focus slips, what usually comes first?',
    options: [
      {
        id: 'psq-tie-03-a',
        text: 'Stress or worry makes the task harder to stay with.',
        scoringEffects: frictionScoreEffects({ 'emotional-load': 2 }),
      },
      {
        id: 'psq-tie-03-b',
        text: 'Something nearby or on-screen pulls my attention away.',
        scoringEffects: frictionScoreEffects({ distraction: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-04',
    kind: 'tie-breaker',
    disambiguates: pair('emotional-load', 'starting'),
    text: 'Which barrier shows up more often at the beginning?',
    options: [
      {
        id: 'psq-tie-04-a',
        text: 'I feel emotionally loaded before I can begin.',
        scoringEffects: frictionScoreEffects({ 'emotional-load': 2 }),
      },
      {
        id: 'psq-tie-04-b',
        text: 'I know what to do but still hesitate to start.',
        scoringEffects: frictionScoreEffects({ starting: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-05',
    kind: 'tie-breaker',
    disambiguates: pair('emotional-load', 'fatigue'),
    text: 'When finishing feels hard, which fits better?',
    options: [
      {
        id: 'psq-tie-05-a',
        text: 'Pressure or frustration makes the work feel heavier.',
        scoringEffects: frictionScoreEffects({ 'emotional-load': 2 }),
      },
      {
        id: 'psq-tie-05-b',
        text: 'My energy is simply too low to keep going.',
        scoringEffects: frictionScoreEffects({ fatigue: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-06',
    kind: 'tie-breaker',
    disambiguates: pair('motivation', 'organization'),
    text: 'Which pattern describes you more often?',
    options: [
      {
        id: 'psq-tie-06-a',
        text: 'Tasks feel dull or unrewarding even when they are defined.',
        scoringEffects: frictionScoreEffects({ motivation: 2 }),
      },
      {
        id: 'psq-tie-06-b',
        text: 'Tasks feel worthwhile but the steps are messy or unclear.',
        scoringEffects: frictionScoreEffects({ organization: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-07',
    kind: 'tie-breaker',
    disambiguates: pair('motivation', 'distraction'),
    text: 'When you drift away from work, which is more accurate?',
    options: [
      {
        id: 'psq-tie-07-a',
        text: 'The task stops feeling worth the effort.',
        scoringEffects: frictionScoreEffects({ motivation: 2 }),
      },
      {
        id: 'psq-tie-07-b',
        text: 'Something else nearby feels easier to pay attention to.',
        scoringEffects: frictionScoreEffects({ distraction: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-08',
    kind: 'tie-breaker',
    disambiguates: pair('motivation', 'starting'),
    text: 'Which delay happens more often for you?',
    options: [
      {
        id: 'psq-tie-08-a',
        text: 'I wait because the task does not feel engaging yet.',
        scoringEffects: frictionScoreEffects({ motivation: 2 }),
      },
      {
        id: 'psq-tie-08-b',
        text: 'I wait even when I know the first step.',
        scoringEffects: frictionScoreEffects({ starting: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-09',
    kind: 'tie-breaker',
    disambiguates: pair('motivation', 'fatigue'),
    text: 'When momentum drops, which explanation fits better?',
    options: [
      {
        id: 'psq-tie-09-a',
        text: 'The work loses meaning or reward for me.',
        scoringEffects: frictionScoreEffects({ motivation: 2 }),
      },
      {
        id: 'psq-tie-09-b',
        text: 'I am physically or mentally worn down.',
        scoringEffects: frictionScoreEffects({ fatigue: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-10',
    kind: 'tie-breaker',
    disambiguates: pair('organization', 'distraction'),
    text: 'When work scatters, what is the main cause?',
    options: [
      {
        id: 'psq-tie-10-a',
        text: 'My plan, files, or priorities are out of order.',
        scoringEffects: frictionScoreEffects({ organization: 2 }),
      },
      {
        id: 'psq-tie-10-b',
        text: 'External interruptions or tempting tabs take over.',
        scoringEffects: frictionScoreEffects({ distraction: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-11',
    kind: 'tie-breaker',
    disambiguates: pair('organization', 'starting'),
    text: 'At the start of a task, which is more true?',
    options: [
      {
        id: 'psq-tie-11-a',
        text: 'I need to organize or clarify before I can move.',
        scoringEffects: frictionScoreEffects({ organization: 2 }),
      },
      {
        id: 'psq-tie-11-b',
        text: 'The steps are clear, but I still hesitate to begin.',
        scoringEffects: frictionScoreEffects({ starting: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-12',
    kind: 'tie-breaker',
    disambiguates: pair('organization', 'fatigue'),
    text: 'When progress slows late in the day, which fits better?',
    options: [
      {
        id: 'psq-tie-12-a',
        text: 'Loose ends and unclear priorities pile up.',
        scoringEffects: frictionScoreEffects({ organization: 2 }),
      },
      {
        id: 'psq-tie-12-b',
        text: 'My energy is too low to keep sorting things out.',
        scoringEffects: frictionScoreEffects({ fatigue: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-13',
    kind: 'tie-breaker',
    disambiguates: pair('distraction', 'starting'),
    text: 'Which pattern shows up more when work is waiting?',
    options: [
      {
        id: 'psq-tie-13-a',
        text: 'I reach for easier tabs, messages, or side tasks.',
        scoringEffects: frictionScoreEffects({ distraction: 2 }),
      },
      {
        id: 'psq-tie-13-b',
        text: 'I stare at the work without opening or beginning it.',
        scoringEffects: frictionScoreEffects({ starting: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-14',
    kind: 'tie-breaker',
    disambiguates: pair('distraction', 'fatigue'),
    text: 'When you lose focus, which feels more accurate?',
    options: [
      {
        id: 'psq-tie-14-a',
        text: 'Something else captures my attention more easily.',
        scoringEffects: frictionScoreEffects({ distraction: 2 }),
      },
      {
        id: 'psq-tie-14-b',
        text: 'I am too tired to keep steering my attention back.',
        scoringEffects: frictionScoreEffects({ fatigue: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-15',
    kind: 'tie-breaker',
    disambiguates: pair('starting', 'fatigue'),
    text: 'When you postpone the next step, which is closer?',
    options: [
      {
        id: 'psq-tie-15-a',
        text: 'I am stuck at the threshold even though I could begin.',
        scoringEffects: frictionScoreEffects({ starting: 2 }),
      },
      {
        id: 'psq-tie-15-b',
        text: 'I am too drained to initiate anything new.',
        scoringEffects: frictionScoreEffects({ fatigue: 2 }),
      },
    ],
  },
  {
    id: 'psq-tie-16',
    kind: 'tie-breaker',
    disambiguates: pair('emotional-load', 'distraction'),
    text: 'When stress and interruptions compete, which wins more often?',
    options: [
      {
        id: 'psq-tie-16-a',
        text: 'Internal pressure makes the work harder to stay with.',
        scoringEffects: frictionScoreEffects({ 'emotional-load': 2, distraction: 1 }),
      },
      {
        id: 'psq-tie-16-b',
        text: 'External pulls win even when I am not especially stressed.',
        scoringEffects: frictionScoreEffects({ distraction: 2, 'emotional-load': 1 }),
      },
    ],
  },
  {
    id: 'psq-tie-17',
    kind: 'tie-breaker',
    disambiguates: pair('motivation', 'starting'),
    text: 'When a task sits untouched, which reason fits better?',
    options: [
      {
        id: 'psq-tie-17-a',
        text: 'It does not feel meaningful or rewarding enough yet.',
        scoringEffects: frictionScoreEffects({ motivation: 2, starting: 1 }),
      },
      {
        id: 'psq-tie-17-b',
        text: 'It feels fine, but I still cannot cross the starting line.',
        scoringEffects: frictionScoreEffects({ starting: 2, motivation: 1 }),
      },
    ],
  },
  {
    id: 'psq-tie-18',
    kind: 'tie-breaker',
    disambiguates: pair('organization', 'fatigue'),
    text: 'When your workspace feels messy late in the day, which is primary?',
    options: [
      {
        id: 'psq-tie-18-a',
        text: 'Things are out of order and need sorting before I continue.',
        scoringEffects: frictionScoreEffects({ organization: 2, fatigue: 1 }),
      },
      {
        id: 'psq-tie-18-b',
        text: 'I am too tired to reorganize, so I stop entirely.',
        scoringEffects: frictionScoreEffects({ fatigue: 2, organization: 1 }),
      },
    ],
  },
];

export const personalizationQuizBank: PersonalizationQuizBank = {
  version: PERSONALIZATION_QUIZ_BANK_VERSION,
  scenarios: [...screeningScenarios, ...tieBreakerScenarios],
};

export const personalizationQuizScreeningScenarios = screeningScenarios;
export const personalizationQuizTieBreakerScenarios = tieBreakerScenarios;

export const getPersonalizationQuizScenarioById = (
  scenarioId: string
): PersonalizationQuizScenario | undefined =>
  personalizationQuizBank.scenarios.find((scenario) => scenario.id === scenarioId);
