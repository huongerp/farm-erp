/**
 * Lưới ngang một ngày của một phiếu (giống file Excel) — CHỈ XEM / in: cột vàng cố định bên trái
 * (Lô thu hoạch + đứt dây, SL buồng), cột dây gom theo tuần thu hoạch (mỗi dây 4 cột con), Ghi chú cuối.
 * Dòng tổ trưởng (nền xanh nhạt) tự cộng; mỗi lô nhiều dòng. Mọi số tổng lấy từ mô hình
 * `dungLuoiNgay` (core/bang-tinh) — component không tự cộng. Nhập / sửa số ở bảng «Chi tiết đánh giá»
 * trong Detail phiếu (components/chi-tiet). Dùng chung cho tab Bảng đánh giá và Detail.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../../lib/utils';
import type { DgdvCotHienThi, DgdvLoNgay, DgdvLuoiNgay } from '../../core/bang-tinh';
import type { FarmDgdvDong } from '../../core/types';
import { styleTieuDeCot } from '../../utils/mau-day';
import { khoaCanhBao } from '../../utils/cap-nhat-luoi';

interface Props {
  luoi: DgdvLuoiNgay;
  /** Ô có SL lỗi > số lượng (khoá `khoaCanhBao`). */
  canhBao: ReadonlySet<string>;
  /** Ẩn dòng đầu khối (KSC / Tổng thu / ngày). */
  anDauKhoi?: boolean;
  /** Nội dung thêm cuối dòng đầu khối (vd. nút mở phiếu ở tab Bảng đánh giá). */
  dauKhoiPhu?: React.ReactNode;
}

// Bề rộng cột cố định — `left` của cột sau = tổng bề rộng cột trước.
const W_LO = 'w-[11rem] min-w-[11rem] max-w-[11rem]';
const W_SL = 'w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem]';
const LEFT_SL = 'left-[11rem]';
const VANG = 'bg-amber-100 dark:bg-amber-950';
const XANH = 'bg-sky-100 dark:bg-sky-950';
const TH = 'border border-border px-1.5 py-1 text-xs font-semibold text-center align-middle';
const TD = 'border border-border px-1.5 py-1 text-body-sm align-middle';

const fmt = (n: number) => (n === 0 ? '' : formatNumberVN(n));

/** 4 ô con của một dây trong một dòng. */
const OCotDay: React.FC<{ o: FarmDgdvDong | undefined; canhBao: boolean }> = ({ o, canhBao }) => {
  const { t } = useTranslation();
  const loiCls = canhBao && 'ring-2 ring-rose-500 ring-inset bg-rose-50 dark:bg-rose-950/40';
  return (
    <>
      <td className={cn(TD, 'text-right tabular-nums')}>{o ? fmt(o.so_luong) : ''}</td>
      <td className={TD}>{o?.danh_gia ?? ''}</td>
      <td className={cn(TD, 'text-right tabular-nums', loiCls)} title={canhBao ? t('danhGiaDauVao.luoi.canhBaoLoi') : undefined}>
        {o ? fmt(o.so_luong_loi) : ''}
      </td>
      <td className={TD}>{o?.ly_do_loi ?? ''}</td>
    </>
  );
};

const TieuDeCot: React.FC<{ cot: DgdvCotHienThi }> = ({ cot }) => (
  <th colSpan={4} className={cn(TH, 'whitespace-nowrap')} style={styleTieuDeCot(cot.ma_mau_1, cot.ma_mau_2)}>
    {cot.nhan}
  </th>
);

