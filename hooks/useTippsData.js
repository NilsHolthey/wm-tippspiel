import useSWR from "swr";

const fetcher = (url) => fetch(url).then(r => { if (!r.ok) throw new Error(); return r.json(); });

export function useTippsData({ active = true, fallbackData } = {}) {
  const { data, mutate } = useSWR(
    active ? "/api/tipps/data" : null,
    fetcher,
    { fallbackData, revalidateOnFocus: true, dedupingInterval: 30000 }
  );
  return {
    data,
    matches: data?.matches ?? [],
    myTipsMap: data?.myTipsMap ?? {},
    otherTipsMap: data?.otherTipsMap ?? {},
    tipStatusMap: data?.tipStatusMap ?? {},
    defaultMatchday: data?.defaultMatchday ?? 1,
    mutate,
  };
}
