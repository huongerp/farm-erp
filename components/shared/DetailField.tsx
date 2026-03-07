import React, { isValidElement } from 'react';
import { cn } from '../../lib/utils';

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  emptyText?: string;
}

/** Một dòng label + value trong màn detail – pattern giống form (label text-sm, khoảng cách rõ) */
const DetailField: React.FC<DetailFieldProps> = ({ label, value, icon, className, emptyText = 'Chưa cập nhật' }) => {
  const isEmpty = value === undefined || value === null || value === '';

  return (
    <div className={cn('space-y-1 min-w-0 w-full', className)}>
      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      {isEmpty ? (
        <p className="text-body-sm italic text-muted-foreground/50">{emptyText}</p>
      ) : isValidElement(value) ? (
        <div className="text-body-sm leading-relaxed">{value}</div>
      ) : (
        <p className="text-body-sm text-foreground leading-relaxed">{value}</p>
      )}
    </div>
  );
};

export default DetailField;
