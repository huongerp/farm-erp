/**
 * Tab «Tỷ lệ lỗi» (CHỈ XEM): chip Kỳ (bắt buộc chọn — view lỗi nhiều dòng nên «Tất cả» không gọi) + chi nhánh.
 * Đọc view `v_fp_farm_dgdv_loi_ngay` (migration 094), tách chuỗi lỗi ghép và gom theo nhóm nguyên nhân ở
 * `core/nhom-loi`; mẫu số «tổng thu» lấy từ view tổng chuyến cùng kỳ. Hiện thẻ tổng mỗi nhóm, biểu đồ cột
 * tô màu theo `ma_mau`, bảng nhóm mở rộng tới từng tên lỗi, khối «Chưa phân loại» (mở Cài đặt để gán nhóm)
 * và bảng theo lô (cột = nhóm). Xuất Excel 1 sheet phẳng qua `utils/export-ti-le-loi`.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CalendarRange, ChevronDown, ChevronRight, Settings } from 'lucide-react';
import EmptyState from '../../../../components/shared/EmptyState';
import ExportDialog from '../../../../components/shared/LazyExportDialog';
import ChartTooltip from '../../../../components/ui/ChartTooltip';
import DateRangePicker from '../../../../components/ui/DateRangePicker';
import Button from '../../../../components/ui/Button';
import { cn, formatNumberVN } from '../../../../lib/utils';
import { tongHopNhomLoi, tongHopNhomLoiTheoLo, type KqNhomLoi } from '../core/nhom-loi';
import type { VarDgdvNhomLoi } from '../core/types';
import { useDgdvLoiNgay, useDgdvTongChuyen } from '../hooks/use-dgdv-tong-ngay';
import { useKyDgdv } from '../hooks/use-ky-dgdv';
import { useDgdvChiNhanhXem } from '../hooks/use-dgdv-chi-nhanh-xem';
import { useDgdvPermissions } from '../hooks/use-danh-gia-dau-vao-permissions';
import { useLoThuHoach, useLyDoDgdv, useNhomLoiDgdv } from '../hooks/use-danh-muc-dgdv';
import { cotXuatTiLeLoi, dongXuatTiLeLoi } from '../utils/export-ti-le-loi';
import TongHopToolbar from './tong-hop/TongHopToolbar';
import { BangTongHop, TieuDeBang } from './tong-hop/BangTongHop';
import { TD, TH, fmtO } from './tong-hop/bang-tong-hop';
import CaiDatDialog from './cai-dat/CaiDatDialog';

const CHART_HEIGHT = 240;
const SO_TEN_CHUA_TOI_DA = 15;
const axisStyle = { fontSize: 11, fill: 'var(--color-muted-foreground)' };

/** % 1 chữ số; chưa tính được (tổng 0) → «–». */
const pt = (v: number | null) => (v == null ? '–' : `${formatNumberVN(v, { maxFractionDigits: 1 })}%`);

/** Thẻ tổng một nhóm: chấm màu + tên, số buồng lỗi, % trên tổng thu và % trong tổng lỗi. */
const TheNhom: React.FC<{ n: KqNhomLoi }> = ({ n }) => {
  const { t } = useTranslation();
  return (
    <div
      className="rounded-lg border border-border bg-card p-3 space-y-1.5"
      title={t('danhGiaDauVao.tiLeLoi.theNhom', { ten: n.ten, so: formatNumberVN(n.so) })}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: n.ma_mau }} />
        <span className="truncate text-sm font-medium text-foreground">{n.ten}</span>
      </div>
      <p className="m-0 text-xl font-semibold tabular-nums text-rose-600">{formatNumberVN(n.so)}</p>
      <div className="space-y-0.5 text-caption text-muted-foreground">
        <p className="m-0 flex justify-between gap-2">
          <span>{t('danhGiaDauVao.tiLeLoi.trenTongThu')}</span>
          <span className="tabular-nums text-foreground">{pt(n.tiLeTrenThu)}</span>
        </p>
        <p className="m-0 flex justify-between gap-2">
          <span>{t('danhGiaDauVao.tiLeLoi.trongTongLoi')}</span>
          <span className="tabular-nums text-foreground">{pt(n.tiLeTrongTongLoi)}</span>
        </p>
      </div>
    </div>
  );
};

