/**
 * Bảng con «Chi tiết đánh giá» trong Detail phiếu (khuôn `GenericSubTableSection` + `SubTable`): mỗi dòng
 * = một ô lưới (lô × dây × dòng) hoặc đứt dây của lô — mọi dòng cùng ngày của phiếu (1 phiếu = 1 chuyến
 * của một ngày). Bấm dòng LUÔN mở drawer xem dòng (kể cả không có quyền nhập / phiếu khoá); Thêm / Sửa / Xoá
 * từng dòng, «Nhập theo lô», Import Excel khi được nhập. Drawer con do `useDgdvChiTietDrawers` (Detail) giữ.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Edit, Rows3, Trash2, Upload } from 'lucide-react';
import GenericSubTableSection from '../../../../../components/shared/GenericSubTableSection';
import SubTable, { type SubTableColumn } from '../../../../../components/shared/sub-table/SubTable';
import SubTableActionButton from '../../../../../components/shared/sub-table/SubTableActionButton';
import SubTableSearchBox from '../../../../../components/shared/sub-table/SubTableSearchBox';
import Button from '../../../../../components/ui/Button';
import { foldVi } from '../../../../../lib/search-text';
import { cn, formatNumberVN } from '../../../../../lib/utils';
import type { DgdvPhieuDayDu } from '../../core/types';
import { dongPhangCuaPhieu, tongDongPhang, type DgdvDongPhang } from '../../core/chi-tiet-dong';
import { nhanCotDay } from '../../core/bang-tinh';
import { useMauDay } from '../../hooks/use-danh-muc-dgdv';
import { ChipDay } from '../ChipDay';
import TheDongMobile from '../TheDongMobile';
import type { DgdvChiTietMo } from './useDgdvChiTietDrawers';

interface Props {
  phieu: DgdvPhieuDayDu;
  /** Được thêm / sửa / xoá dòng (phiếu mở + có quyền). */
  canNhap: boolean;
  onImport?: () => void;
  mo: DgdvChiTietMo;
}

const nutHeader = 'min-h-[44px] h-8 sm:h-8 px-3 shrink-0';

