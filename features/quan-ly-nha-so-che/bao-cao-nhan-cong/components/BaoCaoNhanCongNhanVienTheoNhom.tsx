/**
 * Kiểu in «Danh sách theo nhóm»: mỗi chuyền chia khối Nhóm 1, Nhóm 2… (chưa chia nhóm xếp cuối),
 * mỗi khối có dòng tổng (kèm số thùng / NS / % đạt khi đã nhập); dưới cùng bảng «Tổng hợp theo nhóm»
 * để so năng suất giữa các nhóm + bảng thưởng năng suất nhóm.
 * Mọi bảng `<thead>` một hàng không gộp ô → paged.js lặp tiêu đề, trang in ẩn / kéo cột được.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NGOAI_LE_CODE, type FarmBaoCaoNhanCong } from '../core/types';
import { nhomNhanVienTheoChuyen } from '../core/danh-sach-nv';
import { tongHopTheoNhom } from '../core/tong-hop-nhom';
import {
  CHUYEN_THUONG_NS_NHOM,
  dsThuongNhom,
  fmtNsNhom,
  fmtTyLeNs,
  lopMauTyLeNs,
  mucTieuNsNhom,
  nangSuatNhomCuaPhieu,
  phieuCoSoThungNhom,
} from '../core/nang-suat-nhom';
import { BCSC_MUC_THUONG_NGAY } from '../../bao-cao-so-che/core/kpi-thuong-cong-thuc';
import { formatNumberVN } from '../../../../lib/utils';
import { DongNv, LOP_BANG_NV, SO_COT_BANG_NV, TieuDeCotNv, type LopBangNv } from './BaoCaoNhanCongNhanVienBang';

interface Props {
  data: FarmBaoCaoNhanCong;
}

/**
 * Bảng «Tổng hợp theo nhóm» (người đi làm, công, giờ + số thùng / NS / % đạt / thưởng khi phiếu có nhập thùng),
 * bảng «Thưởng năng suất theo nhóm» và ghi chú mục tiêu. Dùng ở trang in (`LOP_BANG_NV.print`) và chi tiết phiếu (`.screen`).
 */
export const NsNhomTongHop: React.FC<{ data: FarmBaoCaoNhanCong; c: LopBangNv }> = ({ data, c }) => {
  const { t } = useTranslation();
  const chuyen = nhomNhanVienTheoChuyen(data).map((g) => ({ ...g, nhom: tongHopTheoNhom(g.nhanVien) }));
  if (chuyen.length === 0) return null;

  const nsTheoChuyen = nangSuatNhomCuaPhieu(data);
  const coNs = phieuCoSoThungNhom(nsTheoChuyen);
  const dsThuong = dsThuongNhom(nsTheoChuyen);
  const manHinh = c === LOP_BANG_NV.screen;
  const num = `${c.td} text-right tabular-nums`;
  const tenNhom = (soNhom: number | null) =>
    soNhom == null ? t('baoCaoNhanCong.preview.chuaChiaNhom') : t('baoCaoNhanCong.preview.nhomN', { n: soNhom });
  const tenChuyen = (tt: string, loai: string) => `${tt}. ${t(`baoCaoNhanCong.chuyen.${loai}`)}`;
  // Ngoại lệ không quy đổi giờ → giờ hiện «—».
  const gio = (ngoaiLe: boolean, v: number) => (ngoaiLe ? '—' : formatNumberVN(v));
  const tieuDeCon = manHinh ? 'mt-3 mb-1.5 text-sm font-semibold text-foreground' : 'text-[9pt] font-bold uppercase mt-3 mb-1.5 text-gray-900';
  const tongCong = dsThuong.reduce((s, p) => s + p.cong, 0);
  const tongThuong = dsThuong.reduce((s, p) => s + p.thuong, 0);

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
                  <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nsNhom.thuongNguoi')}</th>
                  <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nsNhom.tongThuongNhom')}</th>
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
                const coThuong = coThung && ct.loai_chuyen === CHUYEN_THUONG_NS_NHOM;
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
                        <td className={num}>{coThuong ? formatNumberVN(ns.thuongCaNgay) : '—'}</td>
                        <td className={num}>{coThuong ? formatNumberVN(ns.tongThuong) : '—'}</td>
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
          <h3 className={tieuDeCon}>{t('baoCaoNhanCong.nsNhom.thuongTheoNhom')}</h3>
          <div className={c.wrap}>
            <table className={c.table}>
              <thead>
                <tr>
                  <th className={c.th}>{t('baoCaoNhanCong.nsNhom.colHoTen')}</th>
                  <th className={c.th}>{t('baoCaoNhanCong.nsNhom.colChuyen')}</th>
                  <th className={c.th}>{t('baoCaoNhanCong.nsNhom.colNhom')}</th>
                  <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nsNhom.colCong')}</th>
                  <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nsNhom.colThuong')}</th>
                </tr>
              </thead>
              <tbody>
                {dsThuong.map((p, i) => (
                  <tr key={`${p.tt}-${p.soNhom}-${i}`}>
                    <td className={c.td}>{p.ho_ten}</td>
                    <td className={c.td}>{tenChuyen(p.tt, p.loai_chuyen)}</td>
                    <td className={c.td}>{tenNhom(p.soNhom)}</td>
                    <td className={num}>{formatNumberVN(p.cong)}</td>
                    <td className={num}>{formatNumberVN(p.thuong)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className={c.total}>
                    {t('baoCaoNhanCong.nsNhom.tong')}
                  </td>
                  <td className={`${c.total} text-right tabular-nums`}>{formatNumberVN(tongCong)}</td>
                  <td className={`${c.total} text-right tabular-nums`}>{formatNumberVN(tongThuong)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {coNs && (
        <p className={`m-0 mt-1.5 break-inside-avoid ${manHinh ? 'text-xs text-muted-foreground' : 'text-[7.5pt] text-gray-600'}`}>
          {t('baoCaoNhanCong.nsNhom.ghiChuMucTieu', {
            mucTieu: formatNumberVN(mucTieuNsNhom(data.muc_tieu_ns_nhom)),
            muc: formatNumberVN(BCSC_MUC_THUONG_NGAY.tia.nangSuat),
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
