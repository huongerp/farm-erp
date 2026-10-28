/** Khung bảng tổng hợp: cuộn ngang trên mobile, viền bo như lưới ngày; tiêu đề nhỏ phía trên. */
import React from 'react';

export const BangTongHop: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-x-auto rounded-lg border border-border">
    <table className="border-collapse w-max min-w-full">{children}</table>
  </div>
);

export const TieuDeBang: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="m-0 text-sm font-semibold text-foreground">{children}</h3>
);
