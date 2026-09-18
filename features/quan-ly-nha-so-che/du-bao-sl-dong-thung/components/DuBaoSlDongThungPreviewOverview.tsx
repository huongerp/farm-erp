import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FarmDuBaoSlDongThung } from '../core/types';
import { getDbsdtPreviewOverviewRows, type DbsdtPreviewField } from '../core/dbsdt-preview-layout';

interface Props {
  data: FarmDuBaoSlDongThung;
}

function OverviewCell({ field }: { field: DbsdtPreviewField }) {
  return (
    <td className="border border-gray-300 px-1.5 py-1 text-[8.5pt] align-top w-1/4">
      <span className="font-semibold text-gray-600">{field.label}: </span>
      <span className={field.bold ? 'font-semibold text-gray-900' : 'text-gray-900'}>{field.value}</span>
    </td>
  );
}

const DuBaoSlDongThungPreviewOverview: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const rows = getDbsdtPreviewOverviewRows(data, t);

  return (
    <table className="w-full border-collapse table-fixed mb-3">
      <tbody>
        {rows.map((fields, ri) => {
          if (fields.length === 1) {
            const f = fields[0];
            return (
              <tr key={ri}>
                <td colSpan={4} className="border border-gray-300 px-1.5 py-1 text-[8.5pt]">
                  <span className="font-semibold text-gray-600">{f.label}: </span>
                  <span className="whitespace-pre-wrap text-gray-900">{f.value}</span>
                </td>
              </tr>
            );
          }
          const pad = 4 - fields.length;
          return (
            <tr key={ri}>
              {fields.map((f, i) => (
                <OverviewCell key={i} field={f} />
              ))}
              {pad > 0 ? <td colSpan={pad} className="border border-gray-300 bg-white" /> : null}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default DuBaoSlDongThungPreviewOverview;
