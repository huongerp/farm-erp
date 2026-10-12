import React, { useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle, ListPlus } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import type { KetQuaQuet } from '../../../../components/shared/QrScannerDialog';
import Combobox from '../../../../components/ui/Combobox';
import Input from '../../../../components/ui/Input';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import type { DangKyNhanHangCt } from '../core/types';
import { TIEN_TO_CHON_TAY, usePhieuQcOptions, useQuetCayHang } from '../hooks/use-quet-cay-hang';

interface Props {
  idPhieu: string;
  /** Farm của xe — chỉ chọn phiếu QC của farm này. */
  idChiNhanh: string;
  /** Cây hàng đã có trên xe — không hiện lại trong danh sách chọn. */
  rows: DangKyNhanHangCt[];
  onClose: () => void;
}

/**
 * Thêm cây hàng KHÔNG có tem (tem hỏng / mất / chưa in): chọn phiếu QC → nhập số thùng → Lưu.
 * Dùng chung luật với máy quét (`useQuetCayHang`, mã `PHIEU:<id>`), dòng ghi `nguon = 'tay'`.
 */
const ThemCayHangTayDialog: React.FC<Props> = ({ idPhieu, idChiNhanh, rows, onClose }) => {
  const { t } = useTranslation();
  const formId = useId();
  const { ghiNhan, lamMoiSauQuet } = useQuetCayHang(idPhieu);
  const daCoIds = useMemo(() => rows.map((r) => r.id_phieu_gscl), [rows]);
  const { options, isLoading } = usePhieuQcOptions(idChiNhanh, daCoIds);

  const [idChon, setIdChon] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQuaQuet | null>(null);
  const [dangKiem, setDangKiem] = useState(false);
  const [dangGhi, setDangGhi] = useState(false);
  const [raw, setRaw] = useState('');
  const [loiSo, setLoiSo] = useState<string>();
  const lanChon = useRef(0);

  const chon = async (value: string | number | null) => {
    const id = value == null || value === '' ? null : String(value);
    const lan = ++lanChon.current;
    setIdChon(id);
    setKq(null);
    setLoiSo(undefined);
    if (!id) return;
    setDangKiem(true);
    try {
      const k = await ghiNhan(`${TIEN_TO_CHON_TAY}${id}`);
      if (lan !== lanChon.current) return;
      setKq(k);
      if (k.nhapSo) setRaw(String(k.nhapSo.macDinh));
    } catch (err) {
      if (lan === lanChon.current) setKq({ ok: false, message: (err as Error).message });
    } finally {
      if (lan === lanChon.current) setDangKiem(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nhapSo = kq?.nhapSo;
    if (!nhapSo) {
      if (!idChon) setKq({ ok: false, message: t('dangKyNhanHang.cayHang.chuaChonPhieu') });
      return;
    }
    const so = nhapSo.doc(raw);
    if (so == null) {
      setLoiSo(nhapSo.loi);
      return;
    }
    setDangGhi(true);
    try {
      const ket = await nhapSo.ghi(so);
      if (!ket.ok) {
        setKq({ ok: false, message: ket.message });
        return;
      }
      if (ket.canhBao) toast.warning(ket.message);
      else toast.success(ket.message);
      void lamMoiSauQuet();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDangGhi(false);
    }
  };

  const loiChon = kq && !kq.ok ? kq.message : undefined;
  // message của bước kiểm tra = "tên cây — cảnh báo…"; chỉ hiện phần cảnh báo.
  const canhBao = kq?.ok && kq.canhBao ? kq.message.split(' — ').slice(1).join(' — ') : null;

  return (
    <GenericDrawer
      title={t('dangKyNhanHang.cayHang.themTayTitle')}
      subtitle={t('dangKyNhanHang.cayHang.themTaySubtitle')}
      icon={<ListPlus className="text-primary" size={20} />}
      onClose={onClose}
      isDirty={idChon != null}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.COMPACT}
      footer={
        <FormDrawerFooter
          formId={formId}
          onCancel={onClose}
          isEdit
          isLoading={dangGhi || dangKiem}
          saveLabel={t('common.save')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form id={formId} className="space-y-3 pb-2" onSubmit={onSubmit}>
        <Combobox
          label={t('dangKyNhanHang.cayHang.phieuQc')}
          placeholder={isLoading ? t('dangKyNhanHang.loading') : t('dangKyNhanHang.cayHang.chonPhieuQc')}
          searchPlaceholder={t('dangKyNhanHang.cayHang.timPhieuQc')}
          options={options}
          value={idChon}
          onChange={(v) => void chon(v)}
          error={loiChon}
          required
        />

        {canhBao && (
          <p className="flex items-start gap-1.5 text-sm text-amber-700 dark:text-amber-400 m-0">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            {canhBao}
          </p>
        )}

        {kq?.nhapSo && (
          <Input
            label={kq.nhapSo.nhan}
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setLoiSo(undefined);
            }}
            onFocus={(e) => e.target.select()}
            inputMode="numeric"
            required
            error={loiSo}
            className="text-right tabular-nums font-semibold"
          />
        )}
      </form>
    </GenericDrawer>
  );
};

export default ThemCayHangTayDialog;
