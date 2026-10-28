import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import styles from './Field.module.css';

export interface FieldProps {
  label: ReactNode;
  required?: boolean;
  help?: ReactNode;
  error?: string | null;
  id?: string;
  children: ReactNode;
}

/**
 * Label, control, help and error (port of the prototype's ChanelUI Field). The control gets
 * the id, `aria-describedby`, `aria-invalid` and `aria-required` wiring.
 */
export function Field({ label, required, help, error, id, children }: FieldProps) {
  const generated = useId();
  const controlId = id ?? `f${generated.replace(/:/g, '')}`;
  const helpId = `${controlId}-help`;
  const errorId = `${controlId}-error`;
  const describedBy = [error ? errorId : null, help ? helpId : null].filter(Boolean).join(' ');
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id: controlId,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
        ...(error && typeof children.type !== 'string' ? { status: 'error' } : {}),
      })
    : children;

  return (
    <div className={`cds-field ${styles.field}`}>
      <label htmlFor={controlId} className={`cds-field__label ${styles.label}`}>
        {label}
        {required ? (
          <span className={`cds-field__required ${styles.required}`} aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </label>
      {control}
      {help ? (
        <div id={helpId} className={`cds-field__help ${styles.help}`}>
          {help}
        </div>
      ) : null}
      <div id={errorId} className={`cds-field__error ${styles.error}`} aria-live="polite">
        {error ?? null}
      </div>
    </div>
  );
}
