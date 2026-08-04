import React from 'react';
import MultiSelect from '../ui/MultiSelect';
import type { Option } from '../ui/MultiSelect';
import { filterOptionsWithCount, type OptionWithCount } from '../../lib/filterOptionsWithCount';

/**
 * Filter chip multi-select: chọn nhiều giá trị cho bộ lọc toolbar.
 * Quy chuẩn: (1) "Chọn tất cả" + "Xóa chọn" trong dropdown; (2) chỉ hiện option có count > 0 (hoặc đang chọn) khi hideZeroCount.
 */
interface FilterChipMultiSelectProps<T extends OptionWithCount = OptionWithCount> {
  options: T[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  icon?: React.ElementType;
  className?: string;
  size?: 'sm' | 'md';
  /** Mặc định true: ẩn option có count = 0; giữ option đang chọn để có thể bỏ chọn. */
  hideZeroCount?: boolean;
}

function FilterChipMultiSelect<T extends OptionWithCount = OptionWithCount>({
  options,
  value,
  onChange,
  placeholder,
  icon,
  className = 'w-full sm:w-[150px]',
  size = 'md',
  hideZeroCount = true,
}: FilterChipMultiSelectProps<T>) {
  const visibleOptions = hideZeroCount ? filterOptionsWithCount(options, value) : options;
  return (
    <MultiSelect
      options={visibleOptions as Option[]}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={icon}
      className={className}
      size={size}
    />
  );
}

export default FilterChipMultiSelect;
