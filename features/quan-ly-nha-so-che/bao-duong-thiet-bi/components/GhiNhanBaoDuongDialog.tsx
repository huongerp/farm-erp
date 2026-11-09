import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, ClipboardCheck, Eye } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import MultiImageInput, { type ImageItem } from '../../../../components/ui/MultiImageInput';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import { useAuthStore } from '../../../../store/useStore';
import { useEmployeesRefQuery } from '../../../../lib/hooks/use-ref-queries';
import { uploadAnh } from '../../../../lib/media-upload';
import { cn, getTodayISO } from '../../../../lib/utils';
import { KET_QUA_BAO_DUONG, type KetQuaBaoDuong } from '../core/types';
import type { LichBaoDuongRow } from '../core/list-types';
import { useCreateNhatKy } from '../hooks/use-bao-duong-thiet-bi';

interface Props {
  row: LichBaoDuongRow;
  onClose: () => void;
}

const KQ_CAU_HINH: Record<KetQuaBaoDuong, { icon: React.ReactNode; cls: string }> = {
  hoan_thanh: { icon: <CheckCircle2 size={20} />, cls: 'bg-emerald-600 border-emerald-600 text-white' },
  can_theo_doi: { icon: <Eye size={20} />, cls: 'bg-amber-500 border-amber-500 text-white' },
  can_sua_chua: { icon: <AlertTriangle size={20} />, cls: 'bg-rose-600 border-rose-600 text-white' },
};

/** Dialog ghi nhận một lần bảo dưỡng — kết quả 3 nút to, người thực hiện mặc định là tôi, ảnh nhiều. */
const GhiNhanBaoDuongDialog: React.FC<Props> = ({ row, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { data: employees = [] } = useEmployeesRefQuery();
  const luu = useCreateNhatKy(() => onClose());

  const [ngayThucHien, setNgayThucHien] = useState(getTodayISO());
  const [ketQua, setKetQua] = useState<KetQuaBaoDuong>('hoan_thanh');
  const [noiDung, setNoiDung] = useState('');
  const [idNguoiThucHien, setIdNguoiThucHien] = useState<string>(user?.id ?? '');
  const [anh, setAnh] = useState<ImageItem[]>([]);
  const [dangTai, setDangTai] = useState(0);
  const [loi, setLoi] = useState<string | null>(null);

  const upload = useCallback(async (file: File) => {
    setDangTai((n) => n + 1);
    try {
      return await uploadAnh(file, 'giam-sat-chat-luong');
    } finally {
      setDangTai((n) => n - 1);
    }
  }, []);

  const nhanVienOptions = useMemo(() => {
    const opts = [{ value: '', label: t('baoDuongThietBi.ghiNhan.khongChon') }];
    const ds = employees.map((e) => ({ value: e.id, label: `${e.ma_nhan_vien} — ${e.ho_ten}` }));
    return opts.concat(ds);
  }, [employees, t]);

  const submit = () => {
    if (!ngayThucHien) {
      setLoi(t('baoDuongThietBi.ghiNhan.ngayLoi'));
      return;
    }
    luu.mutate({
      id_viec: row.id,
      ngay_thuc_hien: ngayThucHien,
      ket_qua: ketQua,
      noi_dung: noiDung.trim() || null,
      hinh_anh: anh.map((x) => x.src),
      id_nguoi_thuc_hien: idNguoiThucHien || null,
    });
  };

  const khoaLuu = luu.isPending || dangTai > 0;

  return (
    <GenericDrawer
      title={t('baoDuongThietBi.ghiNhan.tieuDe')}
      subtitle={[row.thiet_bi_ten, row.noi_dung].filter(Boolean).join(' · ')}
      icon={<ClipboardCheck className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.MEDIUM}
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={luu.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="button" size="sm" onClick={submit} disabled={khoaLuu}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          type="date"
          label={t('baoDuongThietBi.ghiNhan.ngayThucHien')}
          required
          value={ngayThucHien}
          onChange={(e) => {
            setNgayThucHien(e.target.value);
            setLoi(null);
          }}
          error={loi ?? undefined}
        />

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
            {t('baoDuongThietBi.ghiNhan.ketQua')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {KET_QUA_BAO_DUONG.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKetQua(k)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 rounded-xl border py-3 text-sm font-semibold active:scale-95 transition-all',
                  ketQua === k ? KQ_CAU_HINH[k].cls : 'bg-background border-border text-muted-foreground hover:bg-muted'
                )}
              >
                {KQ_CAU_HINH[k].icon}
                <span className="leading-tight text-center px-1">{t(`baoDuongThietBi.ketQua.${k}`)}</span>
              </button>
            ))}
          </div>
        </div>

        <Textarea label={t('baoDuongThietBi.ghiNhan.noiDung')} value={noiDung} onChange={(e) => setNoiDung(e.target.value)} rows={2} />

        <Select
          label={t('baoDuongThietBi.ghiNhan.nguoiThucHien')}
          value={idNguoiThucHien}
          onChange={(e) => setIdNguoiThucHien(e.target.value)}
          options={nhanVienOptions}
        />

        <div className="space-y-1.5 border-t border-border pt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('baoDuongThietBi.ghiNhan.anh')}
          </div>
          <MultiImageInput
            value={anh}
            onChange={setAnh}
            uploadFile={upload}
            maxFiles={10}
            columns={3}
            placeholder={t('baoDuongThietBi.ghiNhan.anhPlaceholder')}
            hint={t('baoDuongThietBi.ghiNhan.anhHint')}
          />
        </div>
      </div>
    </GenericDrawer>
  );
};

export default GhiNhanBaoDuongDialog;