const DgdvChiTietSection: React.FC<Props> = ({ phieu, canNhap, onImport, mo }) => {
  const { t } = useTranslation();
  const { mauTheoId } = useMauDay();
  const [tim, setTim] = useState('');

  const tatCa = useMemo(() => dongPhangCuaPhieu(phieu), [phieu]);
  const cotTheoId = useMemo(() => new Map(phieu.cot.map((c) => [c.id, c])), [phieu.cot]);
  const nhanDay = (r: DgdvDongPhang) => {
    const c = r.id_cot ? cotTheoId.get(r.id_cot) : undefined;
    return c ? nhanCotDay(c, mauTheoId, t('danhGiaDauVao.luoi.xeDoi')) : t('danhGiaDauVao.luoi.dutDay');
  };

  /** Tìm trên mọi cột đang hiện, bỏ dấu; nhiều từ thì phải có đủ. */
  const tu = foldVi(tim.trim().toLowerCase()).split(/\s+/).filter(Boolean);
  const khop = (r: DgdvDongPhang) => {
    const chu = foldVi(
      [r.ten_lo, r.to_truong, nhanDay(r), r.so_luong, r.danh_gia, r.so_luong_loi, r.ly_do_loi]
        .filter((x) => x != null && x !== '')
        .join(' ')
        .toLowerCase()
    );
    return tu.every((w) => chu.includes(w));
  };
  const hien = tu.length > 0 ? tatCa.filter(khop) : tatCa;
  const tong = tongDongPhang(hien);
  const coKhung = phieu.lo.length > 0 && phieu.cot.length > 0;

  const columns: SubTableColumn[] = [
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
      case 'lo':
        return <span className="text-sm font-medium">{r.ten_lo ?? '—'}</span>;
      case 'to_truong':
        return <span className="text-sm">{r.to_truong ?? '—'}</span>;
      case 'day':
        return <ChipDay cot={r.id_cot ? (cotTheoId.get(r.id_cot) ?? null) : null} mauTheoId={mauTheoId} />;
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

  return (
    <GenericSubTableSection
      title={t('danhGiaDauVao.chiTiet.title')}
      icon={<ClipboardList size={14} className="text-primary" />}
      count={tatCa.length}
      addLabel={canNhap ? t('danhGiaDauVao.chiTiet.themDong') : undefined}
      onAdd={canNhap && coKhung ? mo.themDong : undefined}
      headerActions={
        canNhap ? (
          <>
            {coKhung && (
              <Button type="button" size="sm" variant="outline" onClick={() => mo.nhapTheoLo(null)} className={nutHeader}>
                <Rows3 size={14} className="mr-1.5" />
                {t('danhGiaDauVao.nhapLo.nut')}
              </Button>
            )}
            {onImport && (
              <Button type="button" size="sm" variant="outline" onClick={onImport} className={nutHeader}>
                <Upload size={14} className="mr-1.5" />
                {t('danhGiaDauVao.import.nut')}
              </Button>
            )}
          </>
        ) : undefined
      }
      contentMode="raw"
      emptyTitle={t('danhGiaDauVao.chiTiet.empty')}
      emptyDescription={canNhap ? t('danhGiaDauVao.chiTiet.emptyHint') : undefined}
    >
      {tatCa.length > 0 && (
        <div className="space-y-2.5">
          <SubTableSearchBox value={tim} onChange={setTim} shown={hien.length} total={tatCa.length} />
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
                      <SubTableActionButton label={t('common.edit')} icon={<Edit size={14} />} onClick={() => mo.suaDong(r)} primary />
                      <SubTableActionButton tone="danger" label={t('common.delete')} icon={<Trash2 size={14} />} onClick={() => mo.xoaDong(r)} />
                    </div>
                  )
                : undefined
            }
            actionsWidth={84}
            onRowClick={mo.xemDong}
            renderMobileCard={(r) => (
              // Điện thoại: card gọn «lô · chip dây ……… SL» + «đánh giá · lỗi (lý do)»; chạm → drawer dòng (có Sửa / Xoá).
              <TheDongMobile
                onClick={() => mo.xemDong(r)}
                className={r.loai === 'dut_day' ? 'bg-muted/40' : r.so_luong_loi > r.so_luong ? 'bg-rose-50 dark:bg-rose-950/30' : undefined}
                tieuDe={
                  <>
                    <span className="shrink-0">{r.ten_lo ?? '—'}</span>
                    {renderCell('day', r)}
                  </>
                }
                soChinh={formatNumberVN(r.so_luong)}
                phu={
                  r.loai === 'dut_day' ? undefined : (
                    <>
                      {r.danh_gia && <span>{r.danh_gia}</span>}
                      {r.so_luong_loi > 0 && (
                        <span className="text-rose-600 font-medium">
                          {t('danhGiaDauVao.luoi.colSlLoi')} {formatNumberVN(r.so_luong_loi)}
                          {r.ly_do_loi ? ` (${r.ly_do_loi})` : ''}
                        </span>
                      )}
                    </>
                  )
                }
              />
            )}
            rowClassName={(r) => (r.loai === 'dut_day' ? 'bg-muted/40' : r.so_luong_loi > r.so_luong ? 'bg-rose-50 dark:bg-rose-950/30' : undefined)}
            emptyContent={<p className="py-4 text-center text-sm text-muted-foreground m-0">{t('danhGiaDauVao.chiTiet.khongCoDongLoc')}</p>}
            maxHeight="420px"
          />
          <div className="flex flex-wrap justify-end gap-x-4 text-sm">
            <span>
              {t('danhGiaDauVao.chiTiet.tongSoLuong')} <span className="font-bold tabular-nums text-primary">{formatNumberVN(tong.soLuong)}</span>
            </span>
            <span>
              {t('danhGiaDauVao.chiTiet.tongLoi')} <span className="font-bold tabular-nums text-rose-600">{formatNumberVN(tong.soLuongLoi)}</span>
            </span>
          </div>
        </div>
      )}
    </GenericSubTableSection>
  );
};

export default DgdvChiTietSection;
