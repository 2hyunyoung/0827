import { requireAdmin } from '@/lib/auth';
import { getForecastModels } from '@/lib/scm';
import Sidebar from '@/components/shell/sidebar';
import Topbar from '@/components/shell/topbar';
import PageHeader from '@/components/shell/page-header';
import Panel from '@/components/ui/panel';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { updateForecastModel } from './actions';

export const dynamic = 'force-dynamic';

export default async function ForecastModelsPage() {
  await requireAdmin();
  const { rows, error } = await getForecastModels();
  return <div className="system-shell"><Sidebar role="ADMIN" /><main className="system-main"><Topbar title="Forecast 모델" eyebrow="ADMINISTRATION" /><div className="system-content"><PageHeader title="Baseline 모델 설정" description="활성 모델과 DB에 저장된 파라미터를 관리합니다. 실행 시 모델 설정이 버전으로 스냅샷됩니다." />{error ? <Panel><p className="text-danger">조회에 실패했습니다: {error}</p></Panel> : <div className="forecast-model-grid">{rows.map((model) => <Panel key={model.modelId} title={model.modelName} meta={<Badge status={model.enabled ? 'SAFE' : 'CALCULATION_UNAVAILABLE'}>{model.enabled ? '활성' : '비활성'}</Badge>}><form action={updateForecastModel} className="form-stack"><input type="hidden" name="model_id" value={model.modelId} /><div className="model-meta"><b>{model.modelId}</b><span>{model.family} · v{model.version}</span></div><p className="muted">{model.description ?? '설명 없음'}</p><label>적용 수요 유형<textarea className="form-input" value={model.applicableDemandType.join(', ')} readOnly rows={2} /></label><label>Parameters<textarea className="form-input" name="parameters" defaultValue={JSON.stringify(model.parameters, null, 2)} rows={4} /></label><label className="check-label"><input type="checkbox" name="enabled" value="true" defaultChecked={model.enabled} /> 실행 대상에 포함</label><Button variant="primary" type="submit">저장</Button></form></Panel>)}</div>}</div></main></div>;
}