const DgdvLuoiNgayTable: React.FC<Props> = ({ luoi, canhBao, anDauKhoi, dauKhoiPhu }) => {
  const { t } = useTranslation();

  const soCot = luoi.cot.length;
  const tuanThu = luoi.tuanThuHoach.length > 0 ? luoi.tuanThuHoach.map((x) => x.tuan).join(', ') : String(luoi.tuan);

  const soDongCuaLo = (lo: DgdvLoNgay) => Math.max(1, ...lo.dong.map((d) => d.stt_dong));

  return (
    <div className="space-y-1.5">
      {!anDauKhoi && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
          <span>
            {t('danhGiaDauVao.luoi.ksc')} <span className="text-rose-600 tabular-nums">{formatNumberVN(luoi.ksc)}</span>
          </span>
          <span>·</span>
          <span>
            {t('danhGiaDauVao.luoi.tongThu')} <span className="text-primary tabular-nums">{formatNumberVN(luoi.tongThu)}</span>
          </span>
          <span>·</span>
          <span>
            {t('danhGiaDauVao.luoi.tuanThuHoach')} {tuanThu}
          </span>
          <span>·</span>
          <span>
            {t('danhGiaDauVao.luoi.ngay')} {formatYmdToDisplay(luoi.ngay)}
          </span>
          {luoi.ten_chi_nhanh && <span className="text-muted-foreground font-normal">· {luoi.ten_chi_nhanh}</span>}
          {dauKhoiPhu && <span className="ml-auto font-normal">{dauKhoiPhu}</span>}
        </div>
      )}

      {soCot === 0 && <p className="text-xs text-amber-700 dark:text-amber-400 m-0">{t('danhGiaDauVao.luoi.chuaCoCot')}</p>}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="border-collapse w-max min-w-full">
          <thead>
            <tr>
              <th rowSpan={3} className={cn(TH, W_LO, VANG, 'sticky left-0 z-20')}>
                {t('danhGiaDauVao.luoi.colLo')}
              </th>
              <th rowSpan={3} className={cn(TH, W_SL, VANG, LEFT_SL, 'sticky z-20')}>
                {t('danhGiaDauVao.luoi.colSlBuong')}
              </th>
              {luoi.nhomCot.map((g, i) => (
                <th key={i} colSpan={g.cot.length * 4} className={cn(TH, 'bg-muted')}>
                  {g.tuanThuHoach ? t('danhGiaDauVao.luoi.tuan', { tuan: g.tuanThuHoach.tuan }) : t('danhGiaDauVao.luoi.chuaCoTuan')}
                </th>
              ))}
              <th rowSpan={3} className={cn(TH, VANG, 'min-w-[10rem]')}>
                {t('danhGiaDauVao.luoi.colGhiChu')}
              </th>
            </tr>
            <tr>
              {luoi.cot.map((c) => (
                <TieuDeCot key={c.id} cot={c} />
              ))}
            </tr>
            <tr>
              {luoi.cot.map((c) => (
                <React.Fragment key={c.id}>
                  <th className={cn(TH, 'bg-muted/60 w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] font-medium')}>{t('danhGiaDauVao.luoi.colSoLuong')}</th>
                  <th className={cn(TH, 'bg-muted/60 w-[7rem] min-w-[7rem] max-w-[7rem] font-medium')}>{t('danhGiaDauVao.luoi.colDanhGia')}</th>
                  <th className={cn(TH, 'bg-muted/60 w-[3.75rem] min-w-[3.75rem] max-w-[3.75rem] font-medium')}>{t('danhGiaDauVao.luoi.colSlLoi')}</th>
                  <th className={cn(TH, 'bg-muted/60 w-[7rem] min-w-[7rem] max-w-[7rem] font-medium')}>{t('danhGiaDauVao.luoi.colLyDoLoi')}</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {luoi.nhomToTruong.length === 0 && (
              <tr>
                <td colSpan={3 + soCot * 4} className={cn(TD, 'text-center text-muted-foreground py-3')}>
                  {t('danhGiaDauVao.luoi.chuaCoLo')}
                </td>
              </tr>
            )}
            {luoi.nhomToTruong.map((g) => (
              <React.Fragment key={g.ids_phieu_lo.join(',')}>
                <tr className={cn(XANH, 'font-semibold')}>
                  <td className={cn(TD, W_LO, XANH, 'sticky left-0 z-10')}>
                    {g.ten_to_truong ?? t('danhGiaDauVao.luoi.chuaCoToTruong')}
                    {g.soLuongLoi > 0 && (
                      <span className="ml-1 text-caption font-normal text-rose-600">
                        · {t('danhGiaDauVao.luoi.ksc')} {formatNumberVN(g.soLuongLoi)}
                      </span>
                    )}
                  </td>
                  <td className={cn(TD, W_SL, XANH, LEFT_SL, 'sticky z-10 text-right tabular-nums')}>{formatNumberVN(g.slBuong)}</td>
                  {luoi.cot.map((c) => (
                    <React.Fragment key={c.id}>
                      <td className={cn(TD, 'text-right tabular-nums')}>{fmt(g.tongTheoCot[c.id] ?? 0)}</td>
                      <td className={TD} colSpan={3} />
                    </React.Fragment>
                  ))}
                  <td className={TD} />
                </tr>
                {g.lo.map((lo) => {
                  const soDong = soDongCuaLo(lo);
                  return Array.from({ length: soDong }, (_, i) => {
                    const stt = i + 1;
                    const oDong = lo.dong.find((d) => d.stt_dong === stt)?.o ?? {};
                    return (
                      <tr key={`${lo.id_phieu_lo}-${stt}`} className={i === soDong - 1 ? 'border-b-2 border-border' : undefined}>
                        {i === 0 && (
                          <>
                            <td rowSpan={soDong} className={cn(TD, W_LO, VANG, 'sticky left-0 z-10 align-top')}>
                              <div className="font-medium break-words">{lo.ten_lo ?? '—'}</div>
                              {lo.dutDay > 0 && (
                                <div className="text-caption text-muted-foreground">
                                  {t('danhGiaDauVao.luoi.dutDayN', { n: formatNumberVN(lo.dutDay) })}
                                </div>
                              )}
                            </td>
                            <td
                              rowSpan={soDong}
                              className={cn(TD, W_SL, VANG, LEFT_SL, 'sticky z-10 text-right tabular-nums font-semibold align-top')}
                            >
                              {formatNumberVN(lo.slBuong)}
                            </td>
                          </>
                        )}
                        {luoi.cot.map((c) => (
                          <OCotDay
                            key={c.id}
                            o={oDong[c.id]}
                            canhBao={canhBao.has(khoaCanhBao(lo.id_phieu_lo, c.id, luoi.ngay, stt))}
                          />
                        ))}
                        {i === 0 && (
                          <td rowSpan={soDong} className={cn(TD, VANG, 'align-top min-w-[10rem]')}>
                            <span className="whitespace-pre-wrap">{lo.ghi_chu ?? ''}</span>
                          </td>
                        )}
                      </tr>
                    );
                  });
                })}
              </React.Fragment>
            ))}
            {luoi.nhomToTruong.length > 0 && (
              <tr className="font-bold bg-muted">
                <td className={cn(TD, W_LO, 'sticky left-0 z-10 bg-muted')}>{t('danhGiaDauVao.luoi.tongCong')}</td>
                <td className={cn(TD, W_SL, LEFT_SL, 'sticky z-10 bg-muted text-right tabular-nums text-primary')}>
                  {formatNumberVN(luoi.tongThu)}
                </td>
                {luoi.cot.map((c) => (
                  <React.Fragment key={c.id}>
                    <td className={cn(TD, 'text-right tabular-nums')}>{formatNumberVN(luoi.tongTheoCot[c.id] ?? 0)}</td>
                    <td className={TD} colSpan={3} />
                  </React.Fragment>
                ))}
                <td className={TD} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DgdvLuoiNgayTable;
