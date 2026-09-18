import React from 'react';
import ThongKeSanXuatPage from './components/ThongKeSanXuatPage';

const ThongKeSanXuatModule: React.FC = () => {
  return (
    <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
      <div className="flex-1 min-h-0 flex flex-col">
        <ThongKeSanXuatPage />
      </div>
    </div>
  );
};

export default ThongKeSanXuatModule;
