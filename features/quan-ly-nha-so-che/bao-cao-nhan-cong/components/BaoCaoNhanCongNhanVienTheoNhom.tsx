/**
 * Kiểu in «Danh sách theo nhóm»: mỗi chuyền chia khối Nhóm 1, Nhóm 2… (chưa chia nhóm xếp cuối),
 * mỗi khối có dòng tổng; dưới cùng bảng «Tổng hợp theo nhóm» để so năng suất giữa các nhóm.
 * Cả hai bảng `<thead>` một hàng không gộp ô → paged.js lặp tiêu đề, trang in ẩn / kéo cột được.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NGOAI_LE_CODE, type FarmBaoCaoNhanCong } from '../core/types';
import { nhomNhanVienTheoChuyen } from '../core/danh-sach-nv';
import { tongHopTheoNhom } from '../core/tong-hop-nhom';
import { formatNumberVN } from '../../../../lib/utils';
import { DongNv, LOP_BANG_NV, SO_COT_BANG_NV, TieuDeCotNv } from './BaoCaoNhanCongNhanVienBang';

interface Props {
  data: FarmBaoCaoNhanCong;
}

const BaoCaoNhanCongNhanVienTheoNhom: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const chuyen = nhomNhanVienTheoChuyen(data).map((g) => ({ ...g, nhom: tongHopTheoNhom(g.nhanVien) }));
  if (chuyen.length === 0) return null;

  const c = LOP_BANG_NV.print;
  const num = `${c.td} text-right tabular-nums`;
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
            return (
              <React.Fragment key={ct.loai_chuyen}>
                <tr>
                  <td colSpan={SO_COT_BANG_NV} className={c.group}>
                    {tt}. {t(`baoCaoNhanCong.chuyen.${ct.loai_chuyen}`)} — {t('baoCaoNhanCong.nv.soNguoi', { n: nhanVien.length })}
                    {ngoaiLe && <p className="m-0 mt-1 font-normal">{t('baoCaoNhanCong.ngoaiLe.hint')}</p>}
                  </td>
                </tr>
                {nhom.map((g) => (
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
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      <h2 className="text-[9pt] font-bold uppercase mt-3 mb-1.5 text-gray-900">{t('baoCaoNhanCong.preview.tongHopTheoNhom')}</h2>
      <table className={c.table}>
        <thead>
          <tr>
            <th className={c.th}>{t('baoCaoNhanCong.preview.colChuyen')}</th>
            <th className={c.th}>{t('baoCaoNhanCong.nvBang.nhom')}</th>
            <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.preview.colNguoiDiLam')}</th>
            <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.preview.colCongQuyDoi')}</th>
            <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nv.gioCong')}</th>
            <th className={`${c.th} text-right`}>{t('baoCaoNhanCong.nv.gioTc')}</th>
          </tr>
        </thead>
        <tbody>
          {chuyen.flatMap(({ ct, tt, nhom }) => {
            const ngoaiLe = ct.loai_chuyen === NGOAI_LE_CODE;
            return nhom.map((g) => (
              <tr key={`${ct.loai_chuyen}-${g.soNhom ?? 'chua-chia'}`}>
                <td className={c.td}>
                  {tt}. {t(`baoCaoNhanCong.chuyen.${ct.loai_chuyen}`)}
                </td>
                <td className={c.td}>{tenNhom(g.soNhom)}</td>
                <td className={num}>{g.soNguoiDiLam}</td>
                <td className={num}>{formatNumberVN(g.cong)}</td>
                <td className={num}>{gio(ngoaiLe, g.gioCong)}</td>
                <td className={num}>{gio(ngoaiLe, g.gioTc)}</td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </>
  );
};

export default BaoCaoNhanCongNhanVienTheoNhom;
