import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Images } from 'lucide-react';
import GenericDrawer from '../../../../components/shared/GenericDrawer';
import FormDrawerFooter from '../../../../components/shared/FormDrawerFooter';
import MultiImageInput, { type ImageItem } from '../../../../components/ui/MultiImageInput';
import { DIALOG_SIZE } from '../../../../lib/dialog-sizes';
import type { DangKyThamQuan } from '../core/types';
import { useCapNhatAnhDangKyThamQuan } from '../hooks/use-dang-ky-tham-quan';
import { MAX_ANH_PHIEU, imageItemsToUrls, uploadAnhDangKyThamQuan, urlsToImageItems } from '../utils/anh-upload';

/** Thêm / xoá ảnh của phiếu bất cứ lúc nào (phiếu giấy đã ký, ảnh đoàn…). */
const HinhAnhDialog: React.FC<{ data: DangKyThamQuan; onClose: () => void }> = ({ data, onClose }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<ImageItem[]>(() => urlsToImageItems(data.hinh_anh_urls));
  const mutation = useCapNhatAnhDangKyThamQuan(onClose);
  const dirty = imageItemsToUrls(items).join('|') !== data.hinh_anh_urls.join('|');

  return (
    <GenericDrawer
      title={t('dangKyThamQuan.anh.title')}
      subtitle={data.nguoi_dai_dien ?? undefined}
      icon={<Images className="text-primary" size={22} />}
      onClose={onClose}
      isDirty={dirty}
      variant="modal"
      maxWidthClass={DIALOG_SIZE.LARGE}
      footer={
        <FormDrawerFooter
          formId="dktq-anh-form"
          onCancel={onClose}
          isEdit
          isLoading={mutation.isPending}
          saveLabel={t('common.save')}
          cancelLabel={t('common.cancel')}
        />
      }
    >
      <form
        id="dktq-anh-form"
        className="pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate({ id: data.id, urls: imageItemsToUrls(items) });
        }}
      >
        <MultiImageInput
          value={items}
          onChange={setItems}
          uploadFile={uploadAnhDangKyThamQuan}
          maxFiles={MAX_ANH_PHIEU}
          maxSizeMB={8}
          columns={4}
          hint={t('dangKyThamQuan.form.anhHint')}
        />
      </form>
    </GenericDrawer>
  );
};

export default HinhAnhDialog;
