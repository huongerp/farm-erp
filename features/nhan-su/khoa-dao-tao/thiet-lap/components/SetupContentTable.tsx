import React from 'react';
import { cn } from '@/lib/utils';

/** Bảng nội dung thiết lập (bài học / bài test) – dùng chung thead style, border, responsive */
interface SetupContentTableProps {
  /** Nội dung thead (tr với các th) */
  header: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const SetupContentTable: React.FC<SetupContentTableProps> = ({ header, children, className }) => {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-border bg-card', className)}>
      <table className="w-full text-sm border-collapse">
        <thead>
          {header}
        </thead>
        <tbody className="divide-y divide-border [&>tr:last-child>td]:border-b [&>tr:last-child>td]:border-border">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default SetupContentTable;
