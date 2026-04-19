import type { StoreApi, UseBoundStore } from 'zustand';
import type { GenericState } from '../../store/createGenericStore';
import { useSearchInputCommit } from './use-search-input-commit';

/**
 * Ô search trên GenericToolbar + store từ createGenericStore: state local khi gõ, commit sau debounce.
 */
export function useGenericToolbarSearch<TFilters>(
  useStore: UseBoundStore<StoreApi<GenericState<TFilters>>>
) {
  const searchTerm = useStore((s) => s.searchTerm);
  const commitSearchTerm = useStore((s) => s.commitSearchTerm);
  const { inputValue: searchInput, setInputValue: setSearchInput, flush } = useSearchInputCommit({
    committedTerm: searchTerm,
    commit: commitSearchTerm,
  });
  return { searchTerm, commitSearchTerm, searchInput, setSearchInput, flush };
}
