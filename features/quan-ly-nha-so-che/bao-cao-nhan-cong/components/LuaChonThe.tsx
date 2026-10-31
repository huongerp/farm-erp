/** Thẻ lựa chọn (icon + tiêu đề + mô tả) dùng chung cho popup chọn kiểu in / kiểu xuất. */
import React from 'react';

interface Props {
  icon: React.ReactNode;
  tieuDe: string;
  moTa: string;
  onClick: () => void;
  disabled?: boolean;
}

const LuaChonThe: React.FC<Props> = ({ icon, tieuDe, moTa, onClick, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full text-left rounded-lg border border-border p-3 flex gap-3 hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:border-border"
  >
    <span className="mt-0.5 text-primary shrink-0">{icon}</span>
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-foreground">{tieuDe}</span>
      <span className="block text-xs text-muted-foreground mt-0.5">{moTa}</span>
    </span>
  </button>
);

export default LuaChonThe;
