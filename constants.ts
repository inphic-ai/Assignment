import { GoalCategory, TimeType } from './types';
import { LayoutGrid, List, Smartphone, Folder, Kanban } from 'lucide-react';

export const INITIAL_GOALS: GoalCategory[] = [
  '業務', '人資', '管理', '倉儲', '維修', '行銷', '售後', '行政'
];

// Goals that strictly require attachments before submission
export const GOALS_REQUIRING_PROOF: GoalCategory[] = [
  '維修', '售後', '倉儲'
];

export const TIME_CONVERSION = {
  HOURS_PER_DAY: 8,
  MINUTES_PER_HOUR: 60,
};

export const VIEW_MODES = [
  { id: 'board', label: '看板', icon: Kanban }, // New Board View for Project Details
  { id: 'grid', label: '圖標', icon: LayoutGrid },
  { id: 'card', label: '卡片', icon: Smartphone },
  { id: 'list', label: '清單', icon: List },
  { id: 'group', label: '分組', icon: Folder },
];

export const convertToHours = (value: number, type: TimeType): number => {
  switch (type) {
    case 'misc': return value / 60;
    case 'daily': return value;
    case 'long': return value * TIME_CONVERSION.HOURS_PER_DAY;
    default: return 0;
  }
};

export const generateId = (prefix: string = 'TASK') => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-TW', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};