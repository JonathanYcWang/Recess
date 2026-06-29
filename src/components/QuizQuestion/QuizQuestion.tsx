import { QuizQuestion as QuizQuestionType, QuizOption } from '../../Shared/Types/Quiz';
import Button from '../Button/Button';
import styles from './QuizQuestion.module.css';

interface QuizQuestionProps {
  question: QuizQuestionType;
  onSelectOption: (option: QuizOption) => void;
}

const QuizQuestion = ({ question, onSelectOption }: QuizQuestionProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.questionText}>{question.text}</div>
      <div className={styles.optionsContainer}>
        {question.options.map((option) => (
          <Button
            key={option.id}
            text={option.text}
            onClick={() => onSelectOption(option)}
            variant="tertiary"
          />
        ))}
      </div>
    </div>
  );
};

export default QuizQuestion;
