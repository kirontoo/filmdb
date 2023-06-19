import { useCallback, useState } from "react";

export type AsyncFn<P extends Record<string, any>, T> = (...args: P[]) => Promise<T>;

const useAsyncFn = <P extends Record<string, any>, T>(
  func: AsyncFn<P, T>,
  dependencies = []
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [value, setValue] = useState<T>();

  const execute = useCallback(async (...params: any) => {
    try {
      setLoading(true);
      const data = await func(...params);
      setValue(data);
      setError(undefined);
      return data;
    } catch (error: any) {
      setError(error);
      setValue(undefined);
      return await Promise.reject(error ?? "Error");
    } finally {
      setLoading(false);
    }
  }, dependencies);

  return { loading, error, value, execute };
};

export default useAsyncFn;
