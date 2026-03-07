import React from 'react';
import { Save, ArrowRight, UserPlus } from 'lucide-react';
import Button from '../ui/Button';
import { BTN_CANCEL, BTN_SAVE, BTN_CREATE } from '../../lib/button-labels';

export interface FormDrawerFooterProps {
  /** Id của form để submit từ ngoài (nút Lưu/Tạo gửi submit cho form này) */
  formId: string;
  onCancel: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
  /** Nhãn nút Lưu khi sửa (mặc định BTN_SAVE) */
  saveLabel?: string;
  /** Nhãn nút Tạo khi thêm mới (mặc định BTN_CREATE) */
  createLabel?: string;
  /** Nhãn nút Hủy (mặc định BTN_CANCEL) */
  cancelLabel?: string;
  /** Icon bên trái nút Tạo mới (mặc định UserPlus, chuẩn module Nhân viên) */
  createIcon?: React.ReactNode;
}

/**
 * Footer chuẩn cho form trong drawer – theo chuẩn module Nhân viên:
 * Wrapper flex justify-between, Hủy (trái), Lưu/Tạo (phải), dùng BTN_CANCEL/SAVE/CREATE.
 */
export const FormDrawerFooter: React.FC<FormDrawerFooterProps> = ({
  formId,
  onCancel,
  isLoading = false,
  isEdit = false,
  saveLabel,
  createLabel,
  cancelLabel,
  createIcon,
}) => {
  const resolvedCancel = cancelLabel ?? BTN_CANCEL();
  const resolvedSave = saveLabel ?? BTN_SAVE();
  const resolvedCreate = createLabel ?? BTN_CREATE();
  const resolvedCreateIcon = createIcon ?? <UserPlus className="mr-2 h-4 w-4" />;

  return (
    <div className="flex items-center justify-between w-full gap-3">
      <Button variant="outline" onClick={onCancel} className="border-border text-muted-foreground">
        {resolvedCancel}
      </Button>
      <Button type="submit" form={formId} isLoading={isLoading} className="bg-primary text-white shadow-lg">
        {isEdit ? (
          <>
            <Save className="mr-2 h-4 w-4" /> {resolvedSave}
          </>
        ) : (
          <>
            {resolvedCreateIcon} {resolvedCreate} <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
};

export default FormDrawerFooter;