/** Một hàng nhóm trong bảng, bấm để mở / đóng các dòng tên lỗi (`chiTiet`). */
const HangNhom: React.FC<{ n: KqNhomLoi; ten: string; mo: boolean; onToggle: () => void }> = ({ n, ten, mo, onToggle }) => (
  <>
    <tr className="hover:bg-muted/40">
      <td className={cn(TD, 'text-left min-w-[12rem]')}>
        <button type="button" className="inline-flex items-center gap-1.5 text-left" onClick={onToggle} aria-expanded={mo}>
          {mo ? <ChevronDown size={14} className="shrink-0 text-muted-foreground" /> : <ChevronRight size={14} className="shrink-0 text-muted-foreground" />}
          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: n.ma_mau }} />
          <span className="font-medium">{ten}</span>
        </button>
      </td>
      <td className={cn(TD, 'text-right tabular-nums')}>{fmtO(n.soDanhGia)}</td>
      <td className={cn(TD, 'text-right tabular-nums text-rose-600')}>{fmtO(n.soHuy)}</td>
      <td className={cn(TD, 'text-right tabular-nums font-semibold')}>{fmtO(n.so)}</td>
      <td className={cn(TD, 'text-right tabular-nums')}>{pt(n.tiLeTrenThu)}</td>
      <td className={cn(TD, 'text-right tabular-nums')}>{pt(n.tiLeTrongTongLoi)}</td>
    </tr>
    {mo &&
      (n.chiTiet.length === 0 ? (
        <tr className="bg-muted/20">
          <td className={cn(TD, 'text-muted-foreground')} colSpan={6}>
            –
          </td>
        </tr>
      ) : (
        n.chiTiet.map((ct) => (
          <tr key={ct.ten} className="bg-muted/20">
            <td className={cn(TD, 'pl-9 text-muted-foreground')}>{ct.ten}</td>
            <td className={cn(TD, 'text-right tabular-nums')}>{fmtO(ct.soDanhGia)}</td>
            <td className={cn(TD, 'text-right tabular-nums text-rose-600')}>{fmtO(ct.soHuy)}</td>
            <td className={cn(TD, 'text-right tabular-nums')}>{fmtO(ct.soDanhGia + ct.soHuy)}</td>
            <td className={cn(TD, 'text-right tabular-nums')} />
            <td className={cn(TD, 'text-right tabular-nums')} />
          </tr>
        ))
      ))}
  </>
);

/** Nhãn nhóm đang dùng, xếp `thu_tu` — dùng chung cho bảng theo lô và tiêu đề cột. */
const nhomDangDung = (dsNhom: readonly VarDgdvNhomLoi[]) =>
  dsNhom
    .filter((n) => n.dang_dung)
    .slice()
    .sort((a, b) => a.thu_tu - b.thu_tu || a.ten.localeCompare(b.ten, 'vi'));

