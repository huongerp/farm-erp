import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const files = [
  'features/he-thong/phong-ban/components/phong-ban-toolbar.tsx',
  'features/he-thong/chuc-vu/components/chuc-vu-toolbar.tsx',
  'features/he-thong/cap-bac/components/cap-bac-toolbar.tsx',
  'features/he-thong/chi-nhanh/components/chi-nhanh-toolbar.tsx',
  'features/kho-van/danh-sach-kho/components/danh-sach-kho-toolbar.tsx',
  'features/kho-van/danh-sach-hang-hoa/components/DanhSachHangHoaToolbar.tsx',
  'features/kho-van/danh-sach-nha-cung-cap/components/DanhSachNhaCungCapToolbar.tsx',
  'features/kho-van/danh-muc-hang-hoa/components/DanhMucHangHoaToolbar.tsx',
  'features/kho-van/phieu-kiem-ke/components/PhieuKiemKeToolbar.tsx',
  'features/kho-van/kiem-ke-kho/components/KiemKeKhoToolbar.tsx',
  'features/hanh-chinh/kiem-ke-tai-san/components/KiemKeTaiSanToolbar.tsx',
  'features/hanh-chinh/khau-hao-tai-san/components/KhauHaoTaiSanToolbar.tsx',
  'features/hanh-chinh/cong-viec/components/cong-viec-toolbar.tsx',
  'features/hanh-chinh/bao-tri-sua-chua/components/BaoTriSuaChuaToolbar.tsx',
  'features/hanh-chinh/diem-cong-tru/components/diem-cong-tru-toolbar.tsx',
  'features/hanh-chinh/danh-muc-tai-san/components/DanhSachTaiSanToolbar.tsx',
  'features/hanh-chinh/cap-phat-thu-hoi/components/CapPhatThuHoiToolbar.tsx',
  'features/hanh-chinh/cap-phat-thu-hoi/components/ChiTietTabToolbar.tsx',
  'features/mua-hang/thanh-toan-doi-tac/components/ThanhToanDoiTacToolbar.tsx',
  'features/quan-ly-farm/thu-hoach/components/ThuHoachToolbar.tsx',
  'features/quan-ly-farm/hang-hoa-phan-thuoc/components/DanhMucToolbar.tsx',
  'features/quan-ly-farm/hang-hoa-phan-thuoc/components/HangHoaToolbar.tsx',
  'features/mua-hang/thiet-lap-de-xuat-vat-tu/components/TrangThaiDoiTacToolbar.tsx',
  'features/mua-hang/thiet-lap-de-xuat-vat-tu/components/TrangThaiThanhToanDoiTacToolbar.tsx',
  'features/mua-hang/thiet-lap-de-xuat-vat-tu/components/TienDoMuaHangToolbar.tsx',
  'features/hanh-chinh/thiet-lap-cong-luong/components/group-toolbar.tsx',
  'features/hanh-chinh/thiet-lap-cong-luong/components/point-group-toolbar.tsx',
  'features/hanh-chinh/thiet-lap-cong-luong/components/ip-toolbar.tsx',
  'features/hanh-chinh/thiet-lap-tai-san/components/nhom-tai-san-toolbar.tsx',
  'features/hanh-chinh/thiet-lap-tai-san/components/loai-chi-phi-toolbar.tsx',
  'features/hanh-chinh/thiet-lap-tai-san/components/noi-luu-toolbar.tsx',
  'features/hanh-chinh/thiet-lap-tai-san/components/trang-thai-toolbar.tsx',
  'features/hanh-chinh/bang-luong/components/BangLuongMyToolbar.tsx',
  'features/hanh-chinh/bang-luong/components/BangLuongManagedToolbar.tsx',
];

const importLine = `import { useGenericToolbarSearch } from '../../../../lib/hooks/use-generic-toolbar-search';`;

function migrate(content, hookName) {
  if (content.includes('useGenericToolbarSearch(')) return null;
  const re = new RegExp(
    `const\\s*\\{([^}]+)\\}\\s*=\\s*${hookName}\\(\\)\\s*;`,
    's'
  );
  const m = content.match(re);
  if (!m) return null;
  const inner = m[1];
  const parts = inner.split(',').map((s) => s.trim()).filter(Boolean);
  const hasSearch = parts.some((p) => p.startsWith('searchTerm'));
  const hasSet = parts.some((p) => p.startsWith('setSearchTerm'));
  if (!hasSearch || !hasSet) return null;
  const rest = parts.filter((p) => !p.startsWith('searchTerm') && !p.startsWith('setSearchTerm'));
  const restDecl = rest
    .map((p) => {
      const name = p.split(/[:=]/)[0].trim();
      return `  const ${p} = ${hookName}((s) => s.${name});`;
    })
    .join('\n');
  const replacement = `  const { searchInput, setSearchInput, commitSearchTerm } = useGenericToolbarSearch(${hookName});\n${restDecl}`;
  let out = content.replace(re, replacement);
  if (!out.includes('use-generic-toolbar-search')) {
    const lines = out.split('\n');
    const storeImportIdx = lines.findIndex(
      (l) => l.includes('from') && l.includes(hookName.replace('use', '').toLowerCase().split('store')[0] || 'store')
    );
    const idx = lines.findIndex((l) => l.trim().startsWith('import') && l.includes(hookName));
    const insertAt = idx >= 0 ? idx : 1;
    lines.splice(insertAt, 0, importLine);
    out = lines.join('\n');
  }
  out = out.replace(/\(searchTerm \? 1/g, '(searchInput.trim() ? 1');
  out = out.replace(/searchTerm \? 1 : 0/g, 'searchInput.trim() ? 1 : 0');
  out = out.replace(/\[searchTerm,/g, '[searchInput,');
  out = out.replace(/\bsearchTerm,\s*$/gm, 'searchInput,');
  out = out.replace(/setSearchTerm\(''\)/g, "commitSearchTerm('')");
  out = out.replace(/searchTerm=\{searchTerm\}/g, 'searchTerm={searchInput}');
  out = out.replace(/onSearchChange=\{setSearchTerm\}/g, 'onSearchChange={setSearchInput}');
  return out;
}

for (const f of files) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) {
    console.error('missing', f);
    continue;
  }
  let c = fs.readFileSync(p, 'utf8');
  const hookName = c.match(/const\s*\{[^}]+\}\s*=\s*(use\w+Store)\s*\(/)?.[1];
  if (!hookName) {
    console.error('no hook', f);
    continue;
  }
  const newC = migrate(c, hookName);
  if (newC && newC !== c) {
    fs.writeFileSync(p, newC);
    console.log('ok', f);
  } else console.log('skip', f);
}
