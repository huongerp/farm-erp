/**
 * Nội dung in Bảng đánh giá đầu vào theo mẫu FP5: mỗi ngày × chi nhánh một trang (khổ ngang mặc định) —
 * đầu phiếu chuẩn (băng hình + công ty, qua KhungPhieu), tiêu đề «BẢNG KIỂM TRA ĐÁNH GIÁ ĐẦU VÀO <chi nhánh>»,
 * dòng KSC · Tổng thu · Tuần thu hoạch · Ngày, rồi lưới như màn hình. Số lấy từ mô hình lưới (core/bang-tinh).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn, formatNumberVN, formatYmdToDisplay } from '../../../../../lib/utils';
import { KhungPhieu, TD_IN, TH_IN } from '../../../../../components/shared/phieu-in/PhieuInParts';
import type { DgdvKhoiNgay, DgdvLuoiNgay } from '../../core/bang-tinh';
import { styleTieuDeCot } from '../../utils/mau-day';
import { tomTatChuyenLuoi } from '../../utils/export-luoi';

const th = `${TH_IN} px-1 py-0.5 text-center align-middle`;
const td = `${TD_IN} px-1 py-0.5 align-middle`;
const tdSo = `${td} text-right tabular-nums`;
const VANG = 'bg-amber-50';
const XANH = 'bg-sky-50';
const fmt = (n: number) => (n === 0 ? '' : formatNumberVN(n));

const LuoiIn: React.FC<{ luoi: DgdvLuoiNgay }> = ({ luoi }) => {
  const { t } = useTranslation();
  const soCot = 3 + luoi.cot.length * 4;
  return (
    <table className="w-full border-collapse text-[0.82em]">
      <thead>
        <tr>
          <th rowSpan={3} className={cn(th, VANG)}>{t('danhGiaDauVao.luoi.colLo')}</th>
          <th rowSpan={3} className={cn(th, VANG)}>{t('danhGiaDauVao.luoi.colSlBuong')}</th>
          {luoi.nhomCot.map((g, i) => (
            <th key={i} colSpan={g.cot.length * 4} className={th}>
              {g.tuanThuHoach ? t('danhGiaDauVao.luoi.tuan', { tuan: g.tuanThuHoach.tuan }) : t('danhGiaDauVao.luoi.chuaCoTuan')}
            </th>
          ))}
          <th rowSpan={3} className={cn(th, VANG)}>{t('danhGiaDauVao.luoi.colGhiChu')}</th>
        </tr>
        <tr>
          {luoi.cot.map((c) => (
            <th key={c.id} colSpan={4} className={th} style={styleTieuDeCot(c.ma_mau_1, c.ma_mau_2)}>
              {c.nhan}
            </th>
          ))}
        </tr>
        <tr>
          {luoi.cot.map((c) => (
            <React.Fragment key={c.id}>
              <th className={cn(th, 'font-medium')}>{t('danhGiaDauVao.luoi.colSoLuong')}</th>
              <th className={cn(th, 'font-medium')}>{t('danhGiaDauVao.luoi.colDanhGia')}</th>
              <th className={cn(th, 'font-medium')}>{t('danhGiaDauVao.luoi.colSlLoi')}</th>
              <th className={cn(th, 'font-medium')}>{t('danhGiaDauVao.luoi.colLyDoLoi')}</th>
            </React.Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {luoi.nhomToTruong.length === 0 && (
          <tr>
            <td colSpan={soCot} className={cn(td, 'text-center italic text-gray-500')}>
              {t('danhGiaDauVao.luoi.chuaCoLo')}
            </td>
          </tr>
        )}
        {luoi.nhomToTruong.map((g) => (
          <React.Fragment key={g.ids_phieu_lo.join(',')}>
            <tr className={cn(XANH, 'font-semibold')}>
              <td className={td}>{g.ten_to_truong ?? t('danhGiaDauVao.luoi.chuaCoToTruong')}</td>
              <td className={tdSo}>{formatNumberVN(g.slBuong)}</td>
              {luoi.cot.map((c) => (
                <React.Fragment key={c.id}>
                  <td className={tdSo}>{fmt(g.tongTheoCot[c.id] ?? 0)}</td>
                  <td className={td} colSpan={3} />
                </React.Fragment>
              ))}
              <td className={td} />
            </tr>
            {g.lo.map((lo) =>
              lo.dong.map((d, i) => (
                <tr key={`${lo.id_phieu_lo}-${d.stt_dong}`}>
                  {i === 0 && (
                    <>
                      <td rowSpan={lo.dong.length} className={cn(td, VANG, 'align-top')}>
                        <div className="font-medium">{lo.ten_lo ?? '—'}</div>
                        {lo.dutDay > 0 && (
                          <div className="text-[0.85em] text-gray-600">
                            {t('danhGiaDauVao.luoi.dutDayN', { n: formatNumberVN(lo.dutDay) })}
                          </div>
                        )}
                      </td>
                      <td rowSpan={lo.dong.length} className={cn(tdSo, VANG, 'align-top font-semibold')}>
                        {formatNumberVN(lo.slBuong)}
                      </td>
                    </>
                  )}
                  {luoi.cot.map((c) => {
                    const o = d.o[c.id];
                    return (
                      <React.Fragment key={c.id}>
                        <td className={tdSo}>{o ? fmt(o.so_luong) : ''}</td>
                        <td className={td}>{o?.danh_gia ?? ''}</td>
                        <td className={tdSo}>{o ? fmt(o.so_luong_huy) : ''}</td>
                        <td className={td}>{o?.ly_do_huy ?? ''}</td>
                      </React.Fragment>
                    );
                  })}
                  {i === 0 && (
                    <td rowSpan={lo.dong.length} className={cn(td, 'align-top whitespace-pre-wrap')}>
                      {lo.ghi_chu ?? ''}
                    </td>
                  )}
                </tr>
              ))
            )}
          </React.Fragment>
        ))}
        {luoi.nhomToTruong.length > 0 && (
          <tr className="font-bold bg-gray-100">
            <td className={td}>{t('danhGiaDauVao.luoi.tongCong')}</td>
            <td className={tdSo}>{formatNumberVN(luoi.tongThu)}</td>
            {luoi.cot.map((c) => (
              <React.Fragment key={c.id}>
                <td className={tdSo}>{formatNumberVN(luoi.tongTheoCot[c.id] ?? 0)}</td>
                <td className={td} colSpan={3} />
              </React.Fragment>
            ))}
            <td className={td} />
          </tr>
        )}
      </tbody>
    </table>
  );
};

const DgdvPreviewContent: React.FC<{ dsKhoi: DgdvKhoiNgay[]; chuyen?: number }> = ({ dsKhoi, chuyen }) => {
  const { t } = useTranslation();
  const dsLuoi = dsKhoi.flatMap((k) => k.luoi);

  if (dsLuoi.length === 0) {
    return (
      <KhungPhieu title={t('danhGiaDauVao.preview.tieuDe', { chiNhanh: '' }).trim()}>
        <p className="text-center italic text-gray-500 py-6">{t('danhGiaDauVao.preview.trong')}</p>
      </KhungPhieu>
    );
  }

  return (
    <>
      {dsLuoi.map((luoi, i) => {
        const tuanThu = luoi.tuanThuHoach.length > 0 ? luoi.tuanThuHoach.map((x) => x.tuan).join(', ') : String(luoi.tuan);
        const tomTat = tomTatChuyenLuoi(luoi, t);
        return (
          // Mỗi ngày một trang: KhungPhieu cao đúng một trang trên màn hình, khi in ngắt trang trước khối sau.
          <div key={`${luoi.ngay}-${luoi.id_phieu}`} style={i > 0 ? { breakBefore: 'page' } : undefined}>
            <KhungPhieu
              title={t('danhGiaDauVao.preview.tieuDe', { chiNhanh: luoi.ten_chi_nhanh ?? '' }).trim()}
              ngay={formatYmdToDisplay(luoi.ngay)}
            >
              <p className="text-center font-semibold m-0 mb-2">
                {t('danhGiaDauVao.luoi.ksc')} {formatNumberVN(luoi.ksc)} · {t('danhGiaDauVao.luoi.tongThu')}{' '}
                {formatNumberVN(luoi.tongThu)}
                {chuyen != null && <> · {t('danhGiaDauVao.detail.tieuDeChuyen', { chuyen })}</>} · {t('danhGiaDauVao.luoi.tuanThuHoach')} {tuanThu} · {t('danhGiaDauVao.luoi.ngay')}{' '}
                {formatYmdToDisplay(luoi.ngay)}
              </p>
              {tomTat && <p className="text-center m-0 mb-2">{tomTat}</p>}
              <LuoiIn luoi={luoi} />
            </KhungPhieu>
          </div>
        );
      })}
    </>
  );
};

export default DgdvPreviewContent;
