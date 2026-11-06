/**
 * In hàng loạt — route `/in-hang-loat?mau=<khoá>&ids=1,2,3`. Mỗi chứng từ bắt đầu trang mới,
 * mang dấu chìm riêng theo trạng thái; dùng chung `PhieuInPage` và cài đặt in của mẫu đơn lẻ
 * (cùng `mauKey`). Danh mục mẫu: `in-hang-loat.ts`.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loaiDauChimNhieu } from '../../../lib/phieu-in/dau-chim';
import ModulePermissionGuard from '../ModulePermissionGuard';
import PhieuInPage from './PhieuInPage';
import { DANH_MUC_IN_HANG_LOAT, type MauInHangLoat } from './in-hang-loat';

const khongLoc = () => () => true;

/** Tách riêng để gọi `mau.useLoc` vô điều kiện (mỗi mẫu một component, không đổi giữa các lần render). */
function NoiDungHangLoat({ mau, duLieu, ids, tenMau }: { mau: MauInHangLoat; duLieu: unknown[]; ids: string[]; tenMau: string }) {
  const { t } = useTranslation();
  const useLoc = mau.useLoc ?? khongLoc;
  const loc = useLoc();
  const hien = useMemo(() => (loc ? duLieu.filter(loc) : []), [loc, duLieu]);
  const NoiDung = mau.NoiDung;
  const tieuDe = `${t(mau.tieuDeKey)} (${hien.length})`;
  return (
    <PhieuInPage
      title={tieuDe}
      mauKey={mau.mauKey}
      macDinh={mau.macDinh}
      coChuGocPt={mau.coChuGocPt}
      nhanLien={mau.nhanLien}
      tenFile={`${tenMau}_${ids.length}_chung_tu`}
      duongDanVe={mau.duongDanVe}
      isLoading={loc === null}
      loi={loc !== null && hien.length === 0 ? t('common.phieuIn.hangLoat_khongCo') : null}
    >
      {hien.map((d) => {
        const loai = loaiDauChimNhieu(...(mau.trangThai?.(d) ?? []));
        return (
          <section key={mau.khoa(d)} className="phieu-in-tai-lieu" data-in-dau-chim={loai ? t(`common.phieuIn.dauChim_${loai}`) : undefined}>
            <NoiDung duLieu={d} />
          </section>
        );
      })}
    </PhieuInPage>
  );
}

const TrangInHangLoat: React.FC = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const khoaMau = params.get('mau') ?? '';
  const idsChuoi = params.get('ids') ?? '';
  const ids = useMemo(
    () => [...new Set(idsChuoi.split(',').map((s) => s.trim()).filter(Boolean))],
    [idsChuoi]
  );
  const [kq, setKq] = useState<{ khoa: string; mau: MauInHangLoat; duLieu: unknown[] } | { khoa: string; loi: string } | null>(null);

  useEffect(() => {
    let huy = false;
    const tai = DANH_MUC_IN_HANG_LOAT[khoaMau];
    const khoa = `${khoaMau}|${idsChuoi}`;
    if (!tai || ids.length === 0) return;
    (async () => {
      try {
        const mau = await tai();
        const duLieu = await mau.taiNhieu(ids);
        if (!huy) setKq({ khoa, mau, duLieu });
      } catch (e) {
        if (!huy) setKq({ khoa, loi: e instanceof Error && e.message ? e.message : t('common.phieuIn.hangLoat_loiTai') });
      }
    })();
    return () => {
      huy = true;
    };
  }, [khoaMau, idsChuoi, ids, t]);

  const loiTruoc = !DANH_MUC_IN_HANG_LOAT[khoaMau]
    ? t('common.phieuIn.hangLoat_khongHoTro')
    : ids.length === 0
      ? t('common.phieuIn.hangLoat_chuaChon')
      : null;
  const hienTai = kq && kq.khoa === `${khoaMau}|${idsChuoi}` ? kq : null;

  if (loiTruoc || !hienTai || 'loi' in hienTai) {
    return (
      <PhieuInPage
        title={t('common.phieuIn.hangLoat')}
        mauKey={khoaMau || 'in-hang-loat'}
        tenFile="in-hang-loat"
        duongDanVe="/"
        isLoading={!loiTruoc && !hienTai}
        loi={loiTruoc ?? (hienTai && 'loi' in hienTai ? hienTai.loi : null)}
      >
        {null}
      </PhieuInPage>
    );
  }

  const noiDung = <NoiDungHangLoat key={khoaMau} mau={hienTai.mau} duLieu={hienTai.duLieu} ids={ids} tenMau={khoaMau} />;
  return hienTai.mau.moduleId ? <ModulePermissionGuard moduleId={hienTai.mau.moduleId}>{noiDung}</ModulePermissionGuard> : noiDung;
};

export default TrangInHangLoat;
