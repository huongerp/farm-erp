import { describe, it, expect } from 'vitest';
import { buildImportTemplate, type TemplateLabels } from './import-template';

const labels: TemplateLabels = {
  inputSheet: 'Nhập liệu',
  guideSheet: 'Hướng dẫn',
  exampleSheet: 'Ví dụ mẫu',
  guideColumn: 'Cột',
  guideRequired: 'Bắt buộc',
  guideRule: 'Quy tắc',
  guideExample: 'Ví dụ',
  yes: 'Có',
  no: 'Không',
  notes: ['• ghi chú'],
};

const columns = [
  { key: 'ma', label: 'Mã', required: true, hint: 'Viết hoa' },
  { key: 'kho_den', label: 'Kho đến', requiredWhen: 'Khi chuyển' },
  { key: 'ghi_chu', label: 'Ghi chú' },
];

describe('buildImportTemplate', () => {
  it('sheet nhập chỉ có tiêu đề — dòng mẫu nằm ở sheet riêng', () => {
    const sheets = buildImportTemplate({ columns, sampleRows: [['A1', '', 'x']], labels });
    expect(sheets.map((s) => s.name)).toEqual(['Nhập liệu', 'Hướng dẫn', 'Ví dụ mẫu']);
    expect(sheets[0].rows).toEqual([['Mã', 'Kho đến', 'Ghi chú']]);
    expect(sheets[2].rows[1]).toEqual(['A1', '', 'x']);
  });

  it('hướng dẫn: bắt buộc / có điều kiện / không, ví dụ lấy ô đầu tiên có giá trị', () => {
    const sheets = buildImportTemplate({ columns, sampleRows: [['A1', '', ''], ['A2', 'K02', 'y']], labels });
    const guide = sheets[1].rows;
    expect(guide[1]).toEqual(['Mã', 'Có', 'Viết hoa', 'A1']);
    expect(guide[2]).toEqual(['Kho đến', 'Khi chuyển', '', 'K02']);
    expect(guide[3]).toEqual(['Ghi chú', 'Không', '', 'y']);
    expect(guide.at(-1)).toEqual(['• ghi chú', '', '', '']);
  });

  it('không có dòng mẫu thì bỏ sheet ví dụ; tên sheet tra cứu trùng được đánh số', () => {
    const sheets = buildImportTemplate({
      columns,
      labels,
      referenceSheets: [
        { name: 'Hướng dẫn', headers: ['a'], data: [] },
        { name: 'Kho', headers: ['Mã'], data: [['K01']] },
      ],
    });
    expect(sheets.map((s) => s.name)).toEqual(['Nhập liệu', 'Hướng dẫn', 'Hướng dẫn 2', 'Kho']);
  });
});
