"use client"

import {
  DateField as AriaDateField,
  DateFieldProps as AriaDateFieldProps,
  DateInput as AriaDateInput,
  DateInputProps as AriaDateInputProps,
  DateSegment as AriaDateSegment,
  DateSegmentProps as AriaDateSegmentProps,
  DateValue as AriaDateValue,
  FieldError as AriaFieldError,
  FieldErrorProps as AriaFieldErrorProps,
  Group as AriaGroup,
  GroupProps as AriaGroupProps,
  Label as AriaLabel,
  LabelProps as AriaLabelProps,
  Text as AriaText,
  TextProps as AriaTextProps,
  TimeField as AriaTimeField,
  TimeFieldProps as AriaTimeFieldProps,
  TimeValue as AriaTimeValue,
  ValidationResult as AriaValidationResult,
  composeRenderProps,
  Text,
} from "react-aria-components"

import styles from "./TimeField.module.css"

const Label = ({ className, ...props }: AriaLabelProps) => (
  <AriaLabel className={`${styles.label} ${className || ""}`} {...props} />
)

const FormDescription = ({ className, ...props }: AriaTextProps) => {
  return (
    <AriaText
      className={`${styles.formDescription} ${className || ""}`}
      {...props}
      slot="description"
    />
  )
}

const FieldError = ({ className, ...props }: AriaFieldErrorProps) => {
  return (
    <AriaFieldError
      className={`${styles.fieldError} ${className || ""}`}
      {...props}
    />
  )
}

interface GroupProps extends AriaGroupProps {
  variant?: "default" | "ghost"
  className?: string
}

const FieldGroup = ({ className = "", variant = "default", ...props }: GroupProps) => {
  const variantClass = variant === "default" ? styles.fieldGroupDefault : styles.fieldGroupGhost
  return (
    <AriaGroup
      className={composeRenderProps(className as any, (className: string) =>
        `${variantClass} ${className || ""}`
      )}
      {...props}
    />
  )
}

const DateField = AriaDateField

const TimeField = AriaTimeField

const DateSegment = ({ className, ...props }: AriaDateSegmentProps) => {
  return (
    <AriaDateSegment
      className={composeRenderProps(className, (className) =>
        `${styles.dateSegment} ${className || ""}`
      )}
      {...props}
    />
  )
}

interface DateInputProps extends AriaDateInputProps {}

const DateInput = ({
  className,
  ...props
}: Omit<DateInputProps, "children">) => {
  return (
    <AriaDateInput
      className={composeRenderProps(className, (className) =>
        `${styles.dateInput} ${className || ""}`
      )}
      {...props}
    >
      {(segment) => <DateSegment segment={segment} />}
    </AriaDateInput>
  )
}

interface JollyDateFieldProps<T extends AriaDateValue>
  extends AriaDateFieldProps<T> {
  label?: string
  description?: string
  errorMessage?: string | ((validation: AriaValidationResult) => string)
}

const JollyDateField = <T extends AriaDateValue,>({
  label,
  description,
  className,
  errorMessage,
  ...props
}: JollyDateFieldProps<T>) => {
  return (
    <DateField
      className={composeRenderProps(className, (className) =>
        `${styles.dateFieldContainer} ${className || ""}`
      )}
      {...props}
    >
      <Label>{label}</Label>
      <DateInput />
      {description && (
        <Text slot="description">
          {description}
        </Text>
      )}
      <FieldError>{errorMessage}</FieldError>
    </DateField>
  )
}

interface JollyTimeFieldProps<T extends AriaTimeValue>
  extends AriaTimeFieldProps<T> {
  label?: string
  description?: string
  errorMessage?: string | ((validation: AriaValidationResult) => string)
}

const JollyTimeField = <T extends AriaTimeValue,>({
  label,
  description,
  errorMessage,
  className,
  ...props
}: JollyTimeFieldProps<T>) => {
  return (
    <TimeField
      className={composeRenderProps(className, (className) =>
        `${styles.dateFieldContainer} ${className || ""}`
      )}
      {...props}
    >
      <Label>{label}</Label>
      <DateInput />
      {description && <Text slot="description">{description}</Text>}
      <FieldError>{errorMessage}</FieldError>
    </TimeField>
  )
}

export {
  DateField,
  DateSegment,
  DateInput,
  TimeField,
  Label,
  FieldGroup,
  FieldError,
  FormDescription,
  JollyDateField,
  JollyTimeField,
}
export type { DateInputProps, JollyDateFieldProps, JollyTimeFieldProps }
