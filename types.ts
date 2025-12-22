
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

// Announcement Level
export type AnnouncementLevel = 'info' | 'warning' | 'urgent';

// New Announcement Interface
export interface Announcement {
  id: string;
  content: string;
  level: AnnouncementLevel;
  createdAt: string;
  createdBy: string;
  isActive: boolean; // Controls visibility
}

// --- NEW TUTORIAL TYPES ---
export interface TutorialTip {
  id: string;
  triggerKey: string; // Unique key to trigger this tip (e.g., 'TIMELINE_PAST_DRAG')
  title: string;
  content: string; // Can be multi-line text
  category: 'timeline' | 'task' | 'project' | 'general';
  isActive: boolean; // Admin can disable tips
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
  
  // New fields for review
  rating?: number; // 1-5 stars
  problemSolved?: string; // What specific problem was solved? (For Knowledge Base)
  reviewedBy?: string;
  reviewedAt?: string;
}

// Execution Status for Timeline Slots
export type AllocationStatus = 'planned' | 'running' | 'done' | 'missed' | 'overrun';

// Updated Interface for Time Slicing
export interface TaskAllocation {
  id: string;
  taskId: string;
  userId: string; // To track who this allocation belongs to
  date: string; // ISO Date (YYYY-MM-DD)
  
  // Plan
  startTime: string; // "09:00"
  durationMinutes: number;
  
  // Actual Execution
  status: AllocationStatus;
  actualStartAt?: string; // ISO Timestamp
  actualEndAt?: string;   // ISO Timestamp
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
  
  startAt: string;
  dueAt: string;
  scheduledSlot?: string; // Legacy for Misc/Daily simple scheduling

  orderDaily: number;
  orderInProject: number;
  
  creatorId: string;
  assigneeId: string;
  watchers: string[];
  
  requireProof: boolean;
  attachments: Attachment[];
  submission?: TaskSubmission;
  
  linkedKnowledgeId?: string;

  // Link back to routine template if generated
  fromRoutineId?: string; 

  // New field for accumulated time tracking
  totalSpent?: number; // in minutes

  createdAt: string;
  updatedAt: string;
  
  // Soft Delete
  deletedAt?: string;
  deletedBy?: string;
}

// --- NEW ROUTINE TYPES ---
export type RecurrenceType = 'daily' | 'workday' | 'weekly' | 'monthly';
export type RoutineStrategy = 'static' | 'rotating'; // Static = All assignees get it; Rotating = One per cycle
export type RoutineStatus = 'active' | 'frozen' | 'draft';

export interface RoutineTemplate {
  id: string;
  title: string;
  description: string;
  goal: GoalCategory;
  timeType: TimeType; // Usually misc or daily
  timeValue: number;
  
  recurrence: RecurrenceType;
  recurrenceDay?: number; // For weekly (0-6) or monthly (1-31)
  
  // Advanced Assignment Logic
  strategy: RoutineStrategy; 
  assigneeIds: string[]; // List of involved users. If 'static', all get it. If 'rotating', take turns.
  currentRotationIndex: number; // For rotating strategy: who is next?
  
  // Date Range Control
  validFrom: string; // ISO Date String (YYYY-MM-DD)
  validTo?: string;   // ISO Date String (Optional)

  creatorId: string;
  
  status: RoutineStatus; // Replaces isActive boolean
  lastGeneratedDate?: string; // YYYY-MM-DD to prevent duplicate generation
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
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RESTORE';
  target: 'TASK' | 'PROJECT' | 'GOAL' | 'USER' | 'KNOWLEDGE' | 'ALLOCATION' | 'ANNOUNCEMENT' | 'ROUTINE' | 'TUTORIAL';
  details: string;
  timestamp: string;
  userId: string;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'user'; // Added 'manager'
  avatar?: string;
  department?: string;
  active: boolean; // For soft delete/deactivation
  
  // Workday Settings
  workdayStart: string; // "09:00"
  workdayEnd: string;   // "18:00"
  dailyHours: number;   // 9 (including lunch) or 8
  defaultLongTaskConversion: number; // 8 hours = 1 day
}

export interface AppState {
  tasks: Task[];
  projects: Project[];
  goals: GoalCategory[];
  logs: LogEntry[];
  loginLogs: LoginLogEntry[]; // New Login Logs
  users: User[];
  currentUser: User;
  allocations: TaskAllocation[]; // Store time slices
  announcements: Announcement[]; // Replaces single string systemAnnouncement
  routineTemplates: RoutineTemplate[]; // NEW
  tutorials: TutorialTip[]; // NEW: For instructional prompts
}

export type NavTab = 'dashboard' | 'create' | 'daily' | 'projects' | 'timeline' | 'routines' | 'knowledge' | 'announcement' | 'admin';
