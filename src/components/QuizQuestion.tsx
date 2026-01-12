import React from 'react';
import { QuizQuestion as QuizQuestionType, QuizOption } from '../types/quiz';
import TertiaryButton from './TertiaryButton';
import styles from './QuizQuestion.module.css';

interface QuizQuestionProps {
  question: QuizQuestionType;
  onSelectOption: (option: QuizOption) => void;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({ question, onSelectOption }) => {
  return (
    <div className={styles.container}>
      <div className={styles.questionText}>{question.text}</div>
      <div className={styles.optionsContainer}>
        {question.options.map((option) => (
          <TertiaryButton
            key={option.id}
            text={option.text}
            onClick={() => onSelectOption(option)}
          />
        ))}
      </div>
    </div>
  );
};

export default QuizQuestion;
