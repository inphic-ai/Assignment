
export type TimeType = 'misc' | 'daily' | 'long';
export type ViewMode = 'board' | 'grid' | 'card' | 'list' | 'group';
export type RoleType = 'created_by_me' | 'assigned_to_me' | 'assigned_by_me';
export type TaskStatus = 'todo' | 'doing' | 'submitted' | 'done' | 'archived';

export type GoalCategory = 
  | '業務' 
  | '人資' 
  | '管理' 
  | '倉儲' 
  | '維修' 
  | '行銷' 
  | '售後' 
  | '行政';

export type AnnouncementLevel = 'info' | 'warning' | 'urgent';

export interface Announcement {
  id: string;
  title?: string;
  content: string;
  level: AnnouncementLevel;
  createdAt: string;
  createdBy: string;
  expiresAt?: string;
  targetDepartments?: string[];
  readBy: string[];
  isActive: boolean;
}

export type RequestStatus = 'pending' | 'in-progress' | 'done';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';
export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface FeatureRequest {
  id: string;
  problem: string;
  suggestion: string;
  page: string;
  impact: ImpactLevel;
  consequence: string;
  attachments: Attachment[];
  urgency: UrgencyLevel;
  status: RequestStatus;
  createdAt: string;
  createdBy: string;
}

export interface TutorialTip {
  id: string;
  triggerKey: string; 
  title: string;
  content: string; 
  category: 'timeline' | 'task' | 'project' | 'general';
  isActive: boolean; 
}

export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'link' | 'youtube';
  name: string;
  url: string;
  size?: string;
  uploadedAt: string;
  uploaderId: string;
}

export interface TaskSubmission {
  summary: string;
  submittedAt: string;
  submittedBy: string;
  rating?: number;
  problemSolved?: string;
  overrunReason?: string; // 新增：超時原因記錄
  reviewedBy?: string;
  reviewedAt?: string;
}

export type AllocationStatus = 'planned' | 'running' | 'paused' | 'done' | 'missed' | 'overrun';

export interface TaskAllocation {
  id: string;
  taskId: string;
  userId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  status: AllocationStatus;
  accumulatedSeconds: number;
  actualStartAt?: string;
  actualEndAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  timeType: TimeType;
  timeValue: number;
  goal: GoalCategory;
  role: RoleType; 
  projectId: string | null;
  status: TaskStatus;
  priority?: 'low' | 'medium' | 'high';
  startAt: string;
  dueAt: string;
  scheduledSlot?: string;
  orderDaily: number;
  orderInProject: number;
  creatorId: string;
  assigneeId: string;
  collaboratorIds: string[]; 
  watchers: string[];
  requireProof: boolean;
  attachments: Attachment[];
  submission?: TaskSubmission;
  rejectionReason?: string;
  pendingInfoRequest?: string;
  linkedKnowledgeId?: string;
  fromRoutineId?: string; 
  totalSpent?: number;
  activeViewers?: string[]; 
  aiTacticalTags?: string[];
  aiRiskHint?: string;
  aiFromHistory?: boolean;
  isConfirmed?: boolean; 
  remarks?: string;     
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export type RecurrenceType = 'daily' | 'workday' | 'weekly' | 'monthly';
export type RoutineStrategy = 'static' | 'rotating';
export type RoutineStatus = 'active' | 'frozen' | 'draft' | 'completed';

export interface RoutineTemplate {
  id: string;
  title: string;
  description: string;
  aiRiskHint?: string; 
  goal: GoalCategory;
  timeType: TimeType;
  timeValue: number;
  recurrence: RecurrenceType;
  recurrenceDay?: number;
  strategy: RoutineStrategy; 
  assigneeIds: string[];
  currentRotationIndex: number;
  validFrom: string;
  validTo?: string;
  creatorId: string;
  status: RoutineStatus;
  lastGeneratedDate?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  projectOrder: number;
  archived: boolean;
}

export interface LoginLogEntry {
  id: string;
  userId: string;
  userName: string;
  ipAddress: string;
  timestamp: string;
  device: string;
  status: 'success' | 'failed';
}

export interface LogEntry {
  id: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RESTORE' | 'INFO_REQUEST';
  target: 'TASK' | 'PROJECT' | 'GOAL' | 'USER' | 'KNOWLEDGE' | 'ALLOCATION' | 'ANNOUNCEMENT' | 'ROUTINE' | 'TUTORIAL';
  details: string;
  timestamp: string;
  userId: string;
  ipAddress?: string; 
}

export interface User {
  id: string;
  name: string;
  email?: string; 
  role: 'admin' | 'manager' | 'user';
  avatar?: string;
  department?: string;
  active: boolean;
  workdayStart: string;
  workdayEnd: string;
  dailyHours: number;
  defaultLongTaskConversion: number;
}

export interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  goal: GoalCategory;
  timeType: TimeType;
  timeValue: number;
  source: 'system' | 'user';
  useCount: number;
}

export interface AppState {
  tasks: Task[];
  projects: Project[];
  goals: GoalCategory[];
  logs: LogEntry[];
  loginLogs: LoginLogEntry[];
  users: User[];
  currentUser: User;
  allocations: TaskAllocation[];
  announcements: Announcement[];
  routineTemplates: RoutineTemplate[];
  tutorials: TutorialTip[]; 
  featureRequests: FeatureRequest[];
  taskTemplates: TaskTemplate[];
}

export type NavTab = 
  | 'dashboard' 
  | 'personal_dashboard' 
  | 'create' 
  | 'daily' 
  | 'task_list' 
  | 'projects' 
  | 'timeline' 
  | 'routines' 
  | 'knowledge' 
  | 'announcement' 
  | 'admin'
  | 'feature_request';
