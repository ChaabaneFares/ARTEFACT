declare module "storio" {
  export type SetState<T> = (nextState: Partial<T> | ((state: T) => T)) => void;

  export type GetState<T> = () => T;

  export interface Store<T> {
    (): T;
    <U>(selector: (state: T) => U): U;
    getState: GetState<T>;
    setState: SetState<T>;
    subscribe: (listener: () => void) => () => void;
  }

  export function create<T>(
    initializer: (set: SetState<T>, get: GetState<T>) => T,
  ): Store<T>;
}
