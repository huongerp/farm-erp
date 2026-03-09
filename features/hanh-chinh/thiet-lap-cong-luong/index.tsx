import React from 'react';
import PayrollFormGroupTab from './components/group-tab';

const PayrollSetupPage: React.FC = () => (
  <div className="flex flex-col h-[calc(100dvh-3.75rem)] md:h-[calc(100dvh-4.5rem)] relative">
    <div className="flex-1 min-h-0 flex flex-col">
      <PayrollFormGroupTab />
    </div>
  </div>
);

export default PayrollSetupPage;
