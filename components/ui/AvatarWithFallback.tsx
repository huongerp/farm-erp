import React, { useState } from 'react';

/** Lấy 2 chữ cái đầu từ tên (ví dụ: "Lê Minh Công" → "LC", "Nguyễn Văn A" → "NA") */
function getInitials(name: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    const a = first.charAt(0).toUpperCase();
    const b = last.charAt(0).toUpperCase();
    return (a + b).slice(0, 2);
  }
  if (trimmed.length >= 2) return trimmed.slice(0, 2).toUpperCase();
  return trimmed.charAt(0).toUpperCase();
}

/** Hash đơn giản để màu ổn định theo chuỗi */
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const AVATAR_COLORS = [
  'bg-slate-600 text-white',
  'bg-blue-600 text-white',
  'bg-indigo-600 text-white',
  'bg-violet-600 text-white',
  'bg-purple-600 text-white',
  'bg-fuchsia-600 text-white',
  'bg-pink-600 text-white',
  'bg-rose-600 text-white',
  'bg-red-600 text-white',
  'bg-orange-600 text-white',
  'bg-amber-600 text-white',
  'bg-emerald-600 text-white',
  'bg-teal-600 text-white',
  'bg-cyan-600 text-white',
  'bg-sky-600 text-white',
];

export interface AvatarWithFallbackProps {
  /** URL ảnh đại diện (nếu trống hoặc lỗi sẽ hiện chữ cái đầu) */
  src?: string | null;
  /** Tên để tạo chữ cái đầu và màu nền ổn định */
  name: string;
  /** Seed cho màu (mặc định dùng name); có thể truyền id để cùng tên khác người vẫn khác màu */
  seed?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'full' | 'lg';
  className?: string;
  alt?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-2xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-14 h-14 text-lg',
};

export const AvatarWithFallback: React.FC<AvatarWithFallbackProps> = ({
  src,
  name,
  seed,
  size = 'sm',
  rounded = 'full',
  className = '',
  alt,
}) => {
  const [imgError, setImgError] = useState(false);
  const showFallback = !src || imgError;
  const initials = getInitials(name);
  const colorIndex = hashString(seed ?? name) % AVATAR_COLORS.length;
  const colorClass = AVATAR_COLORS[colorIndex];
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-lg';
  const sizeClass = sizeClasses[size];

  if (showFallback) {
    return (
      <div
        className={`${sizeClass} ${roundedClass} ${colorClass} flex items-center justify-center font-semibold shrink-0 border border-white/20 shadow-sm ${className}`}
        title={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? name}
      className={`${sizeClass} ${roundedClass} object-cover border border-border shadow-sm shrink-0 ${className}`}
      onError={() => setImgError(true)}
    />
  );
};

export default AvatarWithFallback;
