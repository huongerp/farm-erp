import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Save, Settings, Trash2 } from 'lucide-react';
import GenericDrawer from '../../../../../components/shared/GenericDrawer';
import Button from '../../../../../components/ui/Button';
import Input from '../../../../../components/ui/Input';
import Select from '../../../../../components/ui/Select';
import { DIALOG_SIZE } from '../../../../../lib/dialog-sizes';
import { TRANG_THAI } from '../../../../../lib/constants';
import { cn } from '../../../../../lib/utils';
import { useBranches } from '../../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { PHAM_CAP_PRESETS, normalizePhamCapKey } from '../../core/pham-cap';
import { parseHeSo } from '../../core/he-so-quy-doi';
import type { HeSoCaiDatRow } from '../../core/he-so-cai-dat';
import { useCaiDatHeSo, useLuuCaiDatHeSo } from '../../hooks/use-he-so-quy-doi';
import type { CaiDatHeSoDong } from '../../services/he-so-quy-doi.service';

/** Hiện hệ số kiểu Việt: 1.2 → "1,2". */
const hienSo = (v: number | string | null | undefined) =>
  v == null || v === '' ? '' : String(v).replace('.', ',');

type LoaiDong = 'preset' | 'installed' | 'custom';

interface DongNhap {
  /** Khoá cục bộ cho React (tên có thể bị sửa). */
  key: string;
  ten: string;
  heSoText: string;
  loai: LoaiDong;
}

const keyTen = (ten: string) => normalizePhamCapKey(ten);

function buildDong(caiDat: HeSoCaiDatRow[], idChiNhanh: string): DongNhap[] {
  const cuaFarm = caiDat.filter((r) => String(r.id_chi_nhanh) === String(idChiNhanh));
  const heSoTheoTen = new Map<string, number | string>();
  for (const r of cuaFarm) {
    const k = keyTen(r.ten_pham_cap);
    if (k && !heSoTheoTen.has(k)) heSoTheoTen.set(k, r.he_so_quy_doi);
  }
  const presetKeys = new Set(PHAM_CAP_PRESETS.map((p) => keyTen(p.ten)));
  const dong: DongNhap[] = PHAM_CAP_PRESETS.map((p) => ({
    key: `preset:${p.ten}`,
    ten: p.ten,
    heSoText: hienSo(heSoTheoTen.get(keyTen(p.ten))),
    loai: 'preset',
  }));
  for (const r of cuaFarm) {
    const k = keyTen(r.ten_pham_cap);
    if (!k || presetKeys.has(k)) continue;
    presetKeys.add(k);
    dong.push({
      key: `installed:${r.id ?? r.ten_pham_cap}`,
      ten: r.ten_pham_cap,
      heSoText: hienSo(r.he_so_quy_doi),
      loai: 'installed',
    });
  }
  return dong;
}

