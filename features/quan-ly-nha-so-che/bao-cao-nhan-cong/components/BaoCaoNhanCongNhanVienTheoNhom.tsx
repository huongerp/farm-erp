/**
 * Kiểu in «Danh sách theo nhóm»: mỗi chuyền chia khối Nhóm 1, Nhóm 2… (chưa chia nhóm xếp cuối),
 * mỗi khối có dòng tổng (kèm số thùng / NS / % đạt khi đã nhập); dưới cùng bảng «Tổng hợp theo nhóm»
 * để so năng suất giữa các nhóm + bảng thưởng vượt thùng của công nhân (core/thuong-vuot-thung.ts).
 * Mọi bảng `<thead>` một hàng không gộp ô → paged.js lặp tiêu đề, trang in ẩn / kéo cột được.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NGOAI_LE_CODE, type FarmBaoCaoNhanCong } from '../core/types';
import { nhomNhanVienTheoChuyen } from '../core/danh-sach-nv';
import { tongHopTheoNhom } from '../core/tong-hop-nhom';
import { fmtNsNhom, fmtTyLeNs, lopMauTyLeNs, mucTieuNsNhom, nangSuatNhomCuaPhieu, phieuCoSoThungNhom } from '../core/nang-suat-nhom';
import { dsThuongVuotPhieu, thuongVuotCuaPhieu, vuotTheoChuyenNhom } from '../core/thuong-vuot-thung';
import { useCaiDatThuongVuot, useViTriKhongThuongVuot } from '../hooks/use-thuong-vuot';
import { formatNumberVN } from '../../../../lib/utils';
import { DongNv, LOP_BANG_NV, SO_COT_BANG_NV, TieuDeCotNv, type LopBangNv } from './BaoCaoNhanCongNhanVienBang';

interface Props {
  data: FarmBaoCaoNhanCong;
}

/**
 * Bảng «Tổng hợp theo nhóm» (người đi làm, công, giờ + số thùng / NS / % đạt / thưởng vượt khi phiếu có nhập thùng),
 * bảng «Thưởng vượt thùng» từng công nhân và ghi chú cách tính. Dùng ở trang in (`LOP_BANG_NV.print`) và chi tiết
 * phiếu (`.screen`). Trang in chờ cài đặt thưởng tải xong rồi mới dàn trang (BaoCaoNhanCongPreviewPage).
 */
