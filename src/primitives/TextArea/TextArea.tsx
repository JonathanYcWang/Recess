import { FieldError, Label, Text, TextArea, TextField } from 'react-aria-components';

import fieldStyles from '../shared/field.module.css';

export interface PrimitiveTextAreaProps {
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
  rows?: number;
  onChange?: (value: string) => void;
  id?: string;
}

export const PrimitiveTextArea = ({
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
  rows = 4,
  onChange,
  id,
}: PrimitiveTextAreaProps) => {
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
      <TextArea
        placeholder={placeholder}
        rows={rows}
        className={`${fieldStyles.input} ${fieldStyles.textarea}`}
      />
      {showError ? <FieldError className={fieldStyles.error}>{errorMessage}</FieldError> : null}
    </TextField>
  );
};