/** Lưới nhập của MỘT farm — remount khi đổi farm / tải xong để lấy giá trị ban đầu. */
const LuoiHeSo: React.FC<{
  idChiNhanh: string;
  caiDat: HeSoCaiDatRow[];
  coQuyen: boolean;
}> = ({ idChiNhanh, caiDat, coQuyen }) => {
  const { t } = useTranslation();
  const [dong, setDong] = useState<DongNhap[]>(() => buildDong(caiDat, idChiNhanh));
  /** Tên đã có cấu hình trong DB lúc mở (khoá chuẩn hoá → tên gốc) → xoá dòng khỏi lưới phải gửi null. */
  const tenGocTrongDb = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of caiDat) {
      if (String(r.id_chi_nhanh) !== String(idChiNhanh)) continue;
      const k = keyTen(r.ten_pham_cap);
      if (k && !map.has(k)) map.set(k, r.ten_pham_cap);
    }
    return map;
  }, [caiDat, idChiNhanh]);

  const luu = useLuuCaiDatHeSo();
  const soDongCu = dong.length;

  const doi = (key: string, patch: Partial<DongNhap>) =>
    setDong((d) => d.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const xoaDong = (key: string) => setDong((d) => d.filter((r) => r.key !== key));

  const themDong = () =>
    setDong((d) => [
      ...d,
      { key: `custom:${soDongCu}:${Date.now()}`, ten: '', heSoText: '', loai: 'custom' },
    ]);

  /** Dòng sai: tên trống (dòng tự do) hoặc số không đọc được. */
  const dongLoi = useMemo(() => {
    const set = new Set<string>();
    for (const r of dong) {
      if (!r.ten.trim() && r.loai === 'custom' && !r.heSoText.trim()) continue; // dòng trống mới thêm
      if (r.loai === 'custom' && !r.ten.trim()) {
        set.add(r.key);
        continue;
      }
      if (r.heSoText.trim() !== '' && parseHeSo(r.heSoText) == null) set.add(r.key);
    }
    return set;
  }, [dong]);

  const coLoi = dongLoi.size > 0;

  const handleLuu = () => {
    if (!coQuyen || coLoi) return;
    const rows: CaiDatHeSoDong[] = [];
    const guiDi = new Set<string>();
    for (const r of dong) {
      const ten = r.ten.trim();
      if (!ten) continue;
      const k = keyTen(ten);
      if (guiDi.has(k)) continue;
      guiDi.add(k);
      const heSo = r.heSoText.trim() === '' ? null : parseHeSo(r.heSoText);
      rows.push({ ten_pham_cap: ten, he_so_quy_doi: heSo });
    }
    // Dòng đã cài trong DB mà bị xoá khỏi lưới / để trống hệ số → gửi null để xoá cấu hình.
    for (const [k, tenGoc] of tenGocTrongDb) {
      if (!guiDi.has(k)) rows.push({ ten_pham_cap: tenGoc, he_so_quy_doi: null });
    }
    luu.mutate({ idChiNhanh, rows });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground m-0">{t('baoCaoSoChe.caiDatHeSo.goiY')}</p>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Tiêu đề cột */}
        <div className="grid grid-cols-[1fr_7rem_2.5rem] items-center gap-2 border-b border-border bg-muted/40 px-2 py-1.5 text-caption font-medium text-muted-foreground sm:grid-cols-[1fr_7.5rem_2.5rem]">
          <span>{t('baoCaoSoChe.caiDatHeSo.tenPhamCap')}</span>
          <span className="text-right">{t('baoCaoSoChe.caiDatHeSo.heSo')}</span>
          <span aria-hidden />
        </div>
        <div className="divide-y divide-border/70">
          {dong.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              {t('baoCaoSoChe.caiDatHeSo.luoiTrong')}
            </p>
          ) : (
            dong.map((r) => {
              const sai = dongLoi.has(r.key);
              const coTheXoa = coQuyen && r.loai !== 'preset';
              return (
                <div
                  key={r.key}
                  className="grid grid-cols-[1fr_7rem_2.5rem] items-center gap-2 px-2 py-1.5 sm:grid-cols-[1fr_7.5rem_2.5rem]"
                >
                  <Input
                    value={r.ten}
                    onChange={(e) => doi(r.key, { ten: e.target.value })}
                    placeholder={t('baoCaoSoChe.caiDatHeSo.tenPlaceholder')}
                    disabled={!coQuyen || r.loai === 'preset'}
                    className="h-8 text-xs"
                    aria-label={t('baoCaoSoChe.caiDatHeSo.tenPhamCap')}
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={r.heSoText}
                    onChange={(e) => doi(r.key, { heSoText: e.target.value })}
                    placeholder="1"
                    disabled={!coQuyen}
                    className={cn('h-8 px-2 text-right text-xs tabular-nums', sai && 'border-rose-500')}
                    aria-label={`${r.ten || t('baoCaoSoChe.caiDatHeSo.tenPhamCap')} — ${t('baoCaoSoChe.caiDatHeSo.heSo')}`}
                  />
                  <div className="flex justify-center">
                    {coTheXoa ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => xoaDong(r.key)}
                        aria-label={t('baoCaoSoChe.caiDatHeSo.xoaDong')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {coQuyen ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={themDong}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t('baoCaoSoChe.caiDatHeSo.themDong')}
          </Button>
          <div className="flex items-center gap-2">
            {coLoi && (
              <span className="text-xs text-rose-600">{t('baoCaoSoChe.caiDatHeSo.loiNhap')}</span>
            )}
            <Button
              type="button"
              size="sm"
              disabled={coLoi || luu.isPending}
              onClick={handleLuu}
            >
              <Save size={14} className="mr-1.5" />
              {t('common.save')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

interface Props {
  canAdmin: boolean;
  onClose: () => void;
}

/**
 * Cài đặt hệ số quy đổi theo farm × phẩm cấp. Form phiếu đọc bảng này để tự điền;
 * farm thường không phải chọn hệ số nữa. Chỉ quản trị mở / sửa.
 */
const HeSoQuyDoiDialog: React.FC<Props> = ({ canAdmin, onClose }) => {
  const { t } = useTranslation();
  const { data: branches = [], isLoading } = useBranches();
  const farmOptions = useMemo(
    () =>
      branches
        .filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG)
        .map((b) => ({ value: b.id, label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` })),
    [branches]
  );
  const [chon, setChon] = useState('');
  const idChiNhanh = chon || farmOptions[0]?.value || '';
  const { data: caiDat = [], isPending, dataUpdatedAt } = useCaiDatHeSo(canAdmin);

  return (
    <GenericDrawer
      title={t('baoCaoSoChe.caiDatHeSo.title')}
      subtitle={t('baoCaoSoChe.caiDatHeSo.subtitle')}
      icon={<Settings className="text-primary" size={22} />}
      onClose={onClose}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.LARGE}
      footer={
        <div className="flex justify-end w-full">
          <Button type="button" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t('baoCaoSoChe.loading')}</p>
        ) : farmOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('baoCaoSoChe.caiDatHeSo.chuaCoFarm')}</p>
        ) : (
          <>
            <div className="sm:max-w-sm">
              <Select
                label={t('baoCaoSoChe.caiDatHeSo.farm')}
                options={farmOptions}
                value={idChiNhanh}
                onChange={(e) => setChon(e.target.value)}
                disabled={!canAdmin}
              />
            </div>
            {!canAdmin ? (
              <p className="text-xs text-muted-foreground m-0">{t('baoCaoSoChe.caiDatHeSo.chiAdmin')}</p>
            ) : null}
            {isPending ? (
              <p className="text-sm text-muted-foreground">{t('baoCaoSoChe.loading')}</p>
            ) : idChiNhanh ? (
              <LuoiHeSo
                key={`${idChiNhanh}-${dataUpdatedAt}`}
                idChiNhanh={idChiNhanh}
                caiDat={caiDat}
                coQuyen={canAdmin}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t('baoCaoSoChe.caiDatHeSo.chuaChonFarm')}</p>
            )}
          </>
        )}
      </div>
    </GenericDrawer>
  );
};

export default HeSoQuyDoiDialog;
