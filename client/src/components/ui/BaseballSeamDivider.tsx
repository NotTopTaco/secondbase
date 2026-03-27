import styles from './BaseballSeamDivider.module.css';

export function BaseballSeamDivider() {
  return (
    <svg
      className={styles.seam}
      viewBox="0 0 400 16"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      {/* Left S-curve */}
      <path
        d="M0,8 C50,2 100,14 200,8"
        fill="none"
        stroke="var(--mlb-red)"
        strokeWidth="1"
        opacity="0.25"
      />
      {/* Right S-curve (mirrored) */}
      <path
        d="M200,8 C300,2 350,14 400,8"
        fill="none"
        stroke="var(--mlb-red)"
        strokeWidth="1"
        opacity="0.25"
      />
      {/* Stitch ticks along left curve */}
      {[40, 80, 120, 160].map((x) => {
        const y = 8 + 6 * Math.sin(((x - 0) / 200) * Math.PI - Math.PI / 2) * -0.5;
        return (
          <line
            key={`l${x}`}
            x1={x}
            y1={y - 3}
            x2={x}
            y2={y + 3}
            stroke="var(--mlb-red)"
            strokeWidth="0.8"
            opacity="0.2"
          />
        );
      })}
      {/* Stitch ticks along right curve */}
      {[240, 280, 320, 360].map((x) => {
        const y = 8 + 6 * Math.sin(((x - 200) / 200) * Math.PI - Math.PI / 2) * -0.5;
        return (
          <line
            key={`r${x}`}
            x1={x}
            y1={y - 3}
            x2={x}
            y2={y + 3}
            stroke="var(--mlb-red)"
            strokeWidth="0.8"
            opacity="0.2"
          />
        );
      })}
    </svg>
  );
}
