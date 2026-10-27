/**
 * Tab «Bảng đánh giá»: lưới ngang theo khoảng ngày (mặc định Hôm nay) + chi nhánh. Mỗi ngày một khối
 * xếp dọc, gõ trực tiếp — tự lưu. Ngày chưa có phiếu tuần → thông báo + nút «Tạo phiếu tuần».
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { FileSpreadsheet, Lock, Plus, Printer } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import { cn, formatYmdToDisplay, getTodayISO } from '../../../../lib/utils';
import { TRANG_THAI } from '../../../../lib/constants';
import { useBranches } from '../../../he-thong/chi-nhanh/hooks/use-chi-nhanh';
import { useDgdvTheoKhoang } from '../hooks/use-danh-gia-dau-vao';
import { useLyDoDgdv } from '../hooks/use-danh-muc-dgdv';
import { useDgdvPermissions, useDgdvViewScope } from '../hooks/use-danh-gia-dau-vao-permissions';
import { useDungLuoi } from '../hooks/use-dung-luoi';
import { tuanIsoCuaNgay } from '../core/tuan';
import type { DgdvFormValues } from '../core/schema';
import { chuanHoaKhoang, khoangNhanh, kieuCuaKhoang, type KieuKhoangNhanh } from '../utils/khoang-ngay';
import { getDgdvPreviewUrl } from '../utils/preview-url';
import { taiXlsxLuoi } from '../utils/export-luoi';
import DgdvLuoiNgayTable from './luoi/DgdvLuoiNgayTable';
import DgdvForm from './DgdvForm';

const KIEU_NHANH: KieuKhoangNhanh[] = ['hom-nay', 'tuan-nay', 'tuan-truoc'];
const KHOA_NHAN_NHANH: Record<KieuKhoangNhanh, string> = {
  'hom-nay': 'danhGiaDauVao.bang.homNay',
  'tuan-nay': 'danhGiaDauVao.bang.tuanNay',
  'tuan-truoc': 'danhGiaDauVao.bang.tuanTruoc',
};

const BangDanhGiaTab: React.FC = () => {
  const { t } = useTranslation();
  const homNay = getTodayISO();
  const [khoang, setKhoang] = useState(() => khoangNhanh('hom-nay', homNay));
  const [chonCn, setChonCn] = useState<string | null>(null);
  const [taoMoi, setTaoMoi] = useState<Partial<DgdvFormValues> | null>(null);
  const [dangXuat, setDangXuat] = useState(false);

  const viewScope = useDgdvViewScope();
  const { canCreate, canNhapLuoi } = useDgdvPermissions();
  const { data: branches = [] } = useBranches();
  const { data: dsLyDo = [] } = useLyDoDgdv();

  /** Chi nhánh trong phạm vi xem (đang dùng). */
  const dsChiNhanh = useMemo(() => {
    const dangDung = branches.filter((b) => b.trang_thai === TRANG_THAI.DANG_DUNG);
    if (viewScope.viewAll) return dangDung;
    const cho = new Set(viewScope.allowedBranchIds.map(String));
    return dangDung.filter((b) => cho.has(String(b.id)));
  }, [branches, viewScope.viewAll, viewScope.allowedBranchIds]);
  const idChiNhanh = chonCn ?? dsChiNhanh[0]?.id ?? null;

  const q = useDgdvTheoKhoang(
    khoang.tu,
    khoang.den,
    idChiNhanh,
    viewScope.viewAll,
    viewScope.allowedBranchIds,
    !viewScope.isLoading && !!idChiNhanh
  );
  const dsPhieu = useMemo(() => q.data ?? [], [q.data]);
  const { dsKhoi, canhBao } = useDungLuoi(dsPhieu, khoang.tu, khoang.den);

  const doiKhoang = (tu: string, den: string) => {
    const k = chuanHoaKhoang(tu, den);
    if (k.biCat) toast.message(t('danhGiaDauVao.bang.khoangBiCat'));
    setKhoang({ tu: k.tu, den: k.den });
  };
  const kieu = kieuCuaKhoang(khoang.tu, khoang.den, homNay);

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

  const coPhieu = dsKhoi.some((k) => k.luoi.length > 0);
  /** Tuần đã hiện thông báo «chưa có phiếu» — mỗi tuần chỉ báo một lần. */
  const tuanDaBao = new Set<string>();

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-end gap-2 px-4 py-3 border-b border-border">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {KIEU_NHANH.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKhoang(khoangNhanh(k, homNay))}
              className={cn(
                'h-8 px-3 text-xs font-medium border-r border-border last:border-r-0',
                kieu === k ? 'bg-primary text-white' : 'bg-background hover:bg-muted'
              )}
            >
              {t(KHOA_NHAN_NHANH[k])}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {t('danhGiaDauVao.bang.tuNgay')}
          <input
            type="date"
            className="h-8 rounded-lg border border-border bg-background px-2 text-body-sm text-foreground"
            value={khoang.tu}
            onChange={(e) => e.target.value && doiKhoang(e.target.value, khoang.den)}
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {t('danhGiaDauVao.bang.denNgay')}
          <input
            type="date"
            className="h-8 rounded-lg border border-border bg-background px-2 text-body-sm text-foreground"
            value={khoang.den}
            onChange={(e) => e.target.value && doiKhoang(khoang.tu, e.target.value)}
          />
        </label>
        <select
          className="h-8 rounded-lg border border-border bg-background px-2 text-body-sm min-w-[12rem]"
          value={idChiNhanh ?? ''}
          onChange={(e) => setChonCn(e.target.value || null)}
          aria-label={t('danhGiaDauVao.form.branch')}
        >
          {dsChiNhanh.length === 0 && <option value="">{t('danhGiaDauVao.bang.khongCoChiNhanh')}</option>}
          {dsChiNhanh.map((b) => (
            <option key={b.id} value={b.id}>
              {b.ma_chi_nhanh} — {b.ten_chi_nhanh}
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            disabled={!coPhieu}
            onClick={() => window.open(getDgdvPreviewUrl(khoang.tu, khoang.den, idChiNhanh), '_blank', 'noopener,noreferrer')}
          >
            <Printer size={14} className="mr-1.5" />
            {t('danhGiaDauVao.bang.in')}
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-8" disabled={!coPhieu || dangXuat} onClick={xuatExcel}>
            <FileSpreadsheet size={14} className="mr-1.5" />
            {t('danhGiaDauVao.bang.xuatExcel')}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-5">
        {(q.isPending && !!idChiNhanh) || viewScope.isLoading ? (
          <p className="text-sm text-muted-foreground">{t('danhGiaDauVao.loading')}</p>
        ) : q.isError ? (
          <p className="text-sm text-rose-600">{(q.error as Error)?.message}</p>
        ) : (
          dsKhoi.map((khoi) => {
            if (khoi.luoi.length === 0) {
              const tuan = tuanIsoCuaNgay(khoi.ngay);
              const k = `${tuan.nam}-${tuan.tuan}`;
              if (tuanDaBao.has(k)) return null;
              tuanDaBao.add(k);
              return (
                <div
                  key={khoi.ngay}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3"
                >
                  <p className="text-sm m-0">
                    {t('danhGiaDauVao.bang.chuaCoPhieu', { ngay: formatYmdToDisplay(khoi.ngay), tuan: tuan.tuan, nam: tuan.nam })}
                  </p>
                  {canCreate && idChiNhanh && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setTaoMoi({ nam: tuan.nam, tuan: tuan.tuan, id_chi_nhanh: idChiNhanh })}
                    >
                      <Plus size={14} className="mr-1" />
                      {t('danhGiaDauVao.bang.taoPhieuTuan')}
                    </Button>
                  )}
                </div>
              );
            }
            return khoi.luoi.map((luoi) => {
              const editable = canNhapLuoi(luoi);
              return (
                <section key={`${khoi.ngay}-${luoi.id_phieu}`} className="space-y-1">
                  {luoi.trang_thai === 'khoa' && (
                    <p className="text-caption text-amber-700 dark:text-amber-400 m-0 inline-flex items-center gap-1">
                      <Lock size={12} />
                      {t('danhGiaDauVao.luoi.daKhoa')}
                    </p>
                  )}
                  <DgdvLuoiNgayTable luoi={luoi} editable={editable} canhBao={canhBao} dsLyDo={dsLyDo} />
                </section>
              );
            });
          })
        )}
      </div>

      <AnimatePresence>
        {taoMoi && <DgdvForm branches={dsChiNhanh} giaTriMacDinh={taoMoi} onClose={() => setTaoMoi(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default BangDanhGiaTab;
