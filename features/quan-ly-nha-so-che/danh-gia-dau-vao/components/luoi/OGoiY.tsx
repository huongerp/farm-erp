/**
 * Ô chữ trong lưới có gợi ý (thay `<datalist>` của trình duyệt — hiện khác nhau, không lọc theo chữ giữa).
 * Gõ tự do; danh sách gợi ý lọc theo chữ đang gõ, ↑↓ chọn, Enter điền, Esc đóng. Dropdown vẽ qua portal
 * (fixed) để không bị khung cuộn ngang của lưới cắt. `onRoiO` nhận giá trị cuối khi rời ô.
 */
import React, { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../../../lib/utils';
import { khoaTen } from '../../core/chuan-hoa-ten';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onRoiO: (v: string) => void;
  goiY: readonly string[];
  className?: string;
  maxLength?: number;
  'aria-label'?: string;
}

const MAX_GOI_Y = 8;

const OGoiY: React.FC<Props> = ({ value, onChange, onRoiO, goiY, className, maxLength, 'aria-label': ariaLabel }) => {
  const ref = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [mo, setMo] = useState(false);
  const [chon, setChon] = useState(-1);
  const [viTri, setViTri] = useState<{ left: number; top: number; width: number } | null>(null);

  const ds = useMemo(() => {
    const k = khoaTen(value);
    return goiY.filter((x) => khoaTen(x) !== k && (k === '' || khoaTen(x).includes(k))).slice(0, MAX_GOI_Y);
  }, [goiY, value]);
  const hien = mo && ds.length > 0;

  useLayoutEffect(() => {
    if (!hien || !ref.current) return;
    const capNhat = () => {
      const r = ref.current?.getBoundingClientRect();
      if (r) setViTri({ left: r.left, top: r.bottom + 2, width: Math.max(r.width, 160) });
    };
    capNhat();
    window.addEventListener('scroll', capNhat, true);
    window.addEventListener('resize', capNhat);
    return () => {
      window.removeEventListener('scroll', capNhat, true);
      window.removeEventListener('resize', capNhat);
    };
  }, [hien]);

  const dien = (v: string) => {
    onChange(v);
    setMo(false);
    setChon(-1);
  };

  return (
    <>
      <input
        ref={ref}
        className={className}
        value={value}
        maxLength={maxLength}
        aria-label={ariaLabel}
        role="combobox"
        aria-controls={listId}
        aria-autocomplete="list"
        aria-expanded={hien}
        onFocus={() => setMo(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setMo(true);
          setChon(-1);
        }}
        onBlur={() => {
          setMo(false);
          onRoiO(value);
        }}
        onKeyDown={(e) => {
          if (!hien) return;
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const buoc = e.key === 'ArrowDown' ? 1 : -1;
            setChon((c) => (c + buoc + ds.length) % ds.length);
          } else if (e.key === 'Enter' && chon >= 0) {
            e.preventDefault();
            dien(ds[chon]);
          } else if (e.key === 'Escape') {
            setMo(false);
          }
        }}
      />
      {hien &&
        viTri &&
        createPortal(
          <ul
            id={listId}
            role="listbox"
            className="fixed z-[9999] m-0 p-1 list-none max-h-60 overflow-auto rounded-lg border border-border bg-card text-foreground shadow-lg"
            style={{ left: viTri.left, top: viTri.top, minWidth: viTri.width }}
          >
            {ds.map((x, i) => (
              <li
                key={x}
                role="option"
                aria-selected={i === chon}
                // mousedown + preventDefault: chọn trước khi input mất focus (blur sẽ lưu giá trị mới).
                onMouseDown={(e) => {
                  e.preventDefault();
                  dien(x);
                }}
                className={cn('px-2 py-1.5 rounded-md text-body-sm cursor-pointer whitespace-nowrap', i === chon ? 'bg-muted' : 'hover:bg-muted')}
              >
                {x}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </>
  );
};

export default OGoiY;
