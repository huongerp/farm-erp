import React, { lazy, Suspense } from 'react';
import type { ImportColumn, ImportReferenceSheet, ImportSampleRow } from './ImportDialog';

const ImportDialog = lazy(() => import('./ImportDialog'));

export type { ImportColumn, ImportReferenceSheet, ImportSampleRow };

type ImportDialogProps = React.ComponentProps<typeof ImportDialog>;

/** Chỉ tải ImportDialog (và xlsx) khi dialog mở. */
const LazyImportDialog: React.FC<ImportDialogProps> = (props) => {
  if (!props.open) return null;
  return (
    <Suspense fallback={null}>
      <ImportDialog {...props} />
    </Suspense>
  );
};

export default LazyImportDialog;
