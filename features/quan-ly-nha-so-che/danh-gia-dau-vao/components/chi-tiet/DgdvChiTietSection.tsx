/**
 * Bảng con «Chi tiết đánh giá» trong Detail phiếu (khuôn `GenericSubTableSection` + `SubTable`): mỗi dòng
 * = một ô lưới (lô × dây × ngày × dòng) hoặc đứt dây của lô × ngày. Thêm / Sửa / Xoá từng dòng, Import Excel.
 * Lưới ngang ở trên chỉ để xem — mọi số nhập ở đây.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { ClipboardList, Edit, Trash2, Upload } from 'lucide-react';
import GenericSubTableSection from '../../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../../components/shared/sub-table/SubTable';
import SubTableActionButton from '../../../../../components/shared/sub-table/SubTableActionButton';
import SubTableSearchBox from '../../../../../components/shared/sub-table/SubTableSearchBox';
import Button from '../../../../../components/ui/Button';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { foldVi } from '../../../../../lib/search-text';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../../lib/utils';
import type { DgdvPhieuDayDu } from '../../core/types';
import { dongPhangCuaPhieu, tongDongPhang, type DgdvDongPhang } from '../../core/chi-tiet-dong';
import { cacNgayCuaTuan } from '../../core/tuan';
import { nhanCotDay } from '../../core/bang-tinh';
import { styleTieuDeCot } from '../../utils/mau-day';
import { useXoaDongDgdv } from '../../hooks/use-danh-gia-dau-vao';
import { useMauDay } from '../../hooks/use-danh-muc-dgdv';
import DgdvDongForm from './DgdvDongForm';

interface Props {
  phieu: DgdvPhieuDayDu;
  /** Được thêm / sửa / xoá dòng (phiếu mở + có quyền). */
  canNhap: boolean;
  /** Ngày đang chọn ở chip lưới phía trên — mặc định lọc theo ngày này. */
  ngayDangChon: string;
  onImport?: () => void;
}

const CA_TUAN = 'tuan';

