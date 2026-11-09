/** Nội dung phiếu in checklist công đoạn — A4 dọc, khung chuẩn hệ thống (PhieuInParts). */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BangThongTin,
  HangKyTen,
  KhungPhieu,
  TieuDeMuc,
} from '../../../../../components/shared/phieu-in/PhieuInParts';
import { cn, formatYmdToDisplay } from '../../../../../lib/utils';
import { demKetQua, nhomTheoMuc } from '../../core/tong-hop';
import { coKhauSau } from '../../core/trang-thai';
import type { DongPhieuChecklist, KetQuaCl } from '../../core/types';
import type { PhieuChecklistListItem } from '../../core/list-types';

interface Props {
  phieu: PhieuChecklistListItem;
  dong: DongPhieuChecklist[];
  tenChiNhanh: string;
}

const oTick = (v: KetQuaCl | null) => (v === 'dat' ? '✓' : v === 'khong_dat' ? '✗' : '');

const ChecklistBanGiaoPreview: React.FC<Props> = ({ phieu, dong, tenChiNhanh }) => {
  const { t } = useTranslation();
  const nhom = useMemo(() => nhomTheoMuc(dong), [dong]);
  const coKhauSauPhieu = coKhauSau(phieu.chuc_vu_kiem_tra_ids);

  const subtitle = [phieu.so_phieu, formatYmdToDisplay(phieu.ngay), t(`checklistBanGiao.trangThai.${phieu.trang_thai}`)].join(' · ');

  const thongTin: [string, React.ReactNode][] = [
    [t('checklistBanGiao.col.tenMau'), phieu.ten_mau],
    [t('checklistBanGiao.form.ca'), phieu.ca ?? '—'],
    [t('checklistBanGiao.form.khuVuc'), phieu.khu_vuc ?? '—'],
    [t('checklistBanGiao.form.dayChuyen'), phieu.day_chuyen ?? '—'],
    [t('checklistBanGiao.form.idChiNhanh'), tenChiNhanh || '—'],
    [t('checklistBanGiao.col.nguoiTao'), phieu.ten_nguoi_tao ?? '—'],
  ];
  if (phieu.id_nguoi_nhan) thongTin.push([t('checklistBanGiao.col.nguoiNhan'), phieu.ten_nguoi_nhan ?? '—']);
  if (phieu.so_lan_tra_lai > 0) thongTin.push([t('checklistBanGiao.detail.soLanTraLai'), phieu.so_lan_tra_lai]);

  const th = 'border border-gray-400 bg-gray-100 px-1.5 py-0.5 font-semibold';
  const td = 'border border-gray-300 px-1.5 py-0.5 align-top';

  return (
    <KhungPhieu title={(phieu.ten_mau || t('checklistBanGiao.preview.title')).toUpperCase()} subtitle={subtitle}>
      <TieuDeMuc>{t('checklistBanGiao.preview.thongTin')}</TieuDeMuc>
      <BangThongTin rows={thongTin} />

      <TieuDeMuc>{t('checklistBanGiao.preview.ketQua')}</TieuDeMuc>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={cn(th, 'w-8 text-center')} style={{ background: '#3B6939', color: '#fff' }}>#</th>
            <th className={cn(th, 'text-left')} style={{ background: '#3B6939', color: '#fff' }}>{t('checklistBanGiao.detail.doiTuong')}</th>
            <th className={cn(th, 'text-center')} style={{ background: '#3B6939', color: '#fff' }}>{phieu.ten_ben_thuc_hien || t('checklistBanGiao.detail.benThucHien')}</th>
            {coKhauSauPhieu && (
              <th className={cn(th, 'text-center')} style={{ background: '#3B6939', color: '#fff' }}>{phieu.ten_ben_kiem_tra || t('checklistBanGiao.detail.benKiemTra')}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {nhom.map((n) => (
            <React.Fragment key={`${n.thuTuMuc}-${n.tenMuc ?? 'none'}`}>
              {n.tenMuc && (
                <tr>
                  <td colSpan={coKhauSauPhieu ? 4 : 3} className={cn(td, 'font-semibold')} style={{ background: '#D5E8CE', color: '#1f3d1e' }}>
                    {n.tenMuc}
                  </td>
                </tr>
              )}
              {n.dong.map((d) => (
                <tr key={d.id}>
                  <td className={cn(td, 'text-center tabular-nums')}>{d.stt}</td>
                  <td className={td}>
                    <span className="font-medium">
                      {d.quan_trong ? '★ ' : ''}
                      {d.doi_tuong}
                    </span>
                    {d.tieu_chuan && <div className="text-gray-600 text-[0.9em]">{d.tieu_chuan}</div>}
                    {d.phuong_phap && <div className="text-gray-600 text-[0.9em]">{d.phuong_phap}</div>}
                    {d.ma_ts && (
                      <div className="text-gray-500 text-[0.9em]">
                        {t('checklistBanGiao.detail.maTs')}: {d.ma_ts}
                        {[d.so_luong, d.tan_suat_bao_duong].filter(Boolean).length > 0 &&
                          ` · ${[d.so_luong, d.tan_suat_bao_duong].filter(Boolean).join(' · ')}`}
                      </div>
                    )}
                  </td>
                  <td className={cn(td, 'text-center text-[1.05em] font-semibold', d.kq_thuc_hien === 'khong_dat' && 'text-red-700', d.kq_thuc_hien === 'dat' && 'text-green-700')}>
                    {oTick(d.kq_thuc_hien)}
                    {d.kq_thuc_hien === 'khong_dat' && d.tinh_trang_khac_phuc && (
                      <div className="text-gray-600 text-[0.85em] font-normal">{d.tinh_trang_khac_phuc}</div>
                    )}
                  </td>
                  {coKhauSauPhieu && (
                    <td className={cn(td, 'text-center text-[1.05em] font-semibold', d.kq_kiem_tra === 'khong_dat' && 'text-red-700', d.kq_kiem_tra === 'dat' && 'text-green-700')}>
                      {oTick(d.kq_kiem_tra)}
                      {d.ghi_chu_kiem_tra && <div className="text-gray-600 text-[0.85em] font-normal">{d.ghi_chu_kiem_tra}</div>}
                    </td>
                  )}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <p className="mt-2 font-semibold break-inside-avoid">
        {(() => {
          const th = demKetQua(dong, 'kq_thuc_hien');
          const kt = demKetQua(dong, 'kq_kiem_tra');
          const ben = (ten: string, d: typeof th) =>
            t('checklistBanGiao.preview.tongHop', { ben: ten, dat: d.dat, khongDat: d.khongDat, tong: d.tong });
          return [
            ben(phieu.ten_ben_thuc_hien, th),
            ...(coKhauSauPhieu ? [ben(phieu.ten_ben_kiem_tra, kt)] : []),
          ].join('   ·   ');
        })()}
      </p>

      {phieu.co_ket_luan_van_hanh && (
        <div className="mt-3 flex items-baseline gap-2 break-inside-avoid">
          <span className="font-bold uppercase">{t('checklistBanGiao.preview.ketLuan')}:</span>
          {phieu.ket_luan ? (
            <span className={cn('font-bold uppercase text-[1.15em]', phieu.ket_luan === 'tam_dung' ? 'text-red-700' : phieu.ket_luan === 'du_dieu_kien' ? 'text-green-700' : 'text-amber-700')}>
              {t(`checklistBanGiao.ketLuan.${phieu.ket_luan}`)}
            </span>
          ) : (
            <span className="italic text-gray-500">{t('checklistBanGiao.preview.chuaKetLuan')}</span>
          )}
        </div>
      )}

      {phieu.y_kien && (
        <p className="mt-1.5 whitespace-pre-line">
          <span className="font-semibold">{t('checklistBanGiao.detail.yKien')}:</span> {phieu.y_kien}
        </p>
      )}

      {phieu.ghi_chu && (
        <p className="mt-1.5 whitespace-pre-line">
          <span className="font-semibold">{t('checklistBanGiao.form.ghiChu')}:</span> {phieu.ghi_chu}
        </p>
      )}

      <HangKyTen
        className="mt-auto pt-2"
        khoangKyMm={10}
        labels={[
          phieu.ten_ben_thuc_hien || t('checklistBanGiao.detail.benThucHien'),
          phieu.ten_ben_kiem_tra || t('checklistBanGiao.detail.benKiemTra'),
          t('checklistBanGiao.preview.kyQuanLy'),
        ]}
      />
    </KhungPhieu>
  );
};

export default ChecklistBanGiaoPreview;
