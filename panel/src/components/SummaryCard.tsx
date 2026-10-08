/**
 * 统计概览卡片
 */

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'info' | 'outing' | 'overtime';
  isLoading?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  isClickable?: boolean;
}

const COLOR_MAP = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  success: { bg: 'bg-success/10', text: 'text-success' },
  warning: { bg: 'bg-warning/10', text: 'text-warning' },
  info: { bg: 'bg-info/10', text: 'text-info' },
  outing: { bg: 'bg-outing/10', text: 'text-outing' },
  overtime: { bg: 'bg-overtime/10', text: 'text-overtime' },
} as const;

/**
 * 单张统计卡片
 */
export const SummaryCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
  isLoading = false,
  onClick,
  isClickable = true,
}: SummaryCardProps) => {
  const tones = COLOR_MAP[color];
  const clickable = Boolean(isClickable && onClick);

  return (
    <div
      className={`surface-panel rounded-2xl p-5 transition-all duration-300 ${
        clickable ? 'hover:-translate-y-0.5 hover:shadow-card-hover cursor-default' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-neutral-500 font-medium">{title}</h3>
        <div
          className={`w-10 h-10 rounded-xl ${tones.bg} flex items-center justify-center ${tones.text}`}
        >
          <i className={`fa ${icon}`} />
        </div>
      </div>
      <p
        className={`font-display text-[clamp(1.5rem,3vw,2rem)] font-bold text-neutral-700 ${
          clickable ? 'cursor-pointer' : ''
        }`}
        onClick={clickable ? onClick : undefined}
      >
        {isLoading ? (
          <span className="inline-block text-neutral-300 animate-pulse select-none">—</span>
        ) : (
          value
        )}
      </p>
      {subtitle && <p className="text-neutral-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
};
