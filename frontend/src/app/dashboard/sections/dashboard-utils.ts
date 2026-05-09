export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - t) / 1000);
  if (diff < 5)     return 'just now';
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function sparklinePath(values: number[]): string {
  if (!values || values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = (max - min) || 1;
  const w = 100, h = 30, pad = 3;
  const step = (w - 2 * pad) / (values.length - 1);
  return values.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
}
