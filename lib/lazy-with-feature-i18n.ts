import { lazy, type LazyExoticComponent, type ComponentType } from 'react';
import { loadFeatureI18n, type FeatureI18nKey } from './feature-i18n';

/** React.lazy + load feature locale trước khi render (preview / route độc lập). */
export function lazyWithFeatureI18n<P = Record<string, never>>(
  key: FeatureI18nKey,
  importFn: () => Promise<{ default: ComponentType<P> }>
): LazyExoticComponent<ComponentType<P>> {
  return lazy(async () => {
    await loadFeatureI18n(key);
    return importFn();
  });
}
