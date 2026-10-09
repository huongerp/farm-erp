import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import Button from '../../../../components/ui/Button';
import MultiImageInput, { type ImageItem } from '../../../../components/ui/MultiImageInput';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import type { GiamSatChatLuong, ThungMau } from '../core/types';
import { useCapNhatAnhThung } from '../hooks/use-giam-sat-chat-luong';
import { useUploadAnhThung } from '../hooks/use-upload-anh-thung';
import { CLOUDINARY_READY, MAX_ANH_THUNG, MAX_MB_ANH_GOC, imageItemsToUrls, urlsToImageItems } from '../utils/anh-thung';

interface Props {
  phieu: GiamSatChatLuong;
  thung: ThungMau;
  /** Không có quyền chấm thùng / phiếu đã khoá → chỉ xem ảnh. */
  chiXem: boolean;
  onClose: () => void;
}

/** Chụp thêm / xem / xoá ảnh của một thùng đã kiểm — không đổi kết quả chấm. */
const AnhThungDialog: React.FC<Props> = ({ phieu, thung, chiXem, onClose }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ImageItem[]>(() => urlsToImageItems(thung.hinh_anh_urls));
  const { upload, dangTai } = useUploadAnhThung();
  const mutation = useCapNhatAnhThung(onClose);
  const sua = !chiXem && CLOUDINARY_READY;
  const dirty = imageItemsToUrls(items).join('|') !== thung.hinh_anh_urls.join('|');

  return (
    <GenericDrawer
      title={t('giamSatChatLuong.anhThung.title')}
      subtitle={`${phieu.so_phieu} · ${t('giamSatChatLuong.quet.thungSo', { stt: thung.stt_thung, n: phieu.so_thung_mau })}`}
      icon={<Camera className="text-primary" size={22} />}
      onClose={onClose}
      isDirty={sua && dirty}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.LARGE}
      footer={
        sua ? (
          <FormDrawerFooter
            formId="gscl-anh-thung-form"
            onCancel={onClose}
            isEdit
            isLoading={mutation.isPending || dangTai}
            saveLabel={t('common.save')}
            cancelLabel={t('common.cancel')}
          />
        ) : (
          <div className="flex justify-end w-full">
            <Button type="button" size="sm" onClick={onClose}>
              {t('common.close')}
            </Button>
          </div>
        )
      }
    >
      <form
        id="gscl-anh-thung-form"
        className="pb-2 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!sua || dangTai) return;
          mutation.mutate({ idThung: thung.id, idPhieu: phieu.id, urls: imageItemsToUrls(items) });
        }}
      >
        {!CLOUDINARY_READY && !chiXem && (
          <p className="text-xs text-muted-foreground m-0">{t('giamSatChatLuong.anhThung.chuaCauHinh')}</p>
        )}
        {sua ? (
          <MultiImageInput
            value={items}
            onChange={setItems}
            uploadFile={upload}
            maxFiles={MAX_ANH_THUNG}
            maxSizeMB={MAX_MB_ANH_GOC}
            columns={3}
            placeholder={t('giamSatChatLuong.anhThung.placeholder')}
            hint={t('giamSatChatLuong.anhThung.hint', { max: MAX_ANH_THUNG })}
          />
        ) : thung.hinh_anh_urls.length === 0 ? (
          <p className="text-sm text-muted-foreground italic m-0">{t('giamSatChatLuong.anhThung.chuaCoAnh')}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {thung.hinh_anh_urls.map((src, i) => (
              <a
                key={src}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-lg border border-border hover:ring-2 hover:ring-primary/40"
              >
                <img src={src} alt={`${i + 1}`} className="w-full aspect-square object-cover" loading="lazy" />
              </a>
            ))}
          </div>
        )}
      </form>
    </GenericDrawer>
  );
};

export default AnhThungDialog;
