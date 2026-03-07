import React from 'react';
import { cn } from '../../lib/utils';

interface FormGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
}

/** Lưới form: 1 cột mobile, 2–3 cột desktop */
const FormGrid: React.FC<FormGridProps> = ({ children, cols = 2, className }) => {
  const gridClass =
    cols === 1
      ? 'grid grid-cols-1 gap-4'
      : cols === 2
        ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
        : 'grid grid-cols-1 sm:grid-cols-3 gap-4';

  return <div className={cn(gridClass, className)}>{children}</div>;
};

export default FormGrid;
