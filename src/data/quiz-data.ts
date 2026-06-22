import { QuizQuestion } from '../types/quiz';

const quizQuestions: QuizQuestion[] = [
  {
    id: 'T1',
    text: 'Job Kingdom is under attack by the Unemployment Minions. You get conscripted by your kingdom to fight. Your squadron leader has given you your first quest.',
    options: [
      {
        id: 'T1_A',
        text: 'Start the quest',
        mbti: [],
        friction: [],
        next: 'Q1',
      },
    ],
  },

  {
    id: 'Q1',
    text: "You're hesitant to start the first quest. What's stopping you?",
    options: [
      {
        id: 'Q1_A',
        text: 'Too stressed and anxious. I need an emotional support duo.',
        mbti: ['F', 'I'],
        friction: ['EMO'],
        next: 'Q2',
      },
      {
        id: 'Q1_B',
        text: "The quest doesn't excite me and I lack motivation.",
        mbti: ['N'],
        friction: ['MOT'],
        next: 'Q2',
      },
      {
        id: 'Q1_C',
        text: 'I feel overwhelmed by all the steps.',
        mbti: ['J'],
        friction: ['ORG'],
        next: 'Q2',
      },
      {
        id: 'Q1_D',
        text: 'Other distractions pull me away.',
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
        text: '[AutoSort] — Organize all my work instantly',
        mbti: ['J'],
        friction: ['ORG'],
        next: 'Q3',
      },
      {
        id: 'Q2_B',
        text: '[First Strike] - Start and finish the first part right away',
        mbti: ['S'],
        friction: ['ENG'],
        next: 'Q3',
      },
      {
        id: 'Q2_C',
        text: '[Therapist Companion] - Emotional regulator',
        mbti: ['F'],
        friction: ['EMO'],
        next: 'Q3',
      },
      {
        id: 'Q2_D',
        text: '[Morale Chant] — Motivation booster',
        mbti: ['E'],
        friction: ['MOT'],
        next: 'Q3',
      },
    ],
  },

  {
    id: 'Q3',
    text: 'Your squadron leader sees you trying! He lets you choose your quest - which one?',
    options: [
      {
        id: 'Q3_A',
        text: 'Something exciting. Slay the unemployment dragon.',
        mbti: ['S', 'E'],
        friction: [],
        next: 'Q3_1',
      },
      {
        id: 'Q3_B',
        text: 'Analyze unemployment monster behaviour and strategize.',
        mbti: ['T'],
        friction: [],
        next: 'Q3_2',
      },
      {
        id: 'Q3_C',
        text: 'Apply your creativity by ideating new magic weapons to fight.',
        mbti: ['N'],
        friction: [],
        next: 'Q3_3',
      },
      {
        id: 'Q3_D',
        text: 'Join a party mission with others.',
        mbti: ['E', 'F'],
        friction: [],
        next: 'Q3_4',
      },
    ],
  },

  {
    id: 'Q3_1',
    text: 'You set out to slay an unemployment dragon — how do you fight?',
    options: [
      {
        id: 'Q3_1_A',
        text: 'Rally the squad and assign roles.',
        mbti: ['E', 'J'],
        friction: [],
        next: 'T4_Fight',
      },
      {
        id: 'Q3_1_B',
        text: 'Study its patterns and strike weak points.',
        mbti: ['T'],
        friction: [],
        next: 'T4_Fight',
      },
      {
        id: 'Q3_1_C',
        text: 'Improvise a clever, unexpected tactic.',
        mbti: ['N', 'P'],
        friction: [],
        next: 'T4_Fight',
      },
      {
        id: 'Q3_1_D',
        text: 'Face it head-on with decisive force.',
        mbti: ['S'],
        friction: [],
        next: 'T4_Fight',
      },
    ],
  },

  {
    id: 'Q3_2',
    text: "You're analyzing unemployment monster activity. Where do you start?",
    options: [
      {
        id: 'Q3_2_A',
        text: 'Study battle reports and identify patterns in their attacks',
        mbti: ['T'],
        friction: [],
        next: 'T4_Support',
      },
      {
        id: 'Q3_2_B',
        text: "Build a long-term strategy predicting where they'll strike next",
        mbti: ['N', 'J'],
        friction: [],
        next: 'T4_Support',
      },
      {
        id: 'Q3_2_C',
        text: 'Compare previous battles to find reliable tactics that worked before',
        mbti: ['S'],
        friction: [],
        next: 'T4_Support',
      },
      {
        id: 'Q3_2_D',
        text: 'Gather insight from different squads before deciding on a plan',
        mbti: ['F', 'E'],
        friction: [],
        next: 'T4_Support',
      },
    ],
  },

  {
    id: 'Q3_3',
    text: 'You begin designing new magic weapons for the kingdom. What weapon do you create?',
    options: [
      {
        id: 'Q3_3_A',
        text: 'A chaotic prototype that changes abilities every battle',
        mbti: ['N', 'P'],
        friction: [],
        next: 'T4_Create',
      },
      {
        id: 'Q3_3_B',
        text: 'A perfectly optimized weapon built for maximum efficiency',
        mbti: ['T', 'J'],
        friction: [],
        next: 'T4_Create',
      },
      {
        id: 'Q3_3_C',
        text: 'A support device that boosts and protects allies',
        mbti: ['F', 'E'],
        friction: [],
        next: 'T4_Create',
      },
      {
        id: 'Q3_3_D',
        text: 'A practical all-purpose weapon that never fails in combat',
        mbti: ['S'],
        friction: [],
        next: 'T4_Create',
      },
    ],
  },

  {
    id: 'Q3_4',
    text: 'You join a party mission to fight unemployment minions as a team. What role do you take?',
    options: [
      {
        id: 'Q3_4_A',
        text: 'Coordinate everyone and lead the mission',
        mbti: ['E', 'J'],
        friction: [],
        next: 'T4_Party',
      },
      {
        id: 'Q3_4_B',
        text: 'Handle a specialized role independently behind the scenes',
        mbti: ['I', 'T'],
        friction: [],
        next: 'T4_Party',
      },
      {
        id: 'Q3_4_C',
        text: 'Keep morale high and make sure nobody gets left behind',
        mbti: ['F', 'E'],
        friction: [],
        next: 'T4_Party',
      },
      {
        id: 'Q3_4_D',
        text: 'Adapt to whatever the party needs in the moment',
        mbti: ['P'],
        friction: [],
        next: 'T4_Party',
      },
    ],
  },

  {
    id: 'T4_Fight',
    text: 'You successfully slay the unemployment dragon!',
    options: [
      {
        id: 'T4_Fight_A',
        text: 'Go to the infirmary.',
        mbti: [],
        friction: [],
        next: 'Q4',
      },
    ],
  },

  {
    id: 'T4_Support',
    text: 'You successfully analyze the unemployment minions!',
    options: [
      {
        id: 'T4_Support_A',
        text: 'Hand the strategy off to the field soldiers.',
        mbti: [],
        friction: [],
        next: 'Q4',
      },
    ],
  },

  {
    id: 'T4_Create',
    text: 'You successfully create the new magic weapon!',
    options: [
      {
        id: 'T4_Create_A',
        text: 'Push it to production.',
        mbti: [],
        friction: [],
        next: 'Q4',
      },
    ],
  },

  {
    id: 'T4_Party',
    text: 'Your party is triumphant over the hoard of unemployment minions!',
    options: [
      {
        id: 'T4_Party_A',
        text: 'Head to the tavern.',
        mbti: [],
        friction: [],
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
        text: 'No, I must keep going.',
        mbti: ['J'],
        friction: ['ENG'],
        next: 'Q4_1',
      },
      {
        id: 'Q4_B',
        text: 'I do need frequent breaks.',
        mbti: ['P'],
        friction: ['FAT'],
        next: 'Q4_2',
      },
      {
        id: 'Q4_C',
        text: "A short break, then I'll go back soon.",
        mbti: ['J'],
        friction: ['FAT'],
        next: 'Q4_1',
      },
      {
        id: 'Q4_D',
        text: 'FINALLY. Is my whole conscription done now?',
        mbti: [],
        friction: ['MOT'],
        next: 'Q4_2',
      },
    ],
  },

  {
    id: 'Q4_1',
    text: 'You dozed off accidentally after doing some more war preparation.',
    options: [
      {
        id: 'Q4_1_A',
        text: 'Back to work.',
        mbti: [],
        friction: [],
        next: 'Q5_1',
      },
    ],
  },

  {
    id: 'Q4_2',
    text: 'This is a productivity app. You were gobbled up for slacking.',
    options: [
      {
        id: 'Q4_2_A',
        text: 'You Died.',
        mbti: [],
        friction: [],
        next: 'Q5_2',
      },
    ],
  },

  {
    id: 'Q5_1',
    text: 'After the break how do you feel?',
    options: [
      {
        id: 'Q5_1_A',
        text: 'Refreshed.',
        mbti: [],
        friction: ['ENG'],
        next: 'Q6_1',
      },
      {
        id: 'Q5_1_B',
        text: 'Unmotivated.',
        mbti: [],
        friction: ['MOT'],
        next: 'Q6_2',
      },
      {
        id: 'Q5_1_C',
        text: 'Tired.',
        mbti: [],
        friction: ['FAT'],
        next: 'Q6_2',
      },
      {
        id: 'Q5_1_D',
        text: 'Bored. Time to work.',
        mbti: [],
        friction: ['ENG'],
        next: 'Q6_1',
      },
    ],
  },

  {
    id: 'Q5_2',
    text: 'You wake up from your dream. After the break how do you feel?',
    options: [
      {
        id: 'Q5_2_A',
        text: 'Refreshed.',
        mbti: [],
        friction: ['ENG'],
        next: 'Q6_1',
      },
      {
        id: 'Q5_2_B',
        text: 'Unmotivated.',
        mbti: [],
        friction: ['MOT'],
        next: 'Q6_2',
      },
      {
        id: 'Q5_2_C',
        text: 'Tired.',
        mbti: [],
        friction: ['FAT'],
        next: 'Q6_2',
      },
      {
        id: 'Q5_2_D',
        text: 'Bored. Time to work.',
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
        text: 'Frontlines.',
        mbti: ['S'],
        friction: [],
        next: 'Q6_1_Kidnapped_A',
      },
      {
        id: 'Q6_1_B',
        text: 'Watchtower.',
        mbti: ['T'],
        friction: [],
        next: 'Q6_1_Kidnapped_B',
      },
      {
        id: 'Q6_1_C',
        text: 'Workshop.',
        mbti: ['N'],
        friction: [],
        next: 'Q6_1_Kidnapped_C',
      },
      {
        id: 'Q6_1_D',
        text: 'War camp.',
        mbti: ['E', 'F'],
        friction: [],
        next: 'Q6_1_Kidnapped_D',
      },
    ],
  },

  {
    id: 'Q6_1_Kidnapped_A',
    text: "While exploring the frontlines, you're kidnapped! Your high motivation is a threat to the unemployment forces.",
    options: [
      {
        id: 'Q6_1_Kidnapped_A_A',
        text: 'A potato sack is thrown over your head.',
        mbti: [],
        friction: [],
        next: 'T7',
      },
    ],
  },

  {
    id: 'Q6_1_Kidnapped_B',
    text: "While exploring the watchtower, you're kidnapped! Your high motivation is a threat to the unemployment forces.",
    options: [
      {
        id: 'Q6_1_Kidnapped_B_A',
        text: 'A potato sack is thrown over your head.',
        mbti: [],
        friction: [],
        next: 'T7',
      },
    ],
  },

  {
    id: 'Q6_1_Kidnapped_C',
    text: "While exploring the workshop, you're kidnapped! Your high motivation is a threat to the unemployment forces.",
    options: [
      {
        id: 'Q6_1_Kidnapped_C_A',
        text: 'A potato sack is thrown over your head.',
        mbti: [],
        friction: [],
        next: 'T7',
      },
    ],
  },

  {
    id: 'Q6_1_Kidnapped_D',
    text: "While exploring the war camp, you're kidnapped! Your high motivation is a threat to the unemployment forces.",
    options: [
      {
        id: 'Q6_1_Kidnapped_D_A',
        text: 'A potato sack is thrown over your head.',
        mbti: [],
        friction: [],
        next: 'T7',
      },
    ],
  },

  {
    id: 'Q6_2',
    text: 'You take on a slower task — building the ultimate job application nuke. What do you add?',
    options: [
      {
        id: 'Q6_2_A',
        text: 'A step-by-step system.',
        mbti: ['J'],
        friction: [],
        next: 'Q6_2_Kidnapped',
      },
      {
        id: 'Q6_2_B',
        text: 'A creative portfolio.',
        mbti: ['N'],
        friction: [],
        next: 'Q6_2_Kidnapped',
      },
      {
        id: 'Q6_2_C',
        text: 'Strong referrals.',
        mbti: ['F', 'E'],
        friction: [],
        next: 'Q6_2_Kidnapped',
      },
      {
        id: 'Q6_2_D',
        text: 'Impact metrics.',
        mbti: ['T'],
        friction: [],
        next: 'Q6_2_Kidnapped',
      },
    ],
  },

  {
    id: 'Q6_2_Kidnapped',
    text: "While creating the job application nuke, you're kidnapped! Your skills are a threat to the unemployment forces.",
    options: [
      {
        id: 'Q6_2_Kidnapped_A',
        text: 'A potato sack is thrown over your head.',
        mbti: [],
        friction: [],
        next: 'T7',
      },
    ],
  },

  {
    id: 'T7',
    text: 'You\'re thrown into the prison called "Another Statistic of Unemployment".',
    options: [
      {
        id: 'Q6_2_Kidnapped_A',
        text: "I'm  JOBLESS now...",
        mbti: [],
        friction: [],
        next: 'Q7',
      },
    ],
  },

  {
    id: 'Q7',
    text: 'There are unemployment minions guarding. How do you escape?',
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
    text: "You've escaped! On your way out, you happen to find the door to the Unemployment King. It's now or never.",
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
    text: "Nuh uh! We don't slack here at Recess. You're teleported directly into the Unemployment King's room as punishment.",
    options: [
      {
        id: 'Q8_FAIL_A',
        text: 'Accept fate.',
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
        text: 'Execute a carefully planned strategy.',
        mbti: ['T', 'J'],
        friction: [],
        next: 'Q10',
      },
      {
        id: 'Q9_B',
        text: 'Disrupt him with an unexpected creative move.',
        mbti: ['N', 'P'],
        friction: [],
        next: 'Q10',
      },
      {
        id: 'Q9_C',
        text: 'Rally allies to overwhelm him together.',
        mbti: ['E', 'F'],
        friction: [],
        next: 'Q10',
      },
      {
        id: 'Q9_D',
        text: 'Fight head-on with sheer force and momentum.',
        mbti: ['S'],
        friction: [],
        next: 'Q10',
      },
    ],
  },

  {
    id: 'Q10',
    text: "The Unemployment King is slayed! You're on your last strand of work ethic after that intesne exam. The Employment Kingdom brings you back and hails you as a hero. How do you celebrate?",
    options: [
      {
        id: 'Q10_A',
        text: 'Quiet rest and recovery.',
        mbti: ['I'],
        friction: [],
        next: 'Q11',
      },
      {
        id: 'Q10_B',
        text: 'Big team celebration.',
        mbti: ['E'],
        friction: [],
        next: 'Q11',
      },
      {
        id: 'Q10_C',
        text: 'Reflect on what the victory means.',
        mbti: ['F'],
        friction: [],
        next: 'Q11',
      },
      {
        id: 'Q10_D',
        text: 'Start planning the next mission.',
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
        text: 'Systemic forces are hard to dismantle.',
        mbti: ['T'],
        friction: [],
        next: 'Q12',
      },
      {
        id: 'Q11_B',
        text: 'Human fear and insecurity persist.',
        mbti: ['F'],
        friction: [],
        next: 'Q12',
      },
      {
        id: 'Q11_C',
        text: 'People resist change.',
        mbti: ['J'],
        friction: [],
        next: 'Q12',
      },
      {
        id: 'Q11_D',
        text: 'Chaos is part of nature.',
        mbti: ['P'],
        friction: [],
        next: 'Q12',
      },
    ],
  },

  {
    id: 'Q12',
    text: 'You go back to fighting stray unemployment minions as the job maxxing hero. What does your ideal workday looks like?',
    options: [
      {
        id: 'Q12_A',
        text: 'A structured schedule with clear plans.',
        mbti: ['J'],
        friction: [],
        next: 'Q13',
      },
      {
        id: 'Q12_B',
        text: 'Flexible blocks that adapt as needed.',
        mbti: ['P'],
        friction: [],
        next: 'Q13',
      },
      {
        id: 'Q12_C',
        text: 'Deep solo focus time.',
        mbti: ['I'],
        friction: [],
        next: 'Q13',
      },
      {
        id: 'Q12_D',
        text: 'Collaborative flow with others.',
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
        text: 'Reveal your familiar...',
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
