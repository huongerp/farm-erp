import React, { useMemo } from 'react';
import FilterChipMultiSelect from './FilterChipMultiSelect';
import FilterOverflowDropdown from './FilterOverflowDropdown';
import { useIsMobile } from '../../lib/hooks/use-is-mobile';
import {
  MAX_FILTER_CHIP,
  MAX_FILTER_CHIP_HEP,
  chiaChipLoc,
  type FilterChipItem,
} from '../../lib/filter-chip-split';

export type { FilterChipItem };

interface Props {
  /** Bộ lọc theo đúng thứ tự hiển thị. */
  items: FilterChipItem[];
  /** Số bộ lọc tối đa ngoài toolbar ở màn ≥ 1024px. */
  max?: number;
  /** Số bộ lọc tối đa ở màn hẹp (640–1024px). */
  maxHep?: number;
  /** Key luôn nằm trong nút Filter (bộ lọc ít dùng). */
  luonVaoFilter?: readonly string[];
  /** Class mặc định cho chip không tự đặt `className`. */
  chipClassName?: string;
}

/**
 * Hàng filter chip desktop: hiện tối đa 5 bộ lọc (3 ở màn hẹp), phần dư gom vào nút Filter.
 * Truyền vào prop `filters` của GenericToolbar / DashboardToolbar. Điện thoại (< 640px)
 * không dùng hàng này — toolbar mở bảng lọc từ `filterGroups`.
 */
const ResponsiveFilterChips: React.FC<Props> = ({
  items,
  max = MAX_FILTER_CHIP,
  maxHep = MAX_FILTER_CHIP_HEP,
  luonVaoFilter,
  chipClassName = 'w-full sm:w-[160px]',
}) => {
  const hep = useIsMobile(1024);
  const { hien, vaoFilter } = useMemo(
    () => chiaChipLoc(items, hep ? maxHep : max, luonVaoFilter),
    [items, hep, max, maxHep, luonVaoFilter]
  );

  return (
    <>
      {hien.map((it) =>
        it.kind === 'custom' ? (
          <React.Fragment key={it.key}>{it.node}</React.Fragment>
        ) : (
          <FilterChipMultiSelect
            key={it.group.key}
            options={it.group.options}
            value={it.group.value}
            onChange={it.group.onChange}
            placeholder={it.group.label}
            icon={it.group.icon}
            className={it.className ?? chipClassName}
            size="md"
          />
        )
      )}
      <FilterOverflowDropdown groups={vaoFilter} />
    </>
  );
};

export default ResponsiveFilterChips;
