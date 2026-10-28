/**
 * Drawer con của Detail phiếu, dùng chung cho bảng «Theo lô» và «Chi tiết đánh giá»: lô (`DgdvLoDetail`) →
 * dòng (`DgdvDongDetail`, chỉ xem) → sửa / thêm dòng (`DgdvDongForm`) hoặc «Nhập theo lô». Tầng chồng tính
 * theo drawer đang mở bên dưới; xoá dòng hỏi xác nhận ở đây.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import { useConfirmStore } from '../../../../../store/useConfirmStore';
import { formatYmdToDisplay } from '../../../../../lib/utils';
import type { DgdvPhieuDayDu } from '../../core/types';
import type { DgdvDongPhang } from '../../core/chi-tiet-dong';
import { nhanCotDay } from '../../core/bang-tinh';
import { useXoaDongDgdv } from '../../hooks/use-danh-gia-dau-vao';
import { useMauDay } from '../../hooks/use-danh-muc-dgdv';
import DgdvLoDetail from './DgdvLoDetail';
import DgdvDongDetail from './DgdvDongDetail';
import DgdvDongForm from './DgdvDongForm';
import DgdvNhapTheoLoDrawer from './DgdvNhapTheoLoDrawer';

export interface DgdvChiTietMo {
  xemLo: (idPhieuLo: string) => void;
  xemDong: (r: DgdvDongPhang) => void;
  themDong: () => void;
  suaDong: (r: DgdvDongPhang) => void;
  xoaDong: (r: DgdvDongPhang) => void;
  /** null = lô đầu tiên của phiếu */
  nhapTheoLo: (idPhieuLo: string | null) => void;
}

export function useDgdvChiTietDrawers(phieu: DgdvPhieuDayDu, canNhap: boolean, stackLevel: number) {
  const { t } = useTranslation();
  const confirm = useConfirmStore((s) => s.confirm);
  const xoa = useXoaDongDgdv();
  const { mauTheoId } = useMauDay();
  const [lo, setLo] = useState<string | null>(null);
  const [dong, setDong] = useState<DgdvDongPhang | null>(null);
  const [sua, setSua] = useState<DgdvDongPhang | 'moi' | null>(null);
  const [nhapLo, setNhapLo] = useState<{ id: string | null } | null>(null);

  const nhanDay = (r: DgdvDongPhang) => {
    const c = r.id_cot ? phieu.cot.find((x) => x.id === r.id_cot) : undefined;
    return c ? nhanCotDay(c, mauTheoId, t('danhGiaDauVao.luoi.xeDoi')) : t('danhGiaDauVao.luoi.dutDay');
  };

  const mo: DgdvChiTietMo = {
    xemLo: setLo,
    xemDong: setDong,
    themDong: () => setSua('moi'),
    suaDong: (r) => {
      setDong(null);
      setSua(r);
    },
    xoaDong: (r) =>
      confirm({
        title: t('danhGiaDauVao.chiTiet.xoaTitle'),
        message: t('danhGiaDauVao.chiTiet.xoaMessage', { lo: r.ten_lo ?? '', day: nhanDay(r), ngay: formatYmdToDisplay(r.ngay) }),
        variant: 'danger',
        confirmText: t('common.delete'),
        onConfirm: async () => {
          await xoa.mutateAsync(r);
          setDong(null);
        },
      }),
    nhapTheoLo: (id) => setNhapLo({ id }),
  };

  const tangLo = stackLevel + 1;
  const tangTren = tangLo + (lo ? 1 : 0);

  const drawers = (
    <>
      <AnimatePresence>
        {lo && (
          <DgdvLoDetail
            phieu={phieu}
            idPhieuLo={lo}
            canNhap={canNhap}
            onClose={() => setLo(null)}
            onXemDong={setDong}
            onNhapTheoLo={() => setNhapLo({ id: lo })}
            stackLevel={tangLo}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {dong && (
          <DgdvDongDetail
            phieu={phieu}
            dong={dong}
            canNhap={canNhap}
            onClose={() => setDong(null)}
            onSua={() => mo.suaDong(dong)}
            onXoa={() => mo.xoaDong(dong)}
            stackLevel={tangTren}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {sua && canNhap && (
          <DgdvDongForm phieu={phieu} dong={sua === 'moi' ? null : sua} onClose={() => setSua(null)} stackLevel={tangTren} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {nhapLo && canNhap && (
          <DgdvNhapTheoLoDrawer phieu={phieu} idPhieuLo={nhapLo.id} onClose={() => setNhapLo(null)} stackLevel={tangTren} />
        )}
      </AnimatePresence>
    </>
  );

  return { mo, drawers };
}
