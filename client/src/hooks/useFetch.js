import { useCallback, useEffect, useState } from "react";
import { statusText } from "../utils/format";

export function useFetch(fetcher, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(statusText(err));
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, retry: load, setData };
}
