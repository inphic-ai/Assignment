
import { GoalCategory, TimeType, TutorialTip } from './types';
import { LayoutGrid, List, Smartphone, Folder, Kanban } from 'lucide-react';

export const INITIAL_GOALS: GoalCategory[] = [
  '業務', '人資', '管理', '倉儲', '維修', '行銷', '售後', '行政'
];

// Goals that strictly require attachments before submission
export const GOALS_REQUIRING_PROOF: GoalCategory[] = [
  '維修', '售後', '倉儲'
];

export const INITIAL_TUTORIALS: TutorialTip[] = [
  {
    id: 'tut-001',
    triggerKey: 'TIMELINE_PAST_DRAG',
    title: '時光不可逆：無效的操作',
    content: '您將任務拖曳到了已經過去的時間點。\n\n系統設計原則：\n1. 時間分配僅能針對「現在」或「未來」的時段。\n2. 若需補登工時，請使用「歷程紀錄」手動調整，而非拖曳排程。\n\n請嘗試將任務拖曳至目前的空閒時段。',
    category: 'timeline',
    isActive: true
  },
  {
    id: 'tut-002',
    triggerKey: 'TIMELINE_NOT_TODAY',
    title: '僅限今日排程',
    content: '時間分配功能專注於「今日 (Today)」的執行力。\n\n若您需要規劃明後天的行程，請先在「日常任務」中設定「截止日期」，屆時該任務會自動出現在當天的待辦清單中。',
    category: 'timeline',
    isActive: true
  },
  {
    id: 'tut-003',
    triggerKey: 'TIMELINE_OVERLOAD',
    title: '專注原則：避免多工',
    content: '系統偵測到您已同時開啟了多個計時器。\n\n為了確保工作效率與紀錄準確性，系統限制同時段最多只能進行「兩項」任務。\n請先暫停或結束手邊的工作，再開啟新的計時。',
    category: 'timeline',
    isActive: true
  }
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
