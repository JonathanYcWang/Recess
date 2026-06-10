export const ColorBombIcon = () => (
  <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
    <circle cx="20" cy="20" r="16" fill="var(--color-text-primary)" />
    <circle cx="20" cy="20" r="14" fill="var(--color-gray-700)" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, index) => (
      <circle
        key={deg}
        cx={20 + 10 * Math.cos((deg * Math.PI) / 180)}
        cy={20 + 10 * Math.sin((deg * Math.PI) / 180)}
        r="3"
        fill={
          [
            'var(--color-background-primary)',
            'var(--color-gray-100)',
            'var(--color-background-primary)',
            'var(--color-gray-300)',
            'var(--color-gray-250)',
            'var(--color-text-primary)',
            'var(--color-gray-200)',
            'var(--color-gray-100)',
          ][index]
        }
      />
    ))}
    <circle cx="20" cy="20" r="5" fill="var(--color-gray-600)" />
    <circle cx="17" cy="17" r="2" fill="var(--color-gray-300)" opacity="0.6" />
  </svg>
);

export const HammerIcon = () => (
  <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
    <rect x="18" y="20" width="5" height="16" rx="2" fill="var(--color-gray-700)" />
    <ellipse cx="20" cy="16" rx="10" ry="8" fill="var(--color-gray-300)" />
    <ellipse
      cx="20"
      cy="16"
      rx="10"
      ry="8"
      fill="none"
      stroke="var(--color-background-primary)"
      strokeWidth="1.5"
      strokeDasharray="4 3"
    />
    <ellipse
      cx="16"
      cy="13"
      rx="3"
      ry="2"
      fill="white"
      opacity="0.35"
      transform="rotate(-20 16 13)"
    />
  </svg>
);

export const FishIcon = () => (
  <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
    <ellipse cx="19" cy="21" rx="13" ry="9" fill="var(--color-gray-300)" />
    <polygon points="32,21 40,14 40,28" fill="var(--color-gray-500)" />
    <circle cx="10" cy="19" r="3" fill="white" />
    <circle cx="9" cy="19" r="1.5" fill="var(--color-text-primary)" />
    <ellipse
      cx="20"
      cy="14"
      rx="5"
      ry="3"
      fill="var(--color-gray-100)"
      transform="rotate(-20 20 14)"
    />
    <ellipse cx="15" cy="18" rx="3" ry="2" fill="white" opacity="0.3" />
  </svg>
);

export const SwitchIcon = () => (
  <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
    <ellipse cx="20" cy="24" rx="12" ry="10" fill="var(--color-gray-300)" />
    <ellipse
      cx="9"
      cy="20"
      rx="4"
      ry="6"
      fill="var(--color-gray-600)"
      transform="rotate(-20 9 20)"
    />
    {[13, 18, 23, 28].map((x) => (
      <rect key={x} x={x} y="10" width="4" height="12" rx="2" fill="var(--color-gray-600)" />
    ))}
    <rect x="8" y="30" width="24" height="5" rx="2" fill="var(--color-text-primary)" />
    <ellipse
      cx="16"
      cy="18"
      rx="4"
      ry="2.5"
      fill="white"
      opacity="0.25"
      transform="rotate(-15 16 18)"
    />
  </svg>
);

export const StripedWrappedIcon = () => (
  <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
    <defs>
      <clipPath id="stripedCandyClip">
        <circle cx="12" cy="22" r="9" />
      </clipPath>
    </defs>
    <circle cx="12" cy="22" r="9" fill="var(--color-gray-300)" />
    {[-20, -10, 0, 10, 20].map((offset) => (
      <line
        key={offset}
        x1={12 + offset - 9}
        y1={13}
        x2={12 + offset + 9}
        y2={31}
        stroke="white"
        strokeWidth="2"
        strokeOpacity="0.5"
        clipPath="url(#stripedCandyClip)"
      />
    ))}
    <circle
      cx="12"
      cy="22"
      r="9"
      fill="none"
      stroke="var(--color-text-primary)"
      strokeWidth="1.5"
    />
    <circle cx="28" cy="18" r="9" fill="var(--color-gray-600)" />
    <circle cx="28" cy="18" r="7" fill="var(--color-gray-700)" />
    <circle cx="28" cy="18" r="5" fill="var(--color-gray-600)" />
    <circle cx="28" cy="18" r="9" fill="none" stroke="var(--color-gray-300)" strokeWidth="1.5" />
    <ellipse
      cx="19"
      cy="18"
      rx="3"
      ry="5"
      fill="var(--color-gray-300)"
      transform="rotate(-30 19 18)"
    />
    <ellipse
      cx="37"
      cy="18"
      rx="3"
      ry="5"
      fill="var(--color-gray-300)"
      transform="rotate(30 37 18)"
    />
  </svg>
);

export const CoconutWheelIcon = () => (
  <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
    <circle cx="20" cy="20" r="15" fill="var(--color-gray-300)" />
    {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
      <line
        key={index}
        x1="20"
        y1="20"
        x2={20 + 15 * Math.cos((index * Math.PI) / 4)}
        y2={20 + 15 * Math.sin((index * Math.PI) / 4)}
        stroke="white"
        strokeWidth="2"
        strokeOpacity="0.7"
      />
    ))}
    <circle
      cx="20"
      cy="20"
      r="15"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeDasharray="6 4"
    />
    <circle cx="20" cy="20" r="4" fill="white" />
    <circle cx="20" cy="20" r="2" fill="var(--color-text-primary)" />
  </svg>
);

export const LuckyCandyIcon = () => (
  <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
    <circle cx="20" cy="20" r="15" fill="var(--color-gray-300)" />
    <circle cx="20" cy="20" r="13" fill="var(--color-text-primary)" />
    <polyline
      points="11,20 17,27 30,13"
      fill="none"
      stroke="white"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="20"
      cy="20"
      r="15"
      fill="none"
      stroke="var(--color-background-primary)"
      strokeWidth="1.5"
    />
    <ellipse
      cx="14"
      cy="14"
      rx="3"
      ry="2"
      fill="white"
      opacity="0.3"
      transform="rotate(-30 14 14)"
    />
  </svg>
);

export const JackpotIcon = () => (
  <svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true">
    <polygon
      points="20,4 23.5,14 34,14 25.5,20.5 28.5,31 20,25 11.5,31 14.5,20.5 6,14 16.5,14"
      fill="var(--color-gray-200)"
      stroke="var(--color-text-primary)"
      strokeWidth="1"
    />
    <polygon
      points="20,8 22.5,15 30,15 24,19.5 26.5,27 20,23 13.5,27 16,19.5 10,15 17.5,15"
      fill="var(--color-gray-500)"
    />
    {[0, 60, 120, 180, 240, 300].map((deg, index) => (
      <circle
        key={deg}
        cx={20 + 14 * Math.cos((deg * Math.PI) / 180)}
        cy={20 + 14 * Math.sin((deg * Math.PI) / 180)}
        r="3.5"
        fill={
          [
            'var(--color-gray-300)',
            'var(--color-background-primary)',
            'var(--color-text-primary)',
            'var(--color-gray-600)',
            'var(--color-gray-300)',
            'var(--color-gray-700)',
          ][index]
        }
      />
    ))}
  </svg>
);
