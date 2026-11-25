import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Save, Target } from 'lucide-react';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import { cn, formatDate, formatNumberVN, getTodayISO } from '../../../../../lib/utils';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { parseHeSo } from '../../core/he-so-quy-doi';
import { BCSC_KPI_THUONG_PRESETS } from '../../core/kpi-thuong-presets';
import { banCaiDatCuaFarm, mucTieuKpiTheoNgay } from '../../core/kpi-muc-tieu-cai-dat';
import { useKpiMucTieuCaiDat, useLuuKpiMucTieu } from '../../hooks/use-kpi-muc-tieu';
import { demPhieuAnhHuong } from '../../services/kpi-muc-tieu.service';

const hienSo = (v: number | null | undefined) => (v == null ? '' : String(v).replace('.', ','));

/** Ô trống = không cài dòng đó (null); sai / ≤ 0 = undefined (lỗi nhập). */
function docMucTieu(text: string): number | null | undefined {
  if (text.trim() === '') return null;
  const n = parseHeSo(text);
  return n != null && n > 0 ? n : undefined;
}

interface Props {
  idChiNhanh: string;
  /** Mọi farm đang dùng — cho ô «Áp dụng cho tất cả farm». */
  tatCaFarmIds: string[];
  tenFarm: (id: string) => string;
  /** Chỉ super admin (`is_super_admin`) mới sửa. */
  coQuyen: boolean;
}

/**
 * Mục tiêu KPI theo farm × ngày hiệu lực (dòng Năng suất sơ chế, Tỷ lệ nải chuỗi lỗi).
 * Lưu → ghi bản cài đặt + tính lại các phiếu đã lưu trong khoảng hiệu lực (hỏi xác nhận kèm số phiếu).
 */
