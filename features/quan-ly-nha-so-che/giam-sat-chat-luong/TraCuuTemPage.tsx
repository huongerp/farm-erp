import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { docMaTem } from './core/qr';
import { traCuuTemCongKhai } from './services/giam-sat-chat-luong-service';

/** Một dòng thông tin; giá trị trống → «—». */
const Dong: React.FC<{ nhan: string; giaTri: string | null }> = ({ nhan, giaTri }) => (
  <div className="flex items-start justify-between gap-4 px-4 py-3">
    <dt className="shrink-0 text-sm font-medium text-gray-500">{nhan}</dt>
    <dd className="break-words text-right text-sm font-semibold text-gray-900">
      {giaTri?.trim() ? giaTri : '—'}
    </dd>
  </div>
);

/**
 * Trang tra cứu công khai khi quét QR trên tem thùng mẫu GSCL: mở `/qr/<ma_tem>`,
 * KHÔNG cần đăng nhập, không dùng layout app. Chỉ hiện 3 trường không nhạy cảm
 * (tên hàng, mã hàng, cây hàng) + xuất xứ cố định — không lộ kết luận QC,
 * người tạo hay id.
 */
const TraCuuTemPage: React.FC = () => {
  const { t } = useTranslation();
  const { maTem: raw } = useParams<{ maTem: string }>();
  const maTem = useMemo(() => docMaTem(raw), [raw]);

  useEffect(() => {
    document.title = t('giamSatChatLuong.traCuu.tieuDe');
  }, [t]);

  const { data, isLoading } = useQuery({
    queryKey: ['giamSatChatLuong', 'traCuuTem', maTem],
    queryFn: () => traCuuTemCongKhai(maTem as string),
    enabled: maTem != null,
    retry: false,
  });

  const khongTimThay = maTem == null || (!isLoading && !data);

  return (
    <div className="flex min-h-screen justify-center bg-gray-100 px-4 py-6 sm:py-10">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-gray-300 bg-white shadow-sm">
          <h1 className="border-b border-gray-200 px-4 py-4 text-center text-base font-bold uppercase tracking-wide text-gray-900">
            {t('giamSatChatLuong.traCuu.tieuDe')}
          </h1>

          {isLoading ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10" aria-busy="true">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
              <p className="text-sm text-gray-500">{t('giamSatChatLuong.traCuu.dangTai')}</p>
            </div>
          ) : khongTimThay || !data ? (
            <p className="px-4 py-10 text-center text-sm text-gray-500">
              {t('giamSatChatLuong.traCuu.khongTimThay')}
            </p>
          ) : (
            <dl className="divide-y divide-gray-200">
              <Dong nhan={t('giamSatChatLuong.traCuu.sanPham')} giaTri={data.ten_hang_hoa} />
              <Dong nhan={t('giamSatChatLuong.traCuu.maHang')} giaTri={data.ma_hang_hoa} />
              <Dong nhan={t('giamSatChatLuong.traCuu.cayHang')} giaTri={data.ma_cay_hang} />
              <Dong nhan={t('giamSatChatLuong.traCuu.xuatXu')} giaTri={t('giamSatChatLuong.traCuu.vietNam')} />
            </dl>
          )}
        </div>
      </div>
    </div>
  );
};

export default TraCuuTemPage;
