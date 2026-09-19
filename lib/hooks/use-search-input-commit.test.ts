// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSearchInputCommit } from './use-search-input-commit';

/** Mô phỏng store zustand ở toolbar: commit ghi vào biến, rerender đẩy lại vào hook. */
function renderWithStore(debounceMs = 300) {
  let committed = '';
  const commit = vi.fn((term: string) => { committed = term; });
  const view = renderHook(
    ({ term }) => useSearchInputCommit({ committedTerm: term, commit, debounceMs }),
    { initialProps: { term: committed } }
  );
  const sync = () => act(() => { view.rerender({ term: committed }); });
  return {
    view,
    commit,
    getCommitted: () => committed,
    /** Store bị đổi từ ngoài (bấm "Xoá lọc", reset filter). */
    setCommittedExternally: (term: string) => {
      committed = term;
      sync();
    },
    /** Timer debounce chạy + đẩy giá trị vừa commit ngược vào hook. */
    tick: (ms = debounceMs) => {
      act(() => { vi.advanceTimersByTime(ms); });
      sync();
    },
  };
}

describe('useSearchInputCommit', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('commit từ khoá sau debounce', () => {
    const { view, getCommitted, tick } = renderWithStore();
    act(() => view.result.current.setInputValue('an'));
    expect(getCommitted()).toBe('');
    tick();
    expect(getCommitted()).toBe('an');
    expect(view.result.current.inputValue).toBe('an');
  });

  it('bấm xoá lọc: debounce cũ không commit đè lại từ khoá vừa xoá', () => {
    const { view, getCommitted, setCommittedExternally, tick } = renderWithStore();
    act(() => view.result.current.setInputValue('an'));
    tick();
    expect(getCommitted()).toBe('an');

    // Gõ thêm rồi bấm "Xoá lọc" khi debounce còn treo
    act(() => view.result.current.setInputValue('anh'));
    act(() => { setCommittedExternally(''); });
    expect(view.result.current.inputValue).toBe('');
    expect(getCommitted()).toBe('');

    tick(1000);
    expect(getCommitted()).toBe('');
    expect(view.result.current.inputValue).toBe('');
  });

  it('xoá lọc ngay sau khi vừa commit xong cũng không bị khôi phục', () => {
    const { view, getCommitted, setCommittedExternally, tick } = renderWithStore();
    act(() => view.result.current.setInputValue('an'));
    tick();
    act(() => { setCommittedExternally(''); });
    tick(1000);
    expect(getCommitted()).toBe('');
    expect(view.result.current.inputValue).toBe('');
  });

  it('gõ tiếp ngay sau khi commit: không nuốt ký tự vừa gõ', () => {
    const { view, getCommitted, tick } = renderWithStore();
    act(() => view.result.current.setInputValue('an'));
    act(() => { vi.advanceTimersByTime(300); });
    act(() => view.result.current.setInputValue('anh'));
    tick(0);
    expect(getCommitted()).toBe('an');
    expect(view.result.current.inputValue).toBe('anh');

    tick();
    expect(getCommitted()).toBe('anh');
    expect(view.result.current.inputValue).toBe('anh');
  });

  it('flush commit ngay, không commit lại khi timer cũ đến hạn', () => {
    const { view, commit, getCommitted, tick } = renderWithStore();
    act(() => view.result.current.setInputValue('an'));
    act(() => view.result.current.flush());
    expect(getCommitted()).toBe('an');
    tick(1000);
    expect(commit).toHaveBeenCalledTimes(1);
  });
});
