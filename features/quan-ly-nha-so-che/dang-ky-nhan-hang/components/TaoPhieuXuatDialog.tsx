import React, { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PackageCheck } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Select from '../../../../components/ui/Select';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { useKhoRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { formatNumberVN } from '../../../../lib/utils';
import type { DangKyNhanHang, DangKyNhanHangCt } from '../core/types';
import { gopTheoHangHoa } from '../core/gop-hang-hoa';
import { khoCuaChiNhanh, type PhieuXuatCuaXe } from '../core/phieu-xuat';
import { useTaoPhieuXuat } from '../hooks/use-dang-ky-nhan-hang';

interface Props {
  data: DangKyNhanHang;
  rows: DangKyNhanHangCt[];
  /** Có phiếu → chế độ "Cập nhật phiếu xuất" (ghi lại dòng theo cây hàng hiện tại). */
  phieu: PhieuXuatCuaXe | null;
  onClose: () => void;
}

/**
 * Xác nhận tạo / cập nhật phiếu xuất kho thành phẩm từ cây hàng trên xe.
 * Kho: chi nhánh có 1 kho thì tự chọn; NSC fp2 (2A / 2B) phải chọn. Dòng gộp theo thành phẩm.
 */
const TaoPhieuXuatDialog: React.FC<Props> = ({ data, rows, phieu, onClose }) => {
  const { t } = useTranslation();
  const formId = useId();
  const capNhat = !!phieu;
  const mutation = useTaoPhieuXuat(onClose);
  const { data: dsKho = [], isLoading: khoLoading } = useKhoRefQuery();
  const khoXe = useMemo(() => khoCuaChiNhanh(dsKho, data.id_chi_nhanh), [dsKho, data.id_chi_nhanh]);
  const [khoChon, setKhoChon] = useState('');
  const khoId = khoChon || phieu?.kho_id || (khoXe.length === 1 ? khoXe[0].id : '');
  const [loi, setLoi] = useState<string>();

  const dong = useMemo(() => gopTheoHangHoa(rows), [rows]);
  const tongThung = dong.reduce((s, d) => s + d.so_luong, 0);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!khoId) {
      setLoi(t('dangKyNhanHang.phieuXuat.chuaChonKho'));
      return;
    }
    mutation.mutate({ idDknh: data.id, khoId, capNhat });
  };

  return (
    <GenericDrawer
      title={t(capNhat ? 'dangKyNhanHang.phieuXuat.capNhatTitle' : 'dangKyNhanHang.phieuXuat.taoTitle')}
      subtitle={
        capNhat
          ? t('dangKyNhanHang.phieuXuat.capNhatSubtitle', { so: phieu.so_phieu })
          : t('dangKyNhanHang.phieuXuat.taoSubtitle')
      }
      icon={<PackageCheck className="text-primary" size={20} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.COMPACT}
      footer={
        <FormDrawerFooter
          formId={formId}
          onCancel={onClose}
          isEdit={capNhat}
          isLoading={mutation.isPending}
          saveLabel={t('dangKyNhanHang.phieuXuat.nutCapNhat')}
          createLabel={t('dangKyNhanHang.phieuXuat.nutTao')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id={formId} className="space-y-4 pb-2" onSubmit={onSubmit}>
        <Select
          label={t('dangKyNhanHang.phieuXuat.khoXuat')}
          required
          value={khoId}
          onChange={(e) => {
            setKhoChon(e.target.value);
            setLoi(undefined);
          }}
          options={khoXe.map((k) => ({ value: k.id, label: k.ten_kho }))}
          placeholder={
            khoLoading
              ? t('dangKyNhanHang.loading')
              : khoXe.length === 0
                ? t('dangKyNhanHang.phieuXuat.khongCoKho')
                : t('dangKyNhanHang.phieuXuat.chonKho')
          }
          error={loi}
        />

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-2">{t('dangKyNhanHang.cayHang.thanhPham')}</th>
                <th className="text-right font-medium px-3 py-2 w-20">{t('dangKyNhanHang.phieuXuat.soCay')}</th>
                <th className="text-right font-medium px-3 py-2 w-24">{t('dangKyNhanHang.cayHang.thung')}</th>
              </tr>
            </thead>
            <tbody>
              {dong.map((d) => (
                <tr key={d.id_hang_hoa} className="border-t border-border">
                  <td className="px-3 py-2">{d.ten_hang_hoa || d.ma_hang_hoa || '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNumberVN(d.so_dong)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatNumberVN(d.so_luong)}</td>
                </tr>
              ))}
              <tr className="border-t border-border bg-muted/30 font-semibold">
                <td className="px-3 py-2">{t('dangKyNhanHang.preview.tong')}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatNumberVN(rows.length)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatNumberVN(tongThung)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-caption text-muted-foreground m-0">
          {t(capNhat ? 'dangKyNhanHang.phieuXuat.capNhatHint' : 'dangKyNhanHang.phieuXuat.taoHint')}
        </p>
      </form>
    </GenericDrawer>
  );
};

export default TaoPhieuXuatDialog;
