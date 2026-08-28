'use client';

import { useMemo, useState } from 'react';
import type { ModelComparisonRow } from '@/lib/scm-model';

export default function ForecastOverlayChart({ rows }: { rows: ModelComparisonRow[] }) {
  const models = useMemo(() => Array.from(new Set(rows.map((row) => row.modelId))), [rows]);
  const [visible, setVisible] = useState<string[]>(models);
  const points = rows.filter((row) => row.actualQty !== null || (row.predictedQty !== null && visible.includes(row.modelId)));
  const max = Math.max(1, ...points.flatMap((row) => [row.actualQty ?? 0, ...models.filter((m) => visible.includes(m)).map((m) => rows.find((x) => x.period === row.period && x.modelId === m)?.predictedQty ?? 0)]));
  const periods = Array.from(new Set(points.map((row) => row.period)));
  return <div className="forecast-chart"><div className="chart-toggle-row">{models.map((model) => <label key={model}><input type="checkbox" checked={visible.includes(model)} onChange={() => setVisible((current) => current.includes(model) ? current.filter((item) => item !== model) : [...current, model])} /> {model}</label>)}</div><div className="chart-bars">{periods.map((period) => { const actual = rows.find((row) => row.period === period && row.actualQty !== null)?.actualQty; return <div className="chart-column" key={period}><div className="chart-stack">{actual !== undefined && actual !== null && <span className="chart-bar actual" style={{ height: `${(actual / max) * 100}%` }} title={`Actual ${actual}`} />}{models.filter((m) => visible.includes(m)).map((model) => { const row = rows.find((item) => item.period === period && item.modelId === model); return row?.predictedQty === null || !row ? null : <span className="chart-bar forecast" key={model} style={{ height: `${(row.predictedQty / max) * 100}%` }} title={`${model} ${row.predictedQty}`} />; })}</div><small>{period.slice(0, 7)}</small></div>; })}</div><p className="muted chart-note">실선 막대: Actual · 파란 막대: 저장된 Forecast. 체크 변경은 재실행 없이 화면 표시만 변경합니다.</p></div>;
}
