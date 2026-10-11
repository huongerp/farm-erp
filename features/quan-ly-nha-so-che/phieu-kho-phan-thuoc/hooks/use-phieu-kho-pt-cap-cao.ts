import { useCapBacToanQuyen } from '../../../he-thong/phan-quyen/hooks/use-cap-bac-toan-quyen';
import { useModulePermission } from '../../../he-thong/phan-quyen/hooks/use-module-permission';
import { useKhoBienThe } from '../../kho-bien-the/KhoBienTheProvider';
import { khoModuleId } from '../../kho-bien-the/bien-the';

/**
 * "Cấp cao" của phiếu kho: `cap_bac = 1` hoặc có quyền `admin`/`all` trên module phiếu kho của
 * biến thể (Sơ chế / Phân thuốc). Luôn sửa / xoá được phiếu, duyệt yêu cầu "Xin sửa" và là người
 * duy nhất đổi được ngày phiếu. Khớp fn_co_quyen_module(..., {admin,all}) ở trigger DB (mig 035).
 *
 * Tra quyền theo module_id tường minh, không qua context: form phiếu kho còn được mở từ module
 * Đề xuất mua hàng, nơi context là quyền của đề xuất.
 */
export function usePhieuKhoPTCapCao(): boolean {
  const bt = useKhoBienThe();
  const toanQuyen = useCapBacToanQuyen();
  const { canAdmin } = useModulePermission(khoModuleId(bt, 'phieu-kho-phan-thuoc'));
  return toanQuyen || canAdmin;
}
