import { DateInput, DateSegment, TimeField, TimeFieldProps } from 'react-aria-components';

import styles from './TimeField.module.css';
import { Time } from '@internationalized/date';

const TimeFieldComponent = (props: TimeFieldProps<Time>) => {
  return (
    <TimeField {...props} className={styles.container}>
      <DateInput className={styles.dateInput}>
        {(segment) => <DateSegment segment={segment} className={styles.dateSegment} />}
      </DateInput>
    </TimeField>
  );
};

export { TimeFieldComponent as TimeField };
