import React, { lazy, Suspense } from 'react';
import type { ExportColumn } from './ExportDialog';

const ExportDialog = lazy(() => import('./ExportDialog'));

export type { ExportColumn };

type ExportDialogProps = React.ComponentProps<typeof ExportDialog>;

/** Chỉ tải ExportDialog (và export-libs) khi dialog mở. */
const LazyExportDialog: React.FC<ExportDialogProps> = (props) => {
  if (!props.open) return null;
  return (
    <Suspense fallback={null}>
      <ExportDialog {...props} />
    </Suspense>
  );
};

export default LazyExportDialog;
