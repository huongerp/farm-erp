declare module 'pagedjs' {
  export class Previewer {
    constructor(options?: unknown);
    polisher?: { destroy: () => void };
    preview(
      content: string,
      stylesheets: Array<Record<string, string>>,
      renderTo: HTMLElement
    ): Promise<{ total?: number } | undefined>;
  }
  /** Lớp cơ sở cho handler: phương thức trùng tên hook (afterPageLayout, layout…) tự được gắn. */
  export class Handler {
    constructor(chunker: unknown, polisher: unknown, caller: unknown);
  }
  export function registerHandlers(...handlers: Array<new (...args: never[]) => Handler>): void;
}
