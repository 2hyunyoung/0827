import { BarChart3, Boxes, Gauge, LineChart, Settings2, ShoppingCart, type LucideIcon } from 'lucide-react';

export type MenuRole = 'USER' | 'ADMIN';
export type MenuItem = { id: string; label: string; href: string; icon: LucideIcon; roles: MenuRole[] };

export const workflowMenu: MenuItem[] = [
  { id: 'dashboard', label: '전체 현황', href: '/', icon: Gauge, roles: ['USER', 'ADMIN'] },
  { id: 'demand', label: '수요 확정', href: '/workflow/demand', icon: BarChart3, roles: ['USER', 'ADMIN'] },
  { id: 'supply', label: '재고·공급', href: '/workflow/supply', icon: Boxes, roles: ['USER', 'ADMIN'] },
  { id: 'calculation', label: '발주량 계산', href: '/workflow/calculation', icon: ShoppingCart, roles: ['USER', 'ADMIN'] },
];

export const analysisMenu: MenuItem[] = [
  { id: 'leadtime', label: '리드타임 격차', href: '/analysis/leadtime', icon: LineChart, roles: ['USER', 'ADMIN'] },
  { id: 'stockout', label: '재고 소진 위험', href: '/analysis/stockout', icon: Boxes, roles: ['USER', 'ADMIN'] },
  { id: 'model-comparison', label: '모델 비교', href: '/analysis/model-comparison', icon: LineChart, roles: ['USER', 'ADMIN'] },
  { id: 'inventory-projection', label: '재고 Projection', href: '/analysis/inventory-projection', icon: Boxes, roles: ['USER', 'ADMIN'] },
  { id: 'purchase-recommendation', label: '발주 추천', href: '/analysis/purchase-recommendation', icon: ShoppingCart, roles: ['USER', 'ADMIN'] },
];

export const adminMenu: MenuItem[] = [
  { id: 'admin-users', label: '사용자 관리', href: '/admin/users', icon: Settings2, roles: ['ADMIN'] },
  { id: 'admin-forecast-settings', label: 'Forecast 설정', href: '/admin/forecast-settings', icon: Settings2, roles: ['ADMIN'] },
  { id: 'admin-master', label: '기준정보 관리', href: '/admin/master', icon: Settings2, roles: ['ADMIN'] },
  { id: 'admin-data-management', label: '데이터 적재 관리', href: '/admin/data-management', icon: Settings2, roles: ['ADMIN'] },
  { id: 'admin-forecast-models', label: 'Forecast 모델', href: '/admin/forecast-models', icon: LineChart, roles: ['ADMIN'] },
  { id: 'admin-forecast-runs', label: 'Forecast 실행 이력', href: '/admin/forecast-runs', icon: LineChart, roles: ['ADMIN'] },
  { id: 'admin-backtest', label: 'Backtest 실행', href: '/admin/backtest', icon: LineChart, roles: ['ADMIN'] },
  { id: 'admin-leadtime-policy', label: 'Lead Time 정책', href: '/admin/scm-policies/lead-time', icon: Settings2, roles: ['ADMIN'] },
];

export function menuFor(role: MenuRole) {
  return [...workflowMenu, ...analysisMenu, ...adminMenu].filter((item) => item.roles.includes(role));
}
