import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";

export function useValue<T>(initialValue: T): [
  T,
  (event: React.ChangeEvent<{ value: T }>) => void,
  Dispatch<SetStateAction<T>>,
] {
  const [value, setValue] = useState(initialValue);
  const onValueChanged = useCallback((event: React.ChangeEvent<{ value: T }>) => {
    setValue(event.target.value);
  }, [value]);
  return [value, onValueChanged, setValue];
}

export function useNumericValue(initialValue: number): [
  number,
  (event: React.ChangeEvent<{ value: string }>) => void,
  Dispatch<SetStateAction<number>>,
] {
  const [value, setValue] = useState(initialValue);
  const onValueChanged = useCallback((event: React.ChangeEvent<{ value: string }>) => {
    const numericValue = Number(event.target.value);
    if (!Number.isNaN(numericValue)) {
      setValue(numericValue);
    }
  }, [value]);
  return [value, onValueChanged, setValue];
}

export function usePromise<V, E = Error>(
  promiseFactory: () => Promise<V>,
  deps: any[] | undefined,
): [V | undefined, E | undefined] {
  const [value, setValue] = useState<V>();
  const [error, setError] = useState<E>();

  useMemo(() => promiseFactory().then(setValue, setError), deps);

  return [value, error];
}
