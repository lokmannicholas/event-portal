declare module 'react' {
  export type ReactNode = any;
  export type CSSProperties = Record<string, any>;
  export type FormEvent<T = Element> = any;
  export function useState<T>(initialState: T): [T, (value: T | ((current: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useActionState<State>(
    action: (state: Awaited<State>) => State | Promise<State>,
    initialState: Awaited<State>,
    permalink?: string,
  ): [state: Awaited<State>, dispatch: () => void, isPending: boolean];
  export function useActionState<State, Payload>(
    action: (state: Awaited<State>, payload: Payload) => State | Promise<State>,
    initialState: Awaited<State>,
    permalink?: string,
  ): [state: Awaited<State>, dispatch: (payload: Payload) => void, isPending: boolean];
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}

declare module 'next' {
  export interface Metadata {
    [key: string]: any;
  }

  export interface NextConfig {
    [key: string]: any;
  }
}

declare module '@strapi/strapi' {
  export const factories: any;
  export namespace Core {
    interface Strapi {
      [key: string]: any;
    }
  }
}


declare const process: {
  env: Record<string, string | undefined>;
};

interface RequestInit {
  next?: any;
}


declare module 'path' {
  const path: any;
  export default path;
}

declare module 'crypto' {
  const crypto: any;
  export default crypto;
}

declare const __dirname: string;
