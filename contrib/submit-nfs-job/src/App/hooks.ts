/*!
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
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
