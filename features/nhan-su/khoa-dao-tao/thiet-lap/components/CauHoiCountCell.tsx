import React from 'react';
import { useCauHoiByBaiTest } from '../hooks/use-thiet-lap-khoa';

interface Props {
  idBaiTest: string;
}

/** Ô hiển thị số câu hỏi của bài test (dùng trong bảng) */
const CauHoiCountCell: React.FC<Props> = ({ idBaiTest }) => {
  const { data: list = [], isLoading } = useCauHoiByBaiTest(idBaiTest);
  const count = list.length;

  if (isLoading) return <span className="text-muted-foreground/60 text-xs">...</span>;
  if (count === 0) return <span className="text-muted-foreground/70 text-xs">0</span>;
  return (
    <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary tabular-nums">
      {count}
    </span>
  );
};

export default CauHoiCountCell;