const TiLeLoiTab: React.FC = () => {
  const { t } = useTranslation();
  // Mặc định «Tháng này»: view lỗi có thể rất nhiều dòng, kỳ «Tất cả» sẽ tải cả lịch sử.
  const ky = useKyDgdv(undefined, 'thisMonth');
  const [idCn, setIdCn] = useState('');
  const [moXuat, setMoXuat] = useState(false);
  const [moCaiDat, setMoCaiDat] = useState(false);
  const [dangMo, setDangMo] = useState<Set<string>>(new Set());

  const { dsChiNhanh, phamVi, dangTaiPhamVi } = useDgdvChiNhanhXem(idCn || null);
  // Nút mở Cài đặt chỉ hiện với người được ghi danh mục (cùng điều kiện mở dialog ở tab Phiếu).
  const { canCaiDat } = useDgdvPermissions();
  const { tu, den } = ky.khoang;
  const coKy = !!tu && !!den;

  const q = useDgdvLoiNgay(tu, den, phamVi, !dangTaiPhamVi);
  const qThu = useDgdvTongChuyen(tu, den, phamVi, !dangTaiPhamVi && coKy);
  const tongThu = useMemo(() => (qThu.data ?? []).reduce((s, c) => s + c.tong_thu, 0), [qThu.data]);

  const { data: dsLyDo = [] } = useLyDoDgdv();
  const { data: dsNhom = [] } = useNhomLoiDgdv();
  const { data: dsLo = [] } = useLoThuHoach();
  const loTheoId = useMemo(() => new Map(dsLo.map((l) => [String(l.id), l.ten_lo])), [dsLo]);
  const tenLo = useCallback((id: string) => loTheoId.get(id) ?? `#${id}`, [loTheoId]);

  const rows = useMemo(() => q.data ?? [], [q.data]);
  const kq = useMemo(() => tongHopNhomLoi(rows, dsLyDo, dsNhom, tongThu), [rows, dsLyDo, dsNhom, tongThu]);
  const kqLo = useMemo(() => tongHopNhomLoiTheoLo(rows, dsLyDo), [rows, dsLyDo]);
  const nhomDung = useMemo(() => nhomDangDung(dsNhom), [dsNhom]);
  const coSo = rows.length > 0;

  /** Bảng nhóm: nhóm đang dùng (kể cả nhóm 0 lỗi) + «Chưa phân loại» nếu có lỗi. */
  const tatCaNhom = useMemo(
    () => (kq.chuaPhanLoai.so > 0 ? [...kq.dsNhom, kq.chuaPhanLoai] : kq.dsNhom),
    [kq]
  );

  const chartData = useMemo(
    () =>
      tatCaNhom
        .filter((n) => n.so > 0)
        .map((n) => ({ key: n.id ?? 'chua', name: n.id ? n.ten : t('danhGiaDauVao.tiLeLoi.chuaPhanLoai'), so: n.so, ma_mau: n.ma_mau })),
    [tatCaNhom, t]
  );

  const coChuaTrongLo = useMemo(
    () => kqLo.some((r) => {
      const o = r.theoNhom[''];
      return !!o && o.soDanhGia + o.soHuy > 0;
    }),
    [kqLo]
  );
  const cotTheoLo = 1 + nhomDung.length + (coChuaTrongLo ? 1 : 0);

  const exportColumns = useMemo(() => cotXuatTiLeLoi(t), [t]);
  const exportData = useMemo(() => (moXuat ? dongXuatTiLeLoi(kq, kqLo, dsNhom, tenLo, t) : []), [moXuat, kq, kqLo, dsNhom, tenLo, t]);

  const chonKy = (inline: boolean) => (
    <DateRangePicker
      inline={inline}
      presets={ky.presets}
      value={ky.value}
      onChange={ky.onChange}
      customPresetId="custom"
      displayLabel={inline ? undefined : ky.displayLabel}
      className={inline ? undefined : 'shrink-0'}
    />
  );

  const toggleNhom = (khoa: string) =>
    setDangMo((cu) => {
      const moi = new Set(cu);
      if (moi.has(khoa)) moi.delete(khoa);
      else moi.add(khoa);
      return moi;
    });

  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <TongHopToolbar
        chonKy={chonKy}
        nhanKy={ky.nhan || t('danhGiaDauVao.tiLeLoi.chonKy')}
        dsChiNhanh={dsChiNhanh}
        idChiNhanh={idCn}
        onDoiChiNhanh={setIdCn}
        coSo={coSo}
        onXuat={() => setMoXuat(true)}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 space-y-5">
        {!coKy ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <CalendarRange size={40} className="mb-3 opacity-20" />
            <p className="m-0 text-sm">{t('danhGiaDauVao.tiLeLoi.chonKy')}</p>
          </div>
        ) : q.isPending || dangTaiPhamVi ? (
          <p className="text-sm text-muted-foreground">{t('danhGiaDauVao.loading')}</p>
        ) : q.isError ? (
          <p className="text-sm text-rose-600">{(q.error as Error)?.message}</p>
        ) : !coSo ? (
          <EmptyState
            title={t('danhGiaDauVao.tiLeLoi.khongCoDuLieu')}
            description={t('danhGiaDauVao.tiLeLoi.khongCoDuLieuHint')}
          />
        ) : (
          <>
            <section className="space-y-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <TieuDeBang>{t('danhGiaDauVao.tiLeLoi.theoNhom')}</TieuDeBang>
                <p className="m-0 text-caption text-muted-foreground">
                  {t('danhGiaDauVao.tiLeLoi.tongThu')}: <span className="tabular-nums text-foreground">{formatNumberVN(tongThu)}</span>
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {kq.dsNhom.map((n) => (
                  <TheNhom key={n.id ?? 'chua'} n={n} />
                ))}
              </div>
            </section>

            {chartData.length > 0 && (
              <section className="space-y-1.5">
                <TieuDeBang>{t('danhGiaDauVao.tiLeLoi.bieuDo')}</TieuDeBang>
                <div className="rounded-lg border border-border p-2">
                  <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                      <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={(v: number) => formatNumberVN(v)} />
                      <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={130} />
                      <Tooltip content={<ChartTooltip formatValue={(v) => formatNumberVN(v)} />} cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }} />
                      <Bar dataKey="so" name={t('danhGiaDauVao.tiLeLoi.colTong')} radius={[0, 4, 4, 0]} maxBarSize={26}>
                        {chartData.map((d) => (
                          <Cell key={d.key} fill={d.ma_mau} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            <section className="space-y-1.5">
              <TieuDeBang>{t('danhGiaDauVao.tiLeLoi.bangNhom')}</TieuDeBang>
              <BangTongHop>
                <thead>
                  <tr>
                    <th className={cn(TH, 'text-left min-w-[12rem]')}>{t('danhGiaDauVao.tiLeLoi.colNhom')}</th>
                    <th className={cn(TH, 'min-w-[5.5rem]')}>{t('danhGiaDauVao.tiLeLoi.colDanhGia')}</th>
                    <th className={cn(TH, 'min-w-[4.5rem]')}>{t('danhGiaDauVao.tiLeLoi.colHuy')}</th>
                    <th className={cn(TH, 'min-w-[4.5rem]')}>{t('danhGiaDauVao.tiLeLoi.colTong')}</th>
                    <th className={cn(TH, 'min-w-[5.5rem]')}>{t('danhGiaDauVao.tiLeLoi.colTiLeThu')}</th>
                    <th className={cn(TH, 'min-w-[5.5rem]')}>{t('danhGiaDauVao.tiLeLoi.colTiLeLoi')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tatCaNhom.map((n) => {
                    const khoa = n.id ?? 'chua';
                    return (
                      <HangNhom
                        key={khoa}
                        n={n}
                        ten={n.id ? n.ten : t('danhGiaDauVao.tiLeLoi.chuaPhanLoai')}
                        mo={dangMo.has(khoa)}
                        onToggle={() => toggleNhom(khoa)}
                      />
                    );
                  })}
                </tbody>
              </BangTongHop>
              <p className="m-0 text-caption text-muted-foreground">{t('danhGiaDauVao.tiLeLoi.chuThich')}</p>
            </section>

            {kq.chuaPhanLoai.so > 0 && (
              <section className="rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-semibold text-foreground">{t('danhGiaDauVao.tiLeLoi.chuaPhanLoai')}</p>
                    <p className="m-0 text-caption text-muted-foreground">
                      {t('danhGiaDauVao.tiLeLoi.chuaPhanLoaiMoTa', { so: formatNumberVN(kq.chuaPhanLoai.so) })}
                    </p>
                  </div>
                  {canCaiDat && (
                    <Button variant="outline" size="sm" onClick={() => setMoCaiDat(true)}>
                      <Settings className="w-4 h-4 mr-1.5" />
                      {t('danhGiaDauVao.tiLeLoi.moCaiDat')}
                    </Button>
                  )}
                </div>
                <ul className="m-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 list-none p-0">
                  {kq.chuaPhanLoai.chiTiet.slice(0, SO_TEN_CHUA_TOI_DA).map((ct) => (
                    <li key={ct.ten} className="flex justify-between gap-2 text-body-sm">
                      <span className="truncate text-foreground">{ct.ten}</span>
                      <span className="shrink-0 tabular-nums text-rose-600">{formatNumberVN(ct.soDanhGia + ct.soHuy)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-1.5">
              <TieuDeBang>{t('danhGiaDauVao.tiLeLoi.bangTheoLo')}</TieuDeBang>
              <BangTongHop>
                <thead>
                  <tr>
                    <th className={cn(TH, 'sticky left-0 z-20 min-w-[9rem] text-left bg-muted')}>{t('danhGiaDauVao.luoi.colLo')}</th>
                    {nhomDung.map((n) => (
                      <th key={n.id} className={cn(TH, 'min-w-[5rem]')}>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: n.ma_mau }} />
                          {n.ten}
                        </span>
                      </th>
                    ))}
                    {coChuaTrongLo && <th className={cn(TH, 'min-w-[5.5rem]')}>{t('danhGiaDauVao.tiLeLoi.chuaPhanLoai')}</th>}
                  </tr>
                </thead>
                <tbody>
                  {kqLo.map((lo) => (
                    <tr key={`${lo.id_chi_nhanh}-${lo.id_lo}`}>
                      <td className={cn(TD, 'sticky left-0 z-10 bg-card whitespace-nowrap')}>{tenLo(lo.id_lo)}</td>
                      {nhomDung.map((n) => {
                        const o = lo.theoNhom[n.id];
                        return (
                          <td key={n.id} className={cn(TD, 'text-right tabular-nums')}>
                            {fmtO(o ? o.soDanhGia + o.soHuy : 0)}
                          </td>
                        );
                      })}
                      {coChuaTrongLo && (
                        <td className={cn(TD, 'text-right tabular-nums text-rose-600')}>
                          {(() => {
                            const o = lo.theoNhom[''];
                            return fmtO(o ? o.soDanhGia + o.soHuy : 0);
                          })()}
                        </td>
                      )}
                    </tr>
                  ))}
                  {kqLo.length === 0 && (
                    <tr>
                      <td className={cn(TD, 'text-muted-foreground text-center')} colSpan={cotTheoLo}>
                        –
                      </td>
                    </tr>
                  )}
                </tbody>
              </BangTongHop>
            </section>
          </>
        )}
      </div>

      <AnimatePresence>
        {moXuat && (
          <ExportDialog
            open={moXuat}
            onClose={() => setMoXuat(false)}
            columns={exportColumns}
            data={exportData}
            fileName={`danh-gia-dau-vao-ty-le-loi-${tu}_${den}`}
            sheetName={t('danhGiaDauVao.tabs.tiLeLoi')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{moCaiDat && <CaiDatDialog initialTab="nhom-loi" onClose={() => setMoCaiDat(false)} />}</AnimatePresence>
    </div>
  );
};

export default TiLeLoiTab;
