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
];

export const adminMenu: MenuItem[] = [
  { id: 'admin-master', label: '기준정보 관리', href: '/admin/master', icon: Settings2, roles: ['ADMIN'] },
];

export function menuFor(role: MenuRole) {
  return [...workflowMenu, ...analysisMenu, ...adminMenu].filter((item) => item.roles.includes(role));
}
