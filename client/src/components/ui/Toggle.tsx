import styles from './Toggle.module.css';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className={styles.wrapper}>
      <div
        className={`${styles.track} ${checked ? styles.trackChecked : ''}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <div className={`${styles.thumb} ${checked ? styles.thumbChecked : ''}`} />
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
}
