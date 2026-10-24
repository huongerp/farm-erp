import { useMemo } from 'react';
import { useTienDoMuaHangList } from '../../../mua-hang/thiet-lap-de-xuat-vat-tu/hooks/use-tien-do-mua-hang';
import { cn } from '../../../../lib/utils';
import { styleBadgeTheoMau } from '../../../../lib/mau-badge';
import { getTienDoMhBadgeClass } from '../core/constants';

interface Props {
  ten: string;
  /** Ưu tiên tra màu theo id; không có id (hoặc đã xoá danh mục) thì tra theo tên. */
  id?: string | null;
  className?: string;
}

/**
 * Badge tiến độ mua hàng lấy màu cấu hình ở Thiết lập đề xuất → Tiến độ MH.
 * Danh mục chưa có màu thì rơi về bảng màu mặc định theo tên.
 */
export default function TienDoMhBadge({ ten, id, className }: Props) {
  const { data: danhSach = [] } = useTienDoMuaHangList();
  const mau = useMemo(() => {
    const tenChuan = ten.trim();
    const item = (id ? danhSach.find((x) => x.id === id) : undefined) ?? danhSach.find((x) => x.ten.trim() === tenChuan);
    return item?.mau?.trim() || null;
  }, [danhSach, id, ten]);

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
        !mau && getTienDoMhBadgeClass(ten),
        className
      )}
      style={mau ? styleBadgeTheoMau(mau) : undefined}
    >
      {ten}
    </span>
  );
}