export const NsNhomTongHop: React.FC<{ data: FarmBaoCaoNhanCong; c: LopBangNv }> = ({ data, c }) => {
  const { t } = useTranslation();
  const { caiDat } = useCaiDatThuongVuot(data.id_chi_nhanh);
  const viTriLoai = useViTriKhongThuongVuot();
  const chuyen = nhomNhanVienTheoChuyen(data).map((g) => ({ ...g, nhom: tongHopTheoNhom(g.nhanVien) }));
  if (chuyen.length === 0) return null;

  const nsTheoChuyen = nangSuatNhomCuaPhieu(data);
  const coNs = phieuCoSoThungNhom(nsTheoChuyen);
  const vuotPhieu = thuongVuotCuaPhieu(data, caiDat, viTriLoai);
  const vuotTheoChuyen = vuotTheoChuyenNhom(vuotPhieu);
  const dsThuong = dsThuongVuotPhieu(vuotPhieu);
  const ttTheoLoai = new Map(chuyen.map((g) => [g.ct.loai_chuyen, g.tt]));
  const manHinh = c === LOP_BANG_NV.screen;
  const num = `${c.td} text-right tabular-nums`;
  const tenNhom = (soNhom: number | null) =>
    soNhom == null ? t('baoCaoNhanCong.preview.chuaChiaNhom') : t('baoCaoNhanCong.preview.nhomN', { n: soNhom });
  const tenChuyen = (tt: string, loai: string) => `${tt}. ${t(`baoCaoNhanCong.chuyen.${loai}`)}`;
  // Ngoại lệ không quy đổi giờ → giờ hiện «—».
  const gio = (ngoaiLe: boolean, v: number) => (ngoaiLe ? '—' : formatNumberVN(v));
  const tieuDeCon = manHinh ? 'mt-3 mb-1.5 text-sm font-semibold text-foreground' : 'text-[9pt] font-bold uppercase mt-3 mb-1.5 text-gray-900';
  const tongGio = dsThuong.reduce((s, p) => s + p.gioCong, 0);
  const tongThuong = dsThuong.reduce((s, p) => s + p.tien, 0);

  return (
    <>
      <div className={c.wrap}>
        <table className={c.table}>
          <thead>
            <tr>
              <th className={c.th}>{t('baoCaoNhanCong.preview.colChuyen')}</th>
              <th className={c.th}>{t('baoCaoNhanCong.nvBang.nhom')}</th>
              <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.preview.colNguoiDiLam')}</th>
              <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.preview.colCongQuyDoi')}</th>
              <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nv.gioCong')}</th>
              <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nv.gioTc')}</th>
              {coNs && (
                <>
                  <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nsNhom.soThung')}</th>
                  <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nsNhom.nsDonVi')}</th>
                  <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nsNhom.tyLeDat')}</th>
                  <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.vuot.thungVuot')}</th>
                  <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.vuot.thuongVuotNhom')}</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {chuyen.flatMap(({ ct, tt, nhom }) => {
              const ngoaiLe = ct.loai_chuyen === NGOAI_LE_CODE;
              const theoNhom = nsTheoChuyen.find((x) => x.tt === tt)?.theoNhom;
              return nhom.map((g) => {
                const ns = g.soNhom == null ? undefined : theoNhom?.get(g.soNhom);
                const coThung = ns?.soThung != null;
                const vuot = g.soNhom == null ? undefined : vuotTheoChuyen.get(ct.loai_chuyen)?.get(g.soNhom)?.ketQua;
                return (
                  <tr key={`${ct.loai_chuyen}-${g.soNhom ?? 'chua-chia'}`}>
                    <td className={c.td}>{tenChuyen(tt, ct.loai_chuyen)}</td>
                    <td className={c.td}>{tenNhom(g.soNhom)}</td>
                    <td className={num}>{g.soNguoiDiLam}</td>
                    <td className={num}>{formatNumberVN(g.cong)}</td>
                    <td className={num}>{gio(ngoaiLe, g.gioCong)}</td>
                    <td className={num}>{gio(ngoaiLe, g.gioTc)}</td>
                    {coNs && (
                      <>
                        <td className={num}>{coThung ? formatNumberVN(ns.soThung) : '—'}</td>
                        <td className={num}>{coThung ? fmtNsNhom(ns.ns) : '—'}</td>
                        <td className={`${num} ${manHinh && coThung ? lopMauTyLeNs(ns.tyLe) : ''}`}>{coThung ? fmtTyLeNs(ns.tyLe) : '—'}</td>
                        <td className={num}>{vuot ? formatNumberVN(vuot.thungVuot, { maxFractionDigits: 2 }) : '—'}</td>
                        <td className={num}>{vuot ? formatNumberVN(Math.round(vuot.tien)) : '—'}</td>
                      </>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>

      {dsThuong.length > 0 && (
        <>
          <h3 className={tieuDeCon}>{t('baoCaoNhanCong.vuot.thuongTheoNguoi')}</h3>
          <div className={c.wrap}>
            <table className={c.table}>
              <thead>
                <tr>
                  <th className={c.th}>{t('baoCaoNhanCong.nsNhom.colHoTen')}</th>
                  <th className={c.th}>{t('baoCaoNhanCong.nsNhom.colChuyen')}</th>
                  <th className={c.th}>{t('baoCaoNhanCong.nsNhom.colNhom')}</th>
                  <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nv.gioCong')}</th>
                  <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nsNhom.colThuong')}</th>
                </tr>
              </thead>
              <tbody>
                {dsThuong.map((p, i) => (
                  <tr key={`${p.loai_chuyen}-${p.soNhom}-${i}`}>
                    <td className={c.td}>{p.ho_ten}</td>
                    <td className={c.td}>{tenChuyen(ttTheoLoai.get(p.loai_chuyen) ?? '', p.loai_chuyen)}</td>
                    <td className={c.td}>{tenNhom(p.soNhom)}</td>
                    <td className={num}>{formatNumberVN(p.gioCong)}</td>
                    <td className={num}>{formatNumberVN(p.tien)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className={c.total}>
                    {t('baoCaoNhanCong.nsNhom.tong')}
                  </td>
                  <td className={`${c.total} text-right tabular-nums`}>{formatNumberVN(tongGio)}</td>
                  <td className={`${c.total} text-right tabular-nums`}>{formatNumberVN(tongThuong)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {coNs && (
        <p className={`m-0 mt-1.5 break-inside-avoid ${manHinh ? 'text-xs text-muted-foreground' : 'text-[7.5pt] text-gray-600'}`}>
          {t('baoCaoNhanCong.vuot.ghiChuMucTieu', {
            mucTieu: formatNumberVN(mucTieuNsNhom(data.muc_tieu_ns_nhom)),
            nguongPct: formatNumberVN(caiDat.nguongPct, { maxFractionDigits: 2 }),
            donGia: formatNumberVN(caiDat.donGia),
          })}
        </p>
      )}
    </>
  );
};

const BaoCaoNhanCongNhanVienTheoNhom: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const chuyen = nhomNhanVienTheoChuyen(data).map((g) => ({ ...g, nhom: tongHopTheoNhom(g.nhanVien) }));
  if (chuyen.length === 0) return null;

  const nsTheoChuyen = nangSuatNhomCuaPhieu(data);
  const c = LOP_BANG_NV.print;
  const tenNhom = (soNhom: number | null) =>
    soNhom == null ? t('baoCaoNhanCong.preview.chuaChiaNhom') : t('baoCaoNhanCong.preview.nhomN', { n: soNhom });
  // Ngoại lệ không quy đổi giờ → giờ hiện «—».
  const gio = (ngoaiLe: boolean, v: number) => (ngoaiLe ? '—' : formatNumberVN(v));
  let stt = 0;

  return (
    <>
      <table className={c.table}>
        <thead>
          <TieuDeCotNv c={c} />
        </thead>
        <tbody>
          {chuyen.map(({ ct, tt, nhanVien, nhom }) => {
            const ngoaiLe = ct.loai_chuyen === NGOAI_LE_CODE;
            const theoNhom = nsTheoChuyen.find((x) => x.tt === tt)?.theoNhom;
            return (
              <React.Fragment key={ct.loai_chuyen}>
                <tr>
                  <td colSpan={SO_COT_BANG_NV} className={c.group}>
                    {tt}. {t(`baoCaoNhanCong.chuyen.${ct.loai_chuyen}`)} — {t('baoCaoNhanCong.nv.soNguoi', { n: nhanVien.length })}
                    {ngoaiLe && <p className="m-0 mt-1 font-normal">{t('baoCaoNhanCong.ngoaiLe.hint')}</p>}
                  </td>
                </tr>
                {nhom.map((g) => {
                  const ns = g.soNhom == null ? undefined : theoNhom?.get(g.soNhom);
                  return (
                    <React.Fragment key={g.soNhom ?? 'chua-chia'}>
                      <tr>
                        <td colSpan={SO_COT_BANG_NV} className={`${c.td} font-semibold`}>
                          {t('baoCaoNhanCong.preview.khoiNhom', { nhom: tenNhom(g.soNhom), n: g.soNguoi })}
                        </td>
                      </tr>
                      {g.nhanVien.map((nv) => (
                        <DongNv key={nv.id} c={c} nv={nv} stt={++stt} ngoaiLe={ngoaiLe} />
                      ))}
                      <tr>
                        <td colSpan={SO_COT_BANG_NV} className={`${c.td} font-semibold italic`}>
                          {t('baoCaoNhanCong.preview.tongNhom', {
                            nhom: tenNhom(g.soNhom),
                            diLam: g.soNguoiDiLam,
                            cong: formatNumberVN(g.cong),
                            gioCong: gio(ngoaiLe, g.gioCong),
                            gioTc: gio(ngoaiLe, g.gioTc),
                          })}
                          {ns?.soThung != null &&
                            t('baoCaoNhanCong.nsNhom.tongNhomNs', { thung: formatNumberVN(ns.soThung), nangSuat: fmtNsNhom(ns.ns), tyLe: fmtTyLeNs(ns.tyLe) })}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      <h2 className="text-[9pt] font-bold uppercase mt-3 mb-1.5 text-gray-900">{t('baoCaoNhanCong.preview.tongHopTheoNhom')}</h2>
      <NsNhomTongHop data={data} c={c} />
    </>
  );
};

export default BaoCaoNhanCongNhanVienTheoNhom;
