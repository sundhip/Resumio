import React from 'react';

export interface AvatarItem {
  id: string | number;
  name: string;
  avatarUrl?: string;
  initials?: string;
  colorHex?: string;
}

export interface AvatarStackProps {
  avatars: AvatarItem[];
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  avatars,
  max = 4,
  size = 'md',
  className = '',
}) => {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  const sizeClasses = {
    sm: 'w-7 h-7 text-[10px] -space-x-1.5',
    md: 'w-9 h-9 text-xs -space-x-2',
    lg: 'w-11 h-11 text-sm -space-x-2.5',
  }[size];

  const avatarSize = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-11 h-11 text-sm',
  }[size];

  return (
    <div className={`inline-flex items-center ${sizeClasses} ${className}`}>
      {visible.map((av) => (
        <div
          key={av.id}
          title={av.name}
          className={`${avatarSize} rounded-full ring-2 ring-white dark:ring-[#0C1113] overflow-hidden flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 select-none`}
          style={{ backgroundColor: av.colorHex || '#1F8FA6' }}
        >
          {av.avatarUrl ? (
            <img src={av.avatarUrl} alt={av.name} className="w-full h-full object-cover" />
          ) : (
            <span>
              {av.initials ||
                av.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
            </span>
          )}
        </div>
      ))}

      {remaining > 0 && (
        <div
          className={`${avatarSize} rounded-full ring-2 ring-white dark:ring-[#0C1113] bg-[#E9E9E5] dark:bg-[#111719] text-[#5E6460] dark:text-[#9AA7AB] flex items-center justify-center font-bold flex-shrink-0 figure select-none shadow-sm`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
