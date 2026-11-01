import { useCallback, useEffect, useRef, useState } from "react";
export function useResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const sequence = useRef({ id: 0 });
  const refresh = useCallback(async () => {
    const id = ++sequence.current.id;
    setLoading(true);
    setError("");
    try {
      const value = await loader();
      if (id === sequence.current.id) setData(value);
    } catch (err) {
      if (id === sequence.current.id)
        setError(err instanceof Error ? err.message : "Unable to load data.");
    } finally {
      if (id === sequence.current.id) setLoading(false);
    }
  }, [loader]);
  useEffect(() => {
    const state = sequence.current;
    let active = true;
    // Begin the asynchronous subscription after commit; invalidate late results on cleanup.
    queueMicrotask(() => {
      if (active) void refresh();
    });
    return () => {
      active = false;
      state.id++;
    };
  }, [refresh]);
  return { data, error, loading, refresh };
}
