/**
 * Nội dung mẫu checklist TRẮNG — A4 dọc, in ra để điền tay.
 * Ô tích để trống (☐ Đạt / ☐ K.Đạt), cột tình trạng & ghi chú để dòng kẻ trống.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DongCham, HangKyTen, KhungPhieu } from '../../../../../components/shared/phieu-in/PhieuInParts';
import { cn } from '../../../../../lib/utils';
import type { HangMucMauChecklist, MauChecklist, MucMauChecklist } from '../../core/types';

interface Props {
  data: { mau: MauChecklist; muc: MucMauChecklist[]; hangMuc: HangMucMauChecklist[] };
}

type DongIn = { kind: 'muc'; ten: string } | { kind: 'hang'; stt: number; hm: HangMucMauChecklist };

const TH = 'border border-gray-400 px-1.5 py-0.5 font-semibold text-center align-middle';
const TD = 'border border-gray-300 px-1.5 py-0.5 align-top';
const NEN_DAU = { background: '#3B6939', color: '#fff' } as const;

const ChecklistMauPreview: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const { mau, muc, hangMuc } = data;
  const coKhauSau = mau.chuc_vu_kiem_tra_ids.length > 0;

  // Dòng in: mục (tiêu đề nhóm) → hạng mục đang dùng, đánh STT liên tục toàn bảng.
  const rows = useMemo<DongIn[]>(() => {
    const mucs = [...muc].sort((a, b) => a.thu_tu - b.thu_tu || a.id.localeCompare(b.id));
    const hms = hangMuc.filter((h) => h.dang_dung).sort((a, b) => a.thu_tu - b.thu_tu || a.id.localeCompare(b.id));
    const out: DongIn[] = [];
    let stt = 0;
    for (const m of mucs) {
      out.push({ kind: 'muc', ten: m.ten });
      for (const h of hms.filter((x) => x.id_muc === m.id)) out.push({ kind: 'hang', stt: ++stt, hm: h });
    }
    for (const h of hms.filter((x) => !x.id_muc)) out.push({ kind: 'hang', stt: ++stt, hm: h });
    return out;
  }, [muc, hangMuc]);

  const soCot = coKhauSau ? 6 : 5;

  return (
    <KhungPhieu
      title={mau.ten.toUpperCase()}
      subtitle={mau.ma ? `${t('checklistMau.preview.maBieuMau')}: ${mau.ma}` : undefined}
    >
      {/* Dòng kẻ ghi tay */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-1 mb-3">
        <DongCham label={t('checklistMau.preview.ngay')} />
        <DongCham label={t('checklistMau.preview.ca')} />
        <DongCham label={t('checklistMau.preview.khuVuc')} />
        <DongCham label={t('checklistMau.preview.dayChuyen')} />
        <div className="col-span-2">
          <DongCham label={t('checklistMau.preview.nguoiKiemTra')} />
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={cn(TH, 'w-8')} style={NEN_DAU}>
              {t('checklistMau.preview.stt')}
            </th>
            <th className={TH} style={NEN_DAU}>
              {t('checklistMau.preview.doiTuong')}
            </th>
            <th className={TH} style={NEN_DAU}>
              {mau.ten_ben_thuc_hien}
              <div className="font-normal text-[0.85em] mt-0.5">
                {t('checklistMau.preview.dat')} ☐ &nbsp;·&nbsp; {t('checklistMau.preview.khongDat')} ☐
              </div>
            </th>
            {coKhauSau && (
              <th className={TH} style={NEN_DAU}>
                {mau.ten_ben_kiem_tra}
                <div className="font-normal text-[0.85em] mt-0.5">
                  {t('checklistMau.preview.dat')} ☐ &nbsp;·&nbsp; {t('checklistMau.preview.khongDat')} ☐
                </div>
              </th>
            )}
            <th className={TH} style={NEN_DAU}>
              {t('checklistMau.preview.tinhTrang')}
            </th>
            <th className={TH} style={NEN_DAU}>
              {t('checklistMau.preview.ghiChu')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={soCot} className={cn(TD, 'text-center italic text-gray-500 py-3')}>
                {t('checklistMau.muc.chuaCoHangMuc')}
              </td>
            </tr>
          ) : (
            rows.map((r, i) =>
              r.kind === 'muc' ? (
                <tr key={`muc-${i}`}>
                  <td
                    colSpan={soCot}
                    className={cn(TD, 'font-semibold')}
                    style={{ background: '#D5E8CE', color: '#1f3d1e' }}
                  >
                    {r.ten}
                  </td>
                </tr>
              ) : (
                <tr key={`hm-${r.hm.id}`}>
                  <td className={cn(TD, 'text-center tabular-nums')}>{r.stt}</td>
                  <td className={TD}>
                    <span className="font-medium">
                      {r.hm.quan_trong ? '★ ' : ''}
                      {r.hm.doi_tuong}
                    </span>
                    {r.hm.tieu_chuan && <div className="text-gray-600 text-[0.9em]">{r.hm.tieu_chuan}</div>}
                    {r.hm.phuong_phap && (
                      <div className="text-gray-600 text-[0.9em]">
                        {t('checklistMau.hangMuc.phuongPhap')}: {r.hm.phuong_phap}
                      </div>
                    )}
                  </td>
                  <td className={cn(TD, 'h-9')}>{' '}</td>
                  {coKhauSau && <td className={cn(TD, 'h-9')}>{' '}</td>}
                  <td className={cn(TD, 'h-9')}>{' '}</td>
                  <td className={cn(TD, 'h-9')}>{' '}</td>
                </tr>
              )
            )
          )}
        </tbody>
      </table>

      {mau.co_ket_luan_van_hanh && (
        <div className="mt-3 break-inside-avoid">
          <p className="font-semibold uppercase m-0">{t('checklistMau.preview.ketLuan')}:</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1">
            {(['duDieuKien', 'coDieuKien', 'tamDung'] as const).map((k) => (
              <span key={k}>☐ {t(`checklistMau.preview.${k}`)}</span>
            ))}
          </div>
          <DongCham label={t('checklistMau.preview.yKien')} className="mt-2" />
        </div>
      )}

      {mau.ghi_chu_cuoi && (
        <p className="mt-2 whitespace-pre-line break-inside-avoid">
          <span className="font-semibold">{t('checklistMau.form.ghiChuCuoi')}:</span> {mau.ghi_chu_cuoi}
        </p>
      )}

      <HangKyTen
        className="mt-auto pt-2"
        khoangKyMm={16}
        labels={[
          mau.ten_ben_thuc_hien,
          mau.ten_ben_kiem_tra,
          t('checklistMau.preview.nguoiQuanLy'),
        ]}
      />
    </KhungPhieu>
  );
};

export default ChecklistMauPreview;
