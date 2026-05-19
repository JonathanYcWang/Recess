import { QuizQuestion } from '../types/quiz';

const quizQuestions: QuizQuestion[] = [
  {
    id: 'Q1',
    text: "You're hesitant to start the first quest.",
    options: [
      {
        id: 'Q1_A',
        text: 'Too stressed/anxious, need an emotional support duo',
        mbti: ['F', 'I'],
        friction: ['EMO'],
        next: 'Q2',
      },
      {
        id: 'Q1_B',
        text: "The quest doesn't excite me; I lack motivation",
        mbti: ['N'],
        friction: ['MOT'],
        next: 'Q2',
      },
      {
        id: 'Q1_C',
        text: 'I feel overwhelmed by all the steps',
        mbti: ['J'],
        friction: ['ORG'],
        next: 'Q2',
      },
      {
        id: 'Q1_D',
        text: 'Other distractions pull you away',
        mbti: ['P'],
        friction: ['ATT'],
        next: 'Q2',
      },
    ],
  },

  {
    id: 'Q2',
    text: 'Pick a power up before setting out on the quest',
    options: [
      {
        id: 'Q2_A',
        text: 'A task map — organize all your work instantly',
        mbti: ['J'],
        friction: ['ORG'],
        next: 'Q3',
      },
      {
        id: 'Q2_B',
        text: 'Start and finish the first part right away',
        mbti: ['S'],
        friction: ['ENG'],
        next: 'Q3',
      },
      {
        id: 'Q2_C',
        text: 'Emotional regulator',
        mbti: ['F'],
        friction: ['EMO'],
        next: 'Q3',
      },
      {
        id: 'Q2_D',
        text: 'A morale chant — morale booster',
        mbti: ['E'],
        friction: ['MOT'],
        next: 'Q3',
      },
    ],
  },

  {
    id: 'Q3',
    text: 'Your squadron leader lets you choose your quest',
    options: [
      {
        id: 'Q3_A',
        text: 'Slay the unemployment dragon',
        mbti: ['S', 'E'],
        friction: [],
        next: 'Q3_1',
      },
      {
        id: 'Q3_B',
        text: 'Analyze unemployment movement and strategy',
        mbti: ['T'],
        friction: [],
        next: 'Q3_2',
      },
      {
        id: 'Q3_C',
        text: 'Create new magic weapons',
        mbti: ['N'],
        friction: [],
        next: 'Q3_2',
      },
      {
        id: 'Q3_D',
        text: 'Join a party mission',
        mbti: ['E', 'F'],
        friction: [],
        next: 'Q3_2',
      },
    ],
  },

  {
    id: 'Q3_1',
    text: 'You finally set out to slay an unemployment dragon — how do you go about the fight?',
    options: [
      {
        id: 'Q3_1_A',
        text: 'Rally the squad and assign roles',
        mbti: ['E', 'J'],
        friction: [],
        next: 'Q4',
      },
      {
        id: 'Q3_1_B',
        text: 'Study its patterns and strike weak points',
        mbti: ['T'],
        friction: [],
        next: 'Q4',
      },
      {
        id: 'Q3_1_C',
        text: 'Improvise a clever, unexpected tactic',
        mbti: ['N', 'P'],
        friction: [],
        next: 'Q4',
      },
      {
        id: 'Q3_1_D',
        text: 'Face it head-on with decisive force',
        mbti: ['S'],
        friction: [],
        next: 'Q4',
      },
    ],
  },

  {
    id: 'Q3_2',
    text: "Instead of fighting directly, you're assigned a support role in the unemployment battle. What do you do?",
    options: [
      {
        id: 'Q3_2_A',
        text: 'Quietly make sure everyone has what they need to keep going',
        mbti: ['I', 'F'],
        friction: ['EMO'],
        next: 'Q4',
      },
      {
        id: 'Q3_2_B',
        text: 'Observe from the sidelines and step in only when necessary',
        mbti: ['I', 'P'],
        friction: ['ATT'],
        next: 'Q4',
      },
      {
        id: 'Q3_2_C',
        text: "Document what works and what doesn't for future battles",
        mbti: ['S', 'J'],
        friction: ['ORG'],
        next: 'Q4',
      },
      {
        id: 'Q3_2_D',
        text: 'Come up with alternative plans in case the main strategy fails',
        mbti: ['N'],
        friction: ['MOT'],
        next: 'Q4',
      },
    ],
  },

  {
    id: 'Q4',
    text: "It's time for a well deserved break!",
    options: [
      {
        id: 'Q4_A',
        text: 'No — keep going',
        mbti: ['J'],
        friction: ['ENG'],
        next: 'Q5',
      },
      {
        id: 'Q4_B',
        text: 'Yes — I need frequent breaks',
        mbti: ['P'],
        friction: ['FAT'],
        next: 'Q4_2',
      },
      {
        id: 'Q4_C',
        text: 'Yes — short break, then back soon',
        mbti: ['J'],
        friction: ['FAT'],
        next: 'Q4_1',
      },
      {
        id: 'Q4_D',
        text: 'Yes — lost cause, can I finish my mandatory conscription now',
        mbti: [],
        friction: ['MOT'],
        next: 'Q4_2',
      },
    ],
  },

  {
    id: 'Q4_1',
    text: 'You rest briefly and return before the kingdom notices.',
    options: [
      {
        id: 'Q4_1_A',
        text: 'Continue',
        mbti: [],
        friction: [],
        next: 'Q5',
      },
    ],
  },

  {
    id: 'Q4_2',
    text: 'You took too long. You were gobbled up for being unproductive.',
    options: [
      {
        id: 'Q4_2_A',
        text: 'You Died',
        mbti: [],
        friction: [],
        next: 'Q5',
      },
    ],
  },

  {
    id: 'Q5',
    text: 'After the nap or break, how do you feel?',
    options: [
      {
        id: 'Q5_1',
        text: 'Refreshed',
        mbti: [],
        friction: ['ENG'],
        next: 'Q6_1',
      },
      {
        id: 'Q5_2',
        text: 'Unmotivated',
        mbti: [],
        friction: ['MOT'],
        next: 'Q6_2',
      },
      {
        id: 'Q5_3',
        text: 'Tired',
        mbti: [],
        friction: ['FAT'],
        next: 'Q6_2',
      },
      {
        id: 'Q5_4',
        text: 'Bored but want to work',
        mbti: [],
        friction: ['ENG'],
        next: 'Q6_1',
      },
    ],
  },

  {
    id: 'Q6_1',
    text: 'With your energy restored, you explore the Unemployment Kingdom. Where do you go?',
    options: [
      {
        id: 'Q6_1_A',
        text: 'Frontlines',
        mbti: ['S'],
        friction: [],
        next: 'Q7',
      },
      {
        id: 'Q6_1_B',
        text: 'Watchtower',
        mbti: ['T'],
        friction: [],
        next: 'Q7',
      },
      {
        id: 'Q6_1_C',
        text: 'Workshop',
        mbti: ['N'],
        friction: [],
        next: 'Q7',
      },
      {
        id: 'Q6_1_D',
        text: 'War camp',
        mbti: ['E', 'F'],
        friction: [],
        next: 'Q7',
      },
    ],
  },

  {
    id: 'Q6_2',
    text: 'You take on a slower task — building the ultimate job application nuke. What do you add?',
    options: [
      {
        id: 'Q6_2_A',
        text: 'A step-by-step system',
        mbti: ['J'],
        friction: [],
        next: 'Q7',
      },
      {
        id: 'Q6_2_B',
        text: 'A creative portfolio',
        mbti: ['N'],
        friction: [],
        next: 'Q7',
      },
      {
        id: 'Q6_2_C',
        text: 'Strong referrals',
        mbti: ['F', 'E'],
        friction: [],
        next: 'Q7',
      },
      {
        id: 'Q6_2_D',
        text: 'Impact metrics',
        mbti: ['T'],
        friction: [],
        next: 'Q7',
      },
    ],
  },

  {
    id: 'Q7',
    text: "Thrown into the prison 'Another Statistic of Unemployment'. How do you escape?",
    options: [
      {
        id: 'Q7_A',
        text: 'Outsmart the guards',
        mbti: ['T'],
        friction: [],
        next: 'Q8',
      },
      {
        id: 'Q7_B',
        text: 'Improvise an escape',
        mbti: ['P'],
        friction: [],
        next: 'Q8',
      },
      {
        id: 'Q7_C',
        text: 'Persuade or ally with someone',
        mbti: ['F', 'E'],
        friction: [],
        next: 'Q8',
      },
      {
        id: 'Q7_D',
        text: 'Force your way out',
        mbti: ['S'],
        friction: [],
        next: 'Q8',
      },
    ],
  },

  {
    id: 'Q8',
    text: "You escape the prison and find the door to the Unemployment King. It's now or never.",
    options: [
      {
        id: 'Q8_A',
        text: "It's now or never! You barge in with your weapon ready.",
        mbti: ['S'],
        friction: [],
        next: 'Q9',
      },
      {
        id: 'Q8_B',
        text: 'Run! Surely someone with a higher-ranking job will defeat him.',
        mbti: [],
        friction: [],
        next: 'Q8_FAIL',
      },
    ],
  },

  {
    id: 'Q8_FAIL',
    text: "You died. Nuh uh! We don't slack here at Recess. You're teleported directly into the Unemployment King's room as punishment.",
    options: [
      {
        id: 'Q8_FAIL_A',
        text: 'Accept fate',
        mbti: [],
        friction: [],
        next: 'Q9',
      },
    ],
  },

  {
    id: 'Q9',
    text: 'How do you fight the Unemployment King?',
    options: [
      {
        id: 'Q9_A',
        text: 'Execute a carefully planned strategy',
        mbti: ['T', 'J'],
        friction: [],
        next: 'Q10',
      },
      {
        id: 'Q9_B',
        text: 'Disrupt him with an unexpected creative move',
        mbti: ['N', 'P'],
        friction: [],
        next: 'Q10',
      },
      {
        id: 'Q9_C',
        text: 'Rally allies to overwhelm him together',
        mbti: ['E', 'F'],
        friction: [],
        next: 'Q10',
      },
      {
        id: 'Q9_D',
        text: 'Fight head-on with sheer force and momentum',
        mbti: ['S'],
        friction: [],
        next: 'Q10',
      },
    ],
  },

  {
    id: 'Q10',
    text: 'Your Employment Kingdom team saves you and hails you as a hero. How do you celebrate?',
    options: [
      {
        id: 'Q10_A',
        text: 'Quiet rest and recovery',
        mbti: ['I'],
        friction: [],
        next: 'Q11',
      },
      {
        id: 'Q10_B',
        text: 'Big team celebration',
        mbti: ['E'],
        friction: [],
        next: 'Q11',
      },
      {
        id: 'Q10_C',
        text: 'Reflect on what the victory means',
        mbti: ['F'],
        friction: [],
        next: 'Q11',
      },
      {
        id: 'Q10_D',
        text: 'Start planning the next mission',
        mbti: ['J'],
        friction: [],
        next: 'Q11',
      },
    ],
  },

  {
    id: 'Q11',
    text: 'Despite your victory, unemployment still lingers. Why do you think this is?',
    options: [
      {
        id: 'Q11_A',
        text: 'Systemic forces are hard to dismantle',
        mbti: ['T'],
        friction: [],
        next: 'Q12',
      },
      {
        id: 'Q11_B',
        text: 'Human fear and insecurity persist',
        mbti: ['F'],
        friction: [],
        next: 'Q12',
      },
      {
        id: 'Q11_C',
        text: 'People resist change',
        mbti: ['J'],
        friction: [],
        next: 'Q12',
      },
      {
        id: 'Q11_D',
        text: 'Chaos is part of nature',
        mbti: ['P'],
        friction: [],
        next: 'Q12',
      },
    ],
  },

  {
    id: 'Q12',
    text: 'As a hero with agency, your ideal workday looks like:',
    options: [
      {
        id: 'Q12_A',
        text: 'A structured schedule with clear plans',
        mbti: ['J'],
        friction: [],
        next: 'Q13',
      },
      {
        id: 'Q12_B',
        text: 'Flexible blocks that adapt as needed',
        mbti: ['P'],
        friction: [],
        next: 'Q13',
      },
      {
        id: 'Q12_C',
        text: 'Deep solo focus time',
        mbti: ['I'],
        friction: [],
        next: 'Q13',
      },
      {
        id: 'Q12_D',
        text: 'Collaborative flow with others',
        mbti: ['E'],
        friction: [],
        next: 'Q13',
      },
    ],
  },

  {
    id: 'Q13',
    text: 'The kingdom grants you a familiar to fight alongside you.',
    options: [
      {
        id: 'Q13_A',
        text: 'Reveal your familiar',
        mbti: [],
        friction: [],
        next: 'RESULTS',
      },
    ],
  },
];

export const getQuestionById = (questionId: string): QuizQuestion | undefined => {
  return quizQuestions.find((q) => q.id === questionId);
};
