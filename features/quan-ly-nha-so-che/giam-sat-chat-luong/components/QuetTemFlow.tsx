import React, { lazy, Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { KetQuaQuet } from '../../../../components/shared/QrScannerDialog';
import { docMaTem } from '../core/qr';
import { coTheKiemThung } from '../core/trang-thai';
import type { GiamSatChatLuong, ThungMau } from '../core/types';
import { getGsclById, getThungTheoMaTem } from '../services/giam-sat-chat-luong-service';
import NhapKetQuaThungDialog from './NhapKetQuaThungDialog';

const QrScannerDialog = lazy(() => import('../../../../components/shared/QrScannerDialog'));

interface Props {
  viewAll: boolean;
  allowedBranchIds: string[];
  capCao: boolean;
  /** Mở từ chi tiết một phiếu: chỉ nhận tem của phiếu đó + cho chọn tay thùng. */
  phieu?: GiamSatChatLuong;
  thungCuaPhieu?: ThungMau[];
  onClose: () => void;
}

interface DaTim {
  phieu: GiamSatChatLuong;
  thung: ThungMau;
}

const chuanHoa = (raw: string) => raw.trim() || null;

/** Quét tem → mở form chấm đúng thùng đó → lưu (hoặc lưu & quét tiếp). */
const QuetTemFlow: React.FC<Props> = ({ viewAll, allowedBranchIds, capCao, phieu, thungCuaPhieu, onClose }) => {
  const { t } = useTranslation();
  const [daTim, setDaTim] = useState<DaTim | null>(null);
  const timRef = useRef<DaTim | null>(null);

  const onDetected = useCallback(
    async (raw: string): Promise<KetQuaQuet> => {
      const maTem = docMaTem(raw);
      if (!maTem) return { ok: false, message: t('giamSatChatLuong.quet.khongPhaiTem', { ma: raw }) };
      const thung = await getThungTheoMaTem(maTem);
      if (!thung) return { ok: false, message: t('giamSatChatLuong.quet.khongTimThay', { ma: maTem }) };
      if (phieu && thung.id_phieu !== phieu.id) {
        return { ok: false, message: t('giamSatChatLuong.quet.temPhieuKhac', { ma: maTem }) };
      }
      const p = phieu && phieu.id === thung.id_phieu ? phieu : await getGsclById(thung.id_phieu);
      if (!p) return { ok: false, message: t('giamSatChatLuong.quet.khongTimThay', { ma: maTem }) };
      if (!viewAll && !allowedBranchIds.includes(p.id_chi_nhanh)) {
        return { ok: false, message: t('giamSatChatLuong.quet.khongCoQuyenFarm', { farm: p.ten_chi_nhanh ?? '' }) };
      }
      if (!coTheKiemThung(p.trang_thai, capCao)) {
        return { ok: false, message: t(`giamSatChatLuong.quet.khongKiemDuoc_${p.trang_thai}`, { so: p.so_phieu }) };
      }
      timRef.current = { phieu: p, thung };
      return { ok: true, message: t('giamSatChatLuong.quet.daTim', { so: p.so_phieu, stt: thung.stt_thung, n: p.so_thung_mau }) };
    },
    [t, phieu, viewAll, allowedBranchIds, capCao]
  );

  /** Scanner `mot-lan` tự đóng khi quét đúng — lúc đó chuyển sang form chấm. */
  const dongScanner = useCallback(() => {
    if (timRef.current) {
      setDaTim(timRef.current);
      timRef.current = null;
    } else onClose();
  }, [onClose]);

  const chonTay = useMemo(
    () =>
      thungCuaPhieu && phieu
        ? {
            label: t('giamSatChatLuong.quet.chonTay'),
            placeholder: t('giamSatChatLuong.quet.chonThung'),
            searchPlaceholder: t('giamSatChatLuong.quet.goMaTem'),
            options: thungCuaPhieu.map((x) => ({
              value: x.ma_tem,
              label: t('giamSatChatLuong.quet.thungSo', { stt: x.stt_thung, n: phieu.so_thung_mau }),
              subLabel: `${x.ma_tem}${x.da_kiem ? ` · ${t('giamSatChatLuong.quet.daKiem')}` : ''}`,
            })),
            toCode: (v: string) => v,
          }
        : undefined,
    [thungCuaPhieu, phieu, t]
  );

  if (daTim) {
    return (
      <NhapKetQuaThungDialog
        phieu={daTim.phieu}
        thung={daTim.thung}
        onClose={onClose}
        onQuetTiep={() => setDaTim(null)}
      />
    );
  }

  return (
    <Suspense fallback={null}>
      <QrScannerDialog
        mode="mot-lan"
        title={phieu ? t('giamSatChatLuong.quet.titlePhieu', { so: phieu.so_phieu }) : t('giamSatChatLuong.quet.title')}
        subtitle={t('giamSatChatLuong.quet.subtitle')}
        chuanHoa={chuanHoa}
        onDetected={onDetected}
        chonTay={chonTay}
        onClose={dongScanner}
      />
    </Suspense>
  );
};

export default QuetTemFlow;