const KpiMucTieuSection: React.FC<Props> = ({ idChiNhanh, tatCaFarmIds, tenFarm, coQuyen }) => {
  const { t } = useTranslation();
  const k = (s: string, o?: Record<string, unknown>) => t(`baoCaoSoChe.caiDatKpi.${s}`, o);
  const { data: caiDat = [], isPending } = useKpiMucTieuCaiDat();
  const luu = useLuuKpiMucTieu();
  const confirm = useConfirmStore((s) => s.confirm);

  const homNay = getTodayISO();
  const dangApDung = useMemo(() => mucTieuKpiTheoNgay(caiDat, idChiNhanh, homNay), [caiDat, idChiNhanh, homNay]);
  const lichSu = useMemo(() => [...banCaiDatCuaFarm(caiDat, idChiNhanh)].reverse(), [caiDat, idChiNhanh]);

  const [nangSuatText, setNangSuatText] = useState<string | null>(null);
  const [loiText, setLoiText] = useState<string | null>(null);
  const [apDungTu, setApDungTu] = useState(homNay);
  const [tatCaFarm, setTatCaFarm] = useState(false);
  const [dangDem, setDangDem] = useState(false);

  // Chưa gõ gì → hiện mục tiêu đang áp của farm (đổi farm thì tự đổi theo).
  const nsText = nangSuatText ?? hienSo(dangApDung?.nangSuat);
  const lText = loiText ?? hienSo(dangApDung?.loi);
  const ns = docMucTieu(nsText);
  const loi = docMucTieu(lText);
  const loiNs = ns === undefined;
  const loiLoi = loi === undefined;
  const thieuSo = ns == null && loi == null;
  const coLoi = loiNs || loiLoi || thieuSo || !apDungTu;

  const handleLuu = async () => {
    if (!coQuyen || coLoi || ns === undefined || loi === undefined) return;
    const farmIds = tatCaFarm ? tatCaFarmIds : [idChiNhanh];
    setDangDem(true);
    let soPhieu: number;
    try {
      soPhieu = await demPhieuAnhHuong(caiDat, farmIds, apDungTu);
    } catch (e) {
      toast.error((e as Error).message);
      return;
    } finally {
      setDangDem(false);
    }
    confirm({
      title: k('xacNhanTitle'),
      variant: 'warning',
      message: k('xacNhanMessage', {
        farm: tatCaFarm ? k('tatCaFarmSo', { so: farmIds.length }) : tenFarm(idChiNhanh),
        ngay: formatDate(apDungTu),
        soPhieu,
      }),
      confirmText: k('xacNhanNut'),
      onConfirm: async () => {
        await luu.mutateAsync({ caiDat, idChiNhanhList: farmIds, apDungTu, nangSuat: ns, loi });
        setNangSuatText(null);
        setLoiText(null);
      },
    });
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center gap-2">
        <Target size={16} className="text-primary" aria-hidden />
        <h3 className="m-0 text-sm font-semibold">{k('title')}</h3>
      </div>
      <p className="m-0 text-xs text-muted-foreground">{k('goiY')}</p>
      {!coQuyen ? <p className="m-0 text-xs text-muted-foreground">{k('chiSuperAdmin')}</p> : null}

      {isPending ? (
        <p className="text-sm text-muted-foreground">{t('baoCaoSoChe.loading')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label={`${BCSC_KPI_THUONG_PRESETS[0].ten_hang_muc} (${BCSC_KPI_THUONG_PRESETS[0].don_vi_tinh})`}
              inputMode="decimal"
              value={nsText}
              onChange={(e) => setNangSuatText(e.target.value)}
              placeholder="3,5"
              disabled={!coQuyen}
              className={cn('text-right tabular-nums', loiNs && 'border-rose-500')}
            />
            <Input
              label={`${BCSC_KPI_THUONG_PRESETS[1].ten_hang_muc} (${BCSC_KPI_THUONG_PRESETS[1].don_vi_tinh})`}
              inputMode="decimal"
              value={lText}
              onChange={(e) => setLoiText(e.target.value)}
              placeholder="1"
              disabled={!coQuyen}
              className={cn('text-right tabular-nums', loiLoi && 'border-rose-500')}
            />
            <Input
              type="date"
              label={k('apDungTu')}
              value={apDungTu}
              onChange={(e) => setApDungTu(e.target.value)}
              disabled={!coQuyen}
            />
          </div>

          {coQuyen ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={tatCaFarm}
                  onChange={(e) => setTatCaFarm(e.target.checked)}
                />
                {k('tatCaFarm', { so: tatCaFarmIds.length })}
              </label>
              <div className="flex items-center gap-2">
                {loiNs || loiLoi ? <span className="text-xs text-rose-600">{k('loiNhap')}</span> : null}
                <Button
                  type="button"
                  size="sm"
                  disabled={coLoi || luu.isPending || dangDem}
                  onClick={() => void handleLuu()}
                >
                  <Save size={14} className="mr-1.5" />
                  {k('luu')}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 border-b border-border bg-muted/40 px-3 py-1.5 text-caption font-medium text-muted-foreground">
              <span>{k('apDungTu')}</span>
              <span className="text-right">{BCSC_KPI_THUONG_PRESETS[0].ten_hang_muc}</span>
              <span className="text-right">{BCSC_KPI_THUONG_PRESETS[1].ten_hang_muc}</span>
            </div>
            {lichSu.length === 0 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">{k('chuaCai')}</p>
            ) : (
              <div className="divide-y divide-border/70">
                {lichSu.map((r) => {
                  const dangAp = dangApDung?.apDungTu === String(r.ap_dung_tu).slice(0, 10);
                  return (
                    <div
                      key={String(r.id ?? r.ap_dung_tu)}
                      className={cn('grid grid-cols-[1fr_1fr_1fr] gap-2 px-3 py-1.5 text-xs tabular-nums', dangAp && 'bg-primary/5 font-medium')}
                    >
                      <span>
                        {formatDate(r.ap_dung_tu)}
                        {dangAp ? <span className="ml-1.5 text-primary">· {k('dangApDung')}</span> : null}
                      </span>
                      <span className="text-right">{r.muc_tieu_nang_suat != null ? formatNumberVN(Number(r.muc_tieu_nang_suat)) : '—'}</span>
                      <span className="text-right">{r.muc_tieu_loi != null ? formatNumberVN(Number(r.muc_tieu_loi)) : '—'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default KpiMucTieuSection;
