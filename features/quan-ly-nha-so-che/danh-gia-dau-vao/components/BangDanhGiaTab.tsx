/**
 * Tab «Tổng hợp ngày» (id `bang`) — CHỈ XEM: mỗi ngày × chi nhánh một khối lưới lô × dây đã CỘNG MỌI CHUYẾN
 * (`gopChuyen`, dây gom theo màu / xé đôi / tuần thu hoạch). Đầu khối: số chuyến + tổng thu / KSC từng chuyến
 * (bấm để mở Detail phiếu chuyến đó — có Xuất Excel) + % KSC. Toolbar chuẩn `DashboardToolbar`: khoảng ngày +
 * chi nhánh, In / Xuất Excel (đều dùng lưới đã gộp). Nhập / sửa số ở Detail phiếu (bảng «Chi tiết đánh giá»).
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Building2, Calendar, ExternalLink, FileSpreadsheet, Lock, Printer } from 'lucide-react';
import DashboardToolbar from '../../../../components/shared/DashboardToolbar';
import ResponsiveFilterChips, { type FilterChipItem } from '../../../../components/shared/ResponsiveFilterChips';
import EmptyState from '../../../../components/shared/EmptyState';
import DateRangePicker, { type DateRangeValue } from '../../../../components/ui/DateRangePicker';
import { MobileFilterField, type FilterGroup } from '../../../../components/ui/MobileFilterSheet';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import { formatNumberVN, formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import { TRANG_THAI } from '../../../../lib/constants';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useDgdvById, useDgdvTheoKhoang } from '../hooks/use-danh-gia-dau-vao';
import { useDgdvPermissions, useDgdvViewScope } from '../hooks/use-danh-gia-dau-vao-permissions';
import { useDungLuoi } from '../hooks/use-dung-luoi';
import { useDgdvXuatChiTiet } from '../hooks/use-dgdv-xuat-chi-tiet';
import type { DgdvLuoiNgay } from '../core/bang-tinh';
import { nhanTiLeKsc } from '../utils/export-danh-sach';
import { chuanHoaKhoang, khoangNhanh, kieuCuaKhoang, type KieuKhoangNhanh } from '../utils/khoang-ngay';
import { getDgdvPreviewUrl } from '../utils/preview-url';
import { taiXlsxLuoi } from '../utils/export-luoi';
import DgdvLuoiNgayTable from './luoi/DgdvLuoiNgayTable';
import DgdvDetail from './DgdvDetail';

const KIEU_NHANH: KieuKhoangNhanh[] = ['hom-nay', 'tuan-nay', 'tuan-truoc'];
const KHOA_NHAN_NHANH: Record<KieuKhoangNhanh, string> = {
  'hom-nay': 'danhGiaDauVao.bang.homNay',
  'tuan-nay': 'danhGiaDauVao.bang.tuanNay',
  'tuan-truoc': 'danhGiaDauVao.bang.tuanTruoc',
};
const TUY_CHON = 'tuy-chon';

/** Đầu khối tổng ngày: «2 chuyến · [C1: 320] [C2: 410] · % KSC 2,5%» — bấm một chuyến mở phiếu đó. */
const CacChuyenDauKhoi: React.FC<{ luoi: DgdvLuoiNgay; onMo: (idPhieu: string) => void }> = ({ luoi, onMo }) => {
  const { t } = useTranslation();
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted-foreground">{t('danhGiaDauVao.bang.soChuyen', { n: luoi.dsChuyen.length })}</span>
      {luoi.dsChuyen.map((c) => (
        <button
          key={c.id_phieu}
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 font-medium text-primary hover:bg-primary/10"
          title={t('danhGiaDauVao.bang.chuyenTitle', { chuyen: c.chuyen, tongThu: formatNumberVN(c.tongThu), ksc: formatNumberVN(c.ksc) })}
          aria-label={t('danhGiaDauVao.bang.moPhieu', { chuyen: c.chuyen })}
          onClick={() => onMo(c.id_phieu)}
        >
          <ExternalLink size={11} />
          <span className="tabular-nums">{t('danhGiaDauVao.bang.chuyenNhan', { chuyen: c.chuyen, tongThu: formatNumberVN(c.tongThu) })}</span>
          {c.ksc > 0 && (
            <span className="font-normal text-rose-600 tabular-nums">
              · {t('danhGiaDauVao.luoi.ksc')} {formatNumberVN(c.ksc)}
            </span>
          )}
        </button>
      ))}
      <span className="font-medium tabular-nums">
        {t('danhGiaDauVao.bang.tiLeKsc', { tiLe: nhanTiLeKsc(luoi.ksc, luoi.tongThu) })}
      </span>
    </span>
  );
};

