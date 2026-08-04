/**
 * TS-only shim: Zod v4 + @hookform/resolvers often infer Resolver input/output as incompatible
 * with useForm<T> under strict assignability. Re-export with a typed cast so `tsc --noEmit` passes.
 * Runtime matches the real resolver (Vite still bundles `@hookform/resolvers/zod` from node_modules).
 */
import { zodResolver as zodResolverImpl } from '../../node_modules/@hookform/resolvers/zod/dist/zod';
import type { FieldValues, Resolver } from 'react-hook-form';

export function zodResolver<TFieldValues extends FieldValues>(
  schema: Parameters<typeof zodResolverImpl>[0]
): Resolver<TFieldValues> {
  return zodResolverImpl(schema as never) as Resolver<TFieldValues>;
}
