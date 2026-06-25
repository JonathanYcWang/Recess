import { FieldError, Input, Label, Text, TextField } from 'react-aria-components';

import fieldStyles from '../shared/field.module.css';
import styles from './TextField.module.css';

export interface PrimitiveTextFieldProps {
  label: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  description?: string;
  errorMessage?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  type?: 'text' | 'email' | 'password' | 'search' | 'url';
  onChange?: (value: string) => void;
  autoComplete?: string;
  id?: string;
}

export const PrimitiveTextField = ({
  label,
  name,
  value,
  defaultValue,
  placeholder,
  description,
  errorMessage,
  isDisabled,
  isRequired,
  isInvalid,
  type = 'text',
  onChange,
  autoComplete,
  id,
}: PrimitiveTextFieldProps) => {
  const showError = isInvalid && errorMessage;

  return (
    <TextField
      id={id}
      name={name}
      value={value}
      defaultValue={defaultValue}
      isDisabled={isDisabled}
      isRequired={isRequired}
      isInvalid={isInvalid}
      onChange={onChange}
      className={fieldStyles.field}
    >
      <Label className={fieldStyles.label}>
        {label}
        {isRequired ? <span aria-hidden="true"> *</span> : null}
      </Label>
      {description ? (
        <Text slot="description" className={fieldStyles.description}>
          {description}
        </Text>
      ) : null}
      <Input
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${fieldStyles.input} ${styles.input}`}
      />
      {showError ? <FieldError className={fieldStyles.error}>{errorMessage}</FieldError> : null}
    </TextField>
  );
};