const DgdvChiTietSection: React.FC<Props> = ({ phieu, canNhap, ngayDangChon, onImport }) => {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const xoa = useXoaDongDgdv();
  const { mauTheoId } = useMauDay();
  const [loc, setLoc] = useState<string>(CA_TUAN);
  const [tim, setTim] = useState('');
  const [dangSua, setDangSua] = useState<DgdvDongPhang | 'moi' | null>(null);

  const cacNgay = useMemo(() => cacNgayCuaTuan(phieu.nam, phieu.tuan), [phieu.nam, phieu.tuan]);
  const tatCa = useMemo(() => dongPhangCuaPhieu(phieu), [phieu]);
  const cotTheoId = useMemo(() => new Map(phieu.cot.map((c) => [c.id, c])), [phieu.cot]);
  const nhanDay = (r: DgdvDongPhang) => {
    const c = r.id_cot ? cotTheoId.get(r.id_cot) : undefined;
    return c ? nhanCotDay(c, mauTheoId, t('danhGiaDauVao.luoi.xeDoi')) : t('danhGiaDauVao.luoi.dutDay');
  };

  const theoNgay = loc === CA_TUAN ? tatCa : tatCa.filter((r) => r.ngay === loc);
  /** Tìm trên mọi cột đang hiện, bỏ dấu; nhiều từ thì phải có đủ. */
  const tu = foldVi(tim.trim().toLowerCase()).split(/\s+/).filter(Boolean);
  const khop = (r: DgdvDongPhang) => {
    const chu = foldVi(
      [formatYmdToDisplay(r.ngay), r.ten_lo, r.to_truong, nhanDay(r), r.so_luong, r.danh_gia, r.so_luong_loi, r.ly_do_loi]
        .filter((x) => x != null && x !== '')
        .join(' ')
        .toLowerCase()
    );
    return tu.every((w) => chu.includes(w));
  };
  const hien = tu.length > 0 ? theoNgay.filter(khop) : theoNgay;
  const tong = tongDongPhang(hien);

  const columns: SubTableColumn[] = [
    { id: 'ngay', label: t('danhGiaDauVao.luoi.ngay'), width: 96, minWidth: 80, mobile: 'badge' },
    { id: 'lo', label: t('danhGiaDauVao.form.lo'), width: 110, minWidth: 80, sticky: true, mobile: 'title' },
    { id: 'to_truong', label: t('danhGiaDauVao.form.toTruong'), width: 150, minWidth: 100 },
    { id: 'day', label: t('danhGiaDauVao.chiTiet.colDay'), width: 170, minWidth: 110 },
    { id: 'so_luong', label: t('danhGiaDauVao.luoi.colSoLuong'), width: 90, minWidth: 70, align: 'right' },
    { id: 'danh_gia', label: t('danhGiaDauVao.luoi.colDanhGia'), width: 150, minWidth: 100 },
    { id: 'so_luong_loi', label: t('danhGiaDauVao.luoi.colSlLoi'), width: 80, minWidth: 64, align: 'right' },
    { id: 'ly_do_loi', label: t('danhGiaDauVao.luoi.colLyDoLoi'), width: 150, minWidth: 100 },
  ];

  const renderCell = (colId: string, r: DgdvDongPhang) => {
    switch (colId) {
      case 'ngay': {
        const i = cacNgay.indexOf(r.ngay);
        return (
          <span className="tabular-nums text-sm">
            {i >= 0 ? `${t(`danhGiaDauVao.thu.${i}`)} · ` : ''}
            {formatYmdToDisplay(r.ngay).slice(0, 5)}
          </span>
        );
      }
      case 'lo':
        return <span className="text-sm font-medium">{r.ten_lo ?? '—'}</span>;
      case 'to_truong':
        return <span className="text-sm">{r.to_truong ?? '—'}</span>;
      case 'day': {
        const c = r.id_cot ? cotTheoId.get(r.id_cot) : undefined;
        const m1 = c ? mauTheoId.get(c.id_mau_1)?.ma_mau ?? null : null;
        const m2 = c?.id_mau_2 ? mauTheoId.get(c.id_mau_2)?.ma_mau ?? null : null;
        return c ? (
          <span className="inline-flex rounded-md px-2 py-0.5 text-xs font-semibold whitespace-nowrap" style={styleTieuDeCot(m1, m2)}>
            {nhanDay(r)}
          </span>
        ) : (
          <span className="inline-flex rounded-md px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">{nhanDay(r)}</span>
        );
      }
      case 'so_luong':
        return <span className="tabular-nums text-sm font-medium">{formatNumberVN(r.so_luong)}</span>;
      case 'danh_gia':
        return <span className="text-sm">{r.danh_gia ?? ''}</span>;
      case 'so_luong_loi':
        return (
          <span className={cn('tabular-nums text-sm', r.so_luong_loi > r.so_luong && 'text-rose-600 font-semibold')}>
            {r.so_luong_loi ? formatNumberVN(r.so_luong_loi) : ''}
          </span>
        );
      case 'ly_do_loi':
        return <span className="text-sm">{r.ly_do_loi ?? ''}</span>;
      default:
        return null;
    }
  };

  const hoiXoa = (r: DgdvDongPhang) =>
    confirm({
      title: t('danhGiaDauVao.chiTiet.xoaTitle'),
      message: t('danhGiaDauVao.chiTiet.xoaMessage', { lo: r.ten_lo ?? '', day: nhanDay(r), ngay: formatYmdToDisplay(r.ngay) }),
      variant: 'danger',
      confirmText: t('common.delete'),
      onConfirm: async () => {
        await xoa.mutateAsync(r);
      },
    });

  const chip = (value: string, label: string, so: number) => (
    <button
      key={value}
      type="button"
      onClick={() => setLoc(value)}
      className={cn(
        'h-8 px-3 rounded-lg border text-xs font-medium tabular-nums whitespace-nowrap',
        loc === value ? 'bg-primary text-white border-primary' : 'border-border bg-background hover:bg-muted'
      )}
    >
      {label}
      {so > 0 && <span className={cn('ml-1', loc === value ? 'text-white/80' : 'text-muted-foreground')}>({so})</span>}
    </button>
  );

  return (
    <>
      <GenericSubTableSection
        title={t('danhGiaDauVao.chiTiet.title')}
        icon={<ClipboardList size={14} className="text-primary" />}
        count={tatCa.length}
        addLabel={canNhap ? t('danhGiaDauVao.chiTiet.themDong') : undefined}
        onAdd={canNhap && phieu.lo.length > 0 ? () => setDangSua('moi') : undefined}
        headerActions={
          canNhap && onImport ? (
            <Button type="button" size="sm" variant="outline" onClick={onImport} className="min-h-[44px] h-8 sm:h-8 px-3 shrink-0">
              <Upload size={14} className="mr-1.5" />
              {t('danhGiaDauVao.import.nut')}
            </Button>
          ) : undefined
        }
        contentMode="raw"
        emptyTitle={t('danhGiaDauVao.chiTiet.empty')}
        emptyDescription={canNhap ? t('danhGiaDauVao.chiTiet.emptyHint') : undefined}
      >
        {tatCa.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {chip(CA_TUAN, t('danhGiaDauVao.chiTiet.caTuan'), tatCa.length)}
              {cacNgay.map((d, i) =>
                chip(d, `${t(`danhGiaDauVao.thu.${i}`)} · ${formatYmdToDisplay(d).slice(0, 5)}`, tatCa.filter((r) => r.ngay === d).length)
              )}
            </div>
            <SubTableSearchBox value={tim} onChange={setTim} shown={hien.length} total={theoNgay.length} />
            <SubTable
              tableKey="danh-gia-dau-vao.chi-tiet"
              columns={columns}
              rows={hien}
              keyExtractor={(r) => r.key}
              renderCell={renderCell}
              renderActions={
                canNhap
                  ? (r) => (
                      <div className="flex items-center justify-end gap-1">
                        <SubTableActionButton label={t('common.edit')} icon={<Edit size={14} />} onClick={() => setDangSua(r)} primary />
                        <SubTableActionButton tone="danger" label={t('common.delete')} icon={<Trash2 size={14} />} onClick={() => hoiXoa(r)} />
                      </div>
                    )
                  : undefined
              }
              actionsWidth={84}
              onRowClick={canNhap ? (r) => setDangSua(r) : undefined}
              onMobileCardClick={canNhap ? (r) => setDangSua(r) : undefined}
              rowClassName={(r) => (r.loai === 'dut_day' ? 'bg-muted/40' : undefined)}
              emptyContent={<p className="py-4 text-center text-sm text-muted-foreground m-0">{t('danhGiaDauVao.chiTiet.khongCoDongLoc')}</p>}
              maxHeight="420px"
            />
            <div className="flex flex-wrap justify-end gap-x-4 text-sm">
              <span>
                {t('danhGiaDauVao.chiTiet.tongSoLuong')}{' '}
                <span className="font-bold tabular-nums text-primary">{formatNumberVN(tong.soLuong)}</span>
              </span>
              <span>
                {t('danhGiaDauVao.chiTiet.tongLoi')} <span className="font-bold tabular-nums text-rose-600">{formatNumberVN(tong.soLuongLoi)}</span>
              </span>
            </div>
          </div>
        )}
      </GenericSubTableSection>

      <AnimatePresence>
        {dangSua && (
          <DgdvDongForm
            phieu={phieu}
            dong={dangSua === 'moi' ? null : dangSua}
            ngayMacDinh={loc === CA_TUAN ? ngayDangChon : loc}
            onClose={() => setDangSua(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default DgdvChiTietSection;
