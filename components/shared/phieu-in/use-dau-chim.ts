import { useTranslation } from 'react-i18next';
import { loaiDauChimNhieu } from '../../../lib/phieu-in/dau-chim';

/**
 * Chữ dấu chìm cho `PhieuInPage dauChim` theo trạng thái chứng từ («Bản nháp», «Chờ duyệt»,
 * «Đã huỷ», «Không duyệt»); bản chính thức → null. Truyền nhiều trạng thái thì lấy loại nặng nhất.
 */
export function useDauChim(...trangThai: (string | null | undefined)[]): string | null {
  const { t } = useTranslation();
  const loai = loaiDauChimNhieu(...trangThai);
  return loai ? t(`common.phieuIn.dauChim_${loai}`) : null;
}
