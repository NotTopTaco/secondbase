import styles from './SegmentedControl.module.css';

interface Option {
  value: string;
  label: string;
}

interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className={styles.container} role="radiogroup">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`${styles.option} ${opt.value === value ? styles.active : ''}`}
          onClick={() => onChange(opt.value)}
          role="radio"
          aria-checked={opt.value === value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
