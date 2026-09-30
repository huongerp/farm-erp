import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Images } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import MultiImageInput, { type ImageItem } from '../../../../components/ui/MultiImageInput';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import type { DangKyNhanHang } from '../core/types';
import { useCapNhatAnhDangKyNhanHang } from '../hooks/use-dang-ky-nhan-hang';
import { MAX_ANH_PHIEU, imageItemsToUrls, uploadAnhDangKyNhanHang, urlsToImageItems } from '../utils/anh-upload';

/** Thêm / xoá ảnh của phiếu bất cứ lúc nào (ảnh phiếu, xe, cont, niêm phong…). */
const HinhAnhDialog: React.FC<{ data: DangKyNhanHang; onClose: () => void }> = ({ data, onClose }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ImageItem[]>(() => urlsToImageItems(data.hinh_anh_urls));
  const mutation = useCapNhatAnhDangKyNhanHang(onClose);
  const dirty = imageItemsToUrls(items).join('|') !== data.hinh_anh_urls.join('|');

  return (
    <GenericDrawer
      title={t('dangKyNhanHang.anh.title')}
      subtitle={[data.so_xe, data.so_cont].filter(Boolean).join(' · ')}
      icon={<Images className="text-primary" size={22} />}
      onClose={onClose}
      isDirty={dirty}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.LARGE}
      footer={
        <FormDrawerFooter
          formId="dknh-anh-form"
          onCancel={onClose}
          isEdit
          isLoading={mutation.isPending}
          saveLabel={t('common.save')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form
        id="dknh-anh-form"
        className="pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ id: data.id, urls: imageItemsToUrls(items) });
        }}
      >
        <MultiImageInput
          value={items}
          onChange={setItems}
          uploadFile={uploadAnhDangKyNhanHang}
          maxFiles={MAX_ANH_PHIEU}
          maxSizeMB={8}
          columns={4}
          hint={t('dangKyNhanHang.anh.hint', { max: MAX_ANH_PHIEU })}
        />
      </form>
    </GenericDrawer>
  );
};

export default HinhAnhDialog;