const BangDanhGiaTab: React.FC = () => {
  const { t } = useTranslation();
  const homNay = getTodayISO();
  const [khoang, setKhoang] = useState(() => khoangNhanh('hom-nay', homNay));
  const [chonCn, setChonCn] = useState<string[]>([]);
  const [dangXuat, setDangXuat] = useState(false);
  const [moPhieuId, setMoPhieuId] = useState<string | null>(null);

  const viewScope = useDgdvViewScope();
  const { canToggleTrangThai, canNhapLuoi } = useDgdvPermissions();
  const { data: branches = [] } = useBranches();
  const { data: phieuMo } = useDgdvById(moPhieuId ?? undefined);

  /** Chi nhánh trong phạm vi xem (đang dùng). */
  const dsChiNhanh = useMemo(() => {
    const dangDung = branches.filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG);
    if (viewScope.viewAll) return dangDung;
    const cho = new Set(viewScope.allowedBranchIds.map(String));
    return dangDung.filter((b) => cho.has(String(b.id)));
  }, [branches, viewScope.viewAll, viewScope.allowedBranchIds]);

  // Một chi nhánh → lọc ở server; nhiều / tất cả → tải cả phạm vi rồi lọc tại chỗ.
  const q = useDgdvTheoKhoang(
    khoang.tu,
    khoang.den,
    chonCn.length === 1 ? chonCn[0] : null,
    viewScope.viewAll,
    viewScope.allowedBranchIds,
    !viewScope.isLoading
  );
  const dsPhieu = useMemo(() => {
    const ds = q.data ?? [];
    if (chonCn.length === 0) return ds;
    const cho = new Set(chonCn);
    return ds.filter((p) => cho.has(p.id_chi_nhanh));
  }, [q.data, chonCn]);
  const { dsKhoi, canhBao } = useDungLuoi(dsPhieu, khoang.tu, khoang.den, true);
  const xuatChiTiet = useDgdvXuatChiTiet();
  const coSo = dsKhoi.some((k) => k.luoi.length > 0);

  // ---- Toolbar ----
  const kieu = kieuCuaKhoang(khoang.tu, khoang.den, homNay);
  const presets = useMemo(
    () => [...KIEU_NHANH.map((k) => ({ id: k, label: t(KHOA_NHAN_NHANH[k]) })), { id: TUY_CHON, label: t('danhGiaDauVao.bang.tuyChon') }],
    [t]
  );
  const rangeValue: DateRangeValue = { preset: kieu ?? TUY_CHON, customStart: khoang.tu, customEnd: khoang.den };
  const doiKhoang = (v: DateRangeValue) => {
    if (v.preset !== TUY_CHON) {
      setKhoang(khoangNhanh(v.preset as KieuKhoangNhanh, homNay));
      return;
    }
    if (!v.customStart || !v.customEnd) return;
    const k = chuanHoaKhoang(v.customStart, v.customEnd);
    if (k.biCat) toast.message(t('danhGiaDauVao.bang.khoangBiCat'));
    setKhoang({ tu: k.tu, den: k.den });
  };
  const nhanKhoang =
    khoang.tu === khoang.den ? formatYmdToDisplay(khoang.tu) : `${formatYmdToDisplay(khoang.tu)} – ${formatYmdToDisplay(khoang.den)}`;

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'branch',
        label: t('danhGiaDauVao.toolbar.filterBranch'),
        icon: Building2,
        options: dsChiNhanh.map((b) => ({ value: String(b.id), label: `${b.ma_chi_nhanh} — ${b.ten_chi_nhanh}` })),
        value: chonCn,
        onChange: setChonCn,
      },
    ],
    [t, dsChiNhanh, chonCn]
  );
  const chonKhoang = (inline: boolean) => (
    <DateRangePicker
      inline={inline}
      presets={presets}
      value={rangeValue}
      onChange={doiKhoang}
      customPresetId={TUY_CHON}
      displayLabel={inline ? undefined : nhanKhoang}
      className={inline ? undefined : 'shrink-0'}
    />
  );
  const filterItems: FilterChipItem[] = [
    { kind: 'custom', key: 'khoang', node: chonKhoang(false) },
    { kind: 'group', group: filterGroups[0], className: 'w-full sm:w-[220px]' },
  ];

  const xuatExcel = async () => {
    setDangXuat(true);
    try {
      const co = await taiXlsxLuoi(dsKhoi, khoang.tu, khoang.den, t);
      if (!co) toast.warning(t('danhGiaDauVao.bang.khongCoDuLieu'));
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDangXuat(false);
    }
  };
  const moIn = () =>
    window.open(getDgdvPreviewUrl(khoang.tu, khoang.den, chonCn.length === 1 ? chonCn[0] : null), '_blank', 'noopener,noreferrer');

  const iconBtn = 'h-9 w-9 p-0 inline-flex items-center justify-center border-border text-muted-foreground hover:bg-muted/50';
  const actions = (
    <div className="flex items-center gap-2">
      <Tooltip content={t('danhGiaDauVao.bang.in')} placement="bottom">
        <Button variant="outline" size="sm" className={iconBtn} disabled={!coSo} onClick={moIn} aria-label={t('danhGiaDauVao.bang.in')}>
          <Printer className="w-4 h-4" />
        </Button>
      </Tooltip>
      <Tooltip content={t('danhGiaDauVao.bang.xuatExcel')} placement="bottom">
        <Button
          variant="outline"
          size="sm"
          className={iconBtn}
          disabled={!coSo || dangXuat}
          onClick={xuatExcel}
          aria-label={t('danhGiaDauVao.bang.xuatExcel')}
        >
          <FileSpreadsheet className="w-4 h-4" />
        </Button>
      </Tooltip>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <DashboardToolbar
        hideBack
        filters={<ResponsiveFilterChips items={filterItems} />}
        filterGroups={filterGroups}
        mobileFilterExtra={
          <MobileFilterField label={t('danhGiaDauVao.bang.khoangNgay')} icon={Calendar} active>
            {chonKhoang(true)}
          </MobileFilterField>
        }
        mobileFilterExtraCount={1}
        activeFilterCount={chonCn.length}
        onClearFilters={() => setChonCn([])}
        actions={actions}
        className="static z-auto border-b border-border"
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-5">
        {q.isPending || viewScope.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('danhGiaDauVao.loading')}</p>
        ) : q.isError ? (
          <p className="text-sm text-rose-600">{(q.error as Error)?.message}</p>
        ) : !coSo ? (
          <EmptyState title={t('danhGiaDauVao.bang.khongCoDuLieu')} description={t('danhGiaDauVao.bang.khongCoDuLieuHint')} />
        ) : (
          dsKhoi.flatMap((khoi) =>
            khoi.luoi.map((luoi) => (
              <section key={`${khoi.ngay}-${luoi.id_phieu}`} className="space-y-1">
                {luoi.trang_thai === 'khoa' && (
                  <p className="text-caption text-amber-700 dark:text-amber-400 m-0 inline-flex items-center gap-1">
                    <Lock size={12} />
                    {t('danhGiaDauVao.bang.phieuDaKhoa')}
                  </p>
                )}
                <DgdvLuoiNgayTable
                  luoi={luoi}
                  canhBao={canhBao}
                  dauKhoiPhu={<CacChuyenDauKhoi luoi={luoi} onMo={setMoPhieuId} />}
                />
              </section>
            ))
          )
        )}
      </div>

      <AnimatePresence>
        {moPhieuId && phieuMo && (
          <DgdvDetail
            data={phieuMo}
            onClose={() => setMoPhieuId(null)}
            canToggleTrangThai={canToggleTrangThai}
            canNhapLuoi={canNhapLuoi(phieuMo)}
            onXuatExcel={() => void xuatChiTiet.xuatPhieu(phieuMo)}
            dangXuat={xuatChiTiet.dangXuat}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BangDanhGiaTab;
