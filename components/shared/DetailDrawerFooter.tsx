import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { BTN_CLOSE, BTN_EDIT, BTN_DELETE } from '../../lib/button-labels';

export interface DetailDrawerFooterProps {
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  closeLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  /** Nút phụ chèn trước Sửa/Xoá (ví dụ: Gửi email, Gọi điện) — bên phải, cùng nhóm với Sửa/Xoá. */
  extraActions?: React.ReactNode;
}

/**
 * Footer chuẩn cho detail drawer — Đóng (trái), [extraActions] Sửa Xoá (phải), size="sm" (36px)
 * khớp nút "Thêm" ở list. Trước đây layout này bị copy-paste vào 48 file detail, đa số quên
 * size="sm" nên mặc định h-10 (40px) — to hơn nút Thêm ở list. Theo mẫu chuẩn ở
 * nhan-vien-detail.tsx.
 */
export const DetailDrawerFooter: React.FC<DetailDrawerFooterProps> = ({
  onClose,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
  closeLabel,
  editLabel,
  deleteLabel,
  extraActions,
}) => {
  return (
    <div className="flex items-center justify-between w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground border border-border"
      >
        {closeLabel ?? BTN_CLOSE()}
      </Button>
      <div className="flex items-center gap-3">
        {extraActions}
        {canUpdate && onEdit && (
          <Button size="sm" onClick={onEdit} className="bg-primary text-white shadow-lg hover:bg-primary/90">
            <Edit size={16} className="mr-2" /> {editLabel ?? BTN_EDIT()}
          </Button>
        )}
        {canDelete && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
          >
            <Trash2 size={16} className="mr-2" /> {deleteLabel ?? BTN_DELETE()}
          </Button>
        )}
      </div>
    </div>
  );
};

export default DetailDrawerFooter;
