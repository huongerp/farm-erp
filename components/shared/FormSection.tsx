import React from 'react';
import Section from './Section';

interface FormSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'muted';
  /** Nút/hành động cùng hàng tiêu đề (bên phải), chuẩn Section. */
  action?: React.ReactNode;
}

/** Section trong form – dùng chung Section (cùng style với DetailSection) */
const FormSection: React.FC<FormSectionProps> = (props) => {
  return <Section {...props} />;
};

export default FormSection;
