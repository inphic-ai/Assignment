import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskViews from './components/TaskViews';
import CreateTaskModal from './components/CreateTaskModal';
import TaskDetailModal from './components/TaskDetailModal'; 
import AdminCenter from './components/AdminCenter';
import TimelineView from './components/TimelineView';
import KnowledgeBase from './components/KnowledgeBase';
import { NavTab, Task, Project, ViewMode, AppState, GoalCategory, User, LogEntry, TaskAllocation, TaskStatus, LoginLogEntry, TimeType, RoleType, AnnouncementLevel, Announcement } from './types';
import { INITIAL_GOALS, VIEW_MODES, generateId, convertToHours } from './constants';
import { Search, SlidersHorizontal, ArrowLeft, Filter, X, User as UserIcon, Briefcase, Clock, Target, RotateCcw, Zap, Sun, Calendar, Edit2, Check, Megaphone, Bell, Info, AlertTriangle, History } from 'lucide-react';

const MOCK_USERS: User[] = [
  { 
    id: 'u1', name: 'Admin User', role: 'admin', active: true,
    workdayStart: '09:00', workdayEnd: '18:00', dailyHours: 9, defaultLongTaskConversion: 8
  },
  { 
    id: 'u2', name: 'Manager User', role: 'manager', active: true,
    workdayStart: '09:00', workdayEnd: '18:00', dailyHours: 9, defaultLongTaskConversion: 8
  },
  { 
    id: 'u3', name: 'John Doe', role: 'user', active: true,
    workdayStart: '08:30', workdayEnd: '17:30', dailyHours: 9, defaultLongTaskConversion: 8
  },
  { 
    id: 'u4', name: 'Jane Smith', role: 'user', active: false, // Inactive example
    workdayStart: '10:00', workdayEnd: '19:00', dailyHours: 9, defaultLongTaskConversion: 8
  },
];

const MOCK_LOGIN_LOGS: LoginLogEntry[] = [
   { id: 'l1', userId: 'u1', userName: 'Admin User', ipAddress: '192.168.1.10', device: 'Chrome / Windows', timestamp: new Date(Date.now() - 1000*60*60).toISOString(), status: 'success' },
   { id: 'l2', userId: 'u3', userName: 'John Doe', ipAddress: '192.168.1.15', device: 'Safari / iPhone', timestamp: new Date(Date.now() - 1000*60*60*5).toISOString(), status: 'success' },
   { id: 'l3', userId: 'u2', userName: 'Manager User', ipAddress: '192.168.1.12', device: 'Chrome / Mac', timestamp: new Date(Date.now() - 1000*60*60*24).toISOString(), status: 'success' },
   { id: 'l4', userId: 'u3', userName: 'John Doe', ipAddress: '203.0.113.5', device: 'Unknown', timestamp: new Date(Date.now() - 1000*60*60*25).toISOString(), status: 'failed' },
];

const App = () => {
  // Persistence
  const [data, setData] = useState<AppState>(() => {
    const saved = localStorage.getItem('chronos_data_v8');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration: Ensure 'announcements' array exists if old version
      if (!parsed.announcements) {
        parsed.announcements = [];
        if (parsed.systemAnnouncement) {
          parsed.announcements.push({
            id: 'ann-init',
            content: parsed.systemAnnouncement,
            level: parsed.systemAnnouncementLevel || 'info',
            createdAt: new Date().toISOString(),
            createdBy: 'u1',
            isActive: true
          });
        }
      }
      return parsed;
    }
    return {
      tasks: [],
      projects: [],
      goals: INITIAL_GOALS,
      logs: [],
      loginLogs: MOCK_LOGIN_LOGS,
      users: MOCK_USERS,
      currentUser: MOCK_USERS[0],
      allocations: [],
      announcements: []
    };
  });

  // --- STATE ---
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  // New State for Project Details View Mode (default to 'board' which is the 3-column view)
  const [projectDetailViewMode, setProjectDetailViewMode] = useState<ViewMode>('board');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isProjectCreation, setIsProjectCreation] = useState(false);

  // Project Editing State
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectData, setEditProjectData] = useState({ name: '', description: '' });

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGoal, setFilterGoal] = useState<GoalCategory | 'all'>('all');
  const [filterType, setFilterType] = useState<TimeType | 'all'>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  // New Role Filter
  const [filterRole, setFilterRole] = useState<'all' | RoleType>('all');

  const [viewingUserId, setViewingUserId] = useState<string>(
    (data.currentUser.role === 'admin' || data.currentUser.role === 'manager') 
      ? 'ALL' 
      : data.currentUser.id
  );

  useEffect(() => {
    localStorage.setItem('chronos_data_v8', JSON.stringify(data));
  }, [data]);

  // --- DERIVED STATE ---
  // Get the most recent active announcement
  const activeAnnouncement = data.announcements
    .filter(a => a.isActive)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  // --- FILTERING LOGIC ---
  const activeTasks = data.tasks.filter(t => !t.deletedAt);
  
  const getFilteredTasks = () => {
    return activeTasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGoal = filterGoal === 'all' || t.goal === filterGoal;
      const matchesType = filterType === 'all' || t.timeType === filterType;
      const matchesAssignee = filterAssignee === 'all' || t.assigneeId === filterAssignee;
      
      // Role Filter Logic
      let matchesRole = true;
      if (filterRole === 'created_by_me') {
        matchesRole = t.creatorId === data.currentUser.id;
      } else if (filterRole === 'assigned_to_me') {
        matchesRole = t.assigneeId === data.currentUser.id;
      } else if (filterRole === 'assigned_by_me') {
        matchesRole = t.creatorId === data.currentUser.id && t.assigneeId !== data.currentUser.id;
      }

      // Viewing User Permission Filter (on top of manual filter)
      const matchesViewingUser = viewingUserId === 'ALL' || t.assigneeId === viewingUserId;

      return matchesSearch && matchesGoal && matchesType && matchesAssignee && matchesRole && matchesViewingUser;
    });
  };

  const displayedTasks = getFilteredTasks();

  const resetFilters = () => {
    setFilterGoal('all');
    setFilterType('all');
    setFilterRole('all');
    setFilterAssignee('all');
    setSearchTerm('');
  };

  // --- LOGGING ---
  const logOperation = (
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RESTORE',
    target: 'TASK' | 'PROJECT' | 'GOAL' | 'USER' | 'KNOWLEDGE' | 'ALLOCATION' | 'ANNOUNCEMENT',
    details: string
  ) => {
    const newLog: LogEntry = {
      id: generateId('LOG'),
      action,
      target,
      details,
      timestamp: new Date().toISOString(),
      userId: data.currentUser.id
    };
    return newLog;
  };

  // --- ACTIONS ---

  const handleNavigate = (tab: NavTab) => {
    setCurrentTab(tab);
    // CRITICAL FIX: Only reset ID if we are NOT intentionally going to a project detail via other means.
    // However, clicking the sidebar tab "Project Tasks" SHOULD reset to list view.
    setSelectedProjectId(null);
    
    // Smart View Mode Defaults
    if (tab === 'projects') {
      setViewMode('group'); // Default to Group view for Projects List
      setProjectDetailViewMode('board'); // Reset detail view to Board
    } else if (tab === 'daily') {
      if (viewMode === 'group') setViewMode('grid'); // Default back to Grid/Card for Daily if coming from Group
    }
  };

  const handleCreateProject = () => {
    setIsProjectCreation(true);
    setShowCreateModal(true);
  };

  const handleCreateTasks = (newTasks: Partial<Task>[], newProject?: Partial<Project>) => {
    const timestamp = new Date().toISOString();
    let newLogs: LogEntry[] = [];
    
    let updatedProjects = [...data.projects];
    
    // Add Project if exists
    if (newProject) {
      const project: Project = {
        id: newProject.id!,
        name: newProject.name!,
        description: newProject.description || '',
        createdAt: timestamp,
        projectOrder: data.projects.length,
        archived: false,
        ...newProject
      } as Project;
      updatedProjects.push(project);
      newLogs.push(logOperation('CREATE', 'PROJECT', `建立專案: ${project.name}`));
    }

    // Add Tasks
    const createdTasks = newTasks.map(t => ({
      ...t,
      id: generateId(),
      createdAt: timestamp,
      updatedAt: timestamp,
      orderDaily: data.tasks.length,
      projectId: newProject?.id || t.projectId || null,
      watchers: [],
      attachments: t.attachments || [],
      requireProof: false, 
      status: 'todo',
      totalSpent: 0,
      ...t
    } as Task));

    if (createdTasks.length > 0) {
      newLogs.push(logOperation('CREATE', 'TASK', `建立 ${createdTasks.length} 個任務`));
    }

    setData(prev => ({ 
      ...prev, 
      tasks: [...prev.tasks, ...createdTasks],
      projects: updatedProjects,
      logs: [...prev.logs, ...newLogs]
    }));
    setIsProjectCreation(false); // Reset
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    const task = data.tasks.find(t => t.id === id);
    if (!task) return;

    let action: any = 'UPDATE';
    let details = `更新任務 ${task.title}`;
    
    if (updates.status === 'submitted') {
      action = 'SUBMIT';
      details = `送審任務: ${task.title}`;
    } else if (updates.status === 'done' && task.status === 'submitted') {
      action = 'APPROVE';
      details = `核准結案: ${task.title}`;
    } else if (updates.status === 'done') {
      details = `完成任務: ${task.title}`;
    } else if (updates.projectId && updates.projectId !== task.projectId) {
      // Handle Drag-to-Assign Project
      const project = data.projects.find(p => p.id === updates.projectId);
      details = `將任務 ${task.title} 歸檔至專案: ${project?.name || '未知'}`;
    }

    const log = logOperation(action, 'TASK', details);
    const updatedTask = { ...task, ...updates, updatedAt: new Date().toISOString() };

    // --- SYNC LOGIC: If task is DONE, stop/finish active allocations ---
    let updatedAllocations = data.allocations;
    if (updates.status === 'done') {
      const nowISO = new Date().toISOString();
      updatedAllocations = data.allocations.map(alloc => {
        if (alloc.taskId === id && (alloc.status === 'running' || alloc.status === 'planned')) {
          return {
            ...alloc,
            status: 'done',
            actualEndAt: alloc.status === 'running' ? nowISO : undefined
          };
        }
        return alloc;
      });
    }

    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? updatedTask : t),
      allocations: updatedAllocations,
      logs: [...prev.logs, log]
    }));
    
    if (selectedTask?.id === id) setSelectedTask(updatedTask);
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
    const project = data.projects.find(p => p.id === id);
    if (!project) return;
    
    const log = logOperation('UPDATE', 'PROJECT', `更新專案資訊: ${project.name}`);
    
    setData(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p),
      logs: [...prev.logs, log]
    }));
    setIsEditingProject(false);
  };

  const handleProjectReorder = (dragIndex: number, hoverIndex: number) => {
    const sortedProjects = [...data.projects].sort((a, b) => a.projectOrder - b.projectOrder);
    const itemToMove = sortedProjects[dragIndex];
    sortedProjects.splice(dragIndex, 1);
    sortedProjects.splice(hoverIndex, 0, itemToMove);
    const updatedProjects = sortedProjects.map((p, idx) => ({ ...p, projectOrder: idx }));

    setData(prev => ({
      ...prev,
      projects: updatedProjects
    }));
  };

  const handleDeleteTask = (id: string) => {
    const task = data.tasks.find(t => t.id === id);
    if (!task) return;

    const log = logOperation('DELETE', 'TASK', `軟刪除任務: ${task.title}`);
    
    const updatedTask = { 
      ...task, 
      deletedAt: new Date().toISOString(),
      deletedBy: data.currentUser.id 
    };

    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? updatedTask : t),
      logs: [...prev.logs, log]
    }));
    setSelectedTask(null);
  };

  const handleConvertToKnowledge = (task: Task) => {
    const log = logOperation('CREATE', 'KNOWLEDGE', `從任務轉入知識庫: ${task.title}`);
    const updatedTask = { ...task, linkedKnowledgeId: `KB-${task.id}` };
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === task.id ? updatedTask : t),
      logs: [...prev.logs, log]
    }));
    setSelectedTask(updatedTask);
    alert("已成功轉入知識庫！");
  };

  const handleAddGoal = (goal: string) => {
    const log = logOperation('CREATE', 'GOAL', `新增目標項目: ${goal}`);
    setData(prev => ({
      ...prev,
      goals: [...prev.goals, goal as GoalCategory],
      logs: [...prev.logs, log]
    }));
  };

  const handleUpdateUser = (id: string, updates: Partial<User>) => {
    const log = logOperation('UPDATE', 'USER', `更新使用者 ID: ${id}`);
    setData(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...updates } : u),
      logs: [...prev.logs, log]
    }));
  };

  const handleAddAllocation = (alloc: TaskAllocation) => {
    const log = logOperation('CREATE', 'ALLOCATION', `分配時間切片 Task: ${alloc.taskId}`);
    setData(prev => ({
      ...prev,
      allocations: [...prev.allocations, alloc],
      logs: [...prev.logs, log]
    }));
  };

  const handleUpdateAllocation = (id: string, updates: Partial<TaskAllocation>) => {
    const alloc = data.allocations.find(a => a.id === id);
    if (!alloc) return;
    if (updates.status && updates.status !== alloc.status) {
       logOperation('UPDATE', 'ALLOCATION', `更新切片狀態 ${alloc.status} -> ${updates.status}`);
    }
    setData(prev => ({
      ...prev,
      allocations: prev.allocations.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  };

  const handleRemoveAllocation = (id: string) => {
    const log = logOperation('DELETE', 'ALLOCATION', `移除時間切片 ID: ${id}`);
    setData(prev => ({
      ...prev,
      allocations: prev.allocations.filter(a => a.id !== id),
      logs: [...prev.logs, log]
    }));
  };
  
  // --- ANNOUNCEMENT ACTIONS ---
  const handleCreateAnnouncement = (content: string, level: AnnouncementLevel) => {
    const newAnn: Announcement = {
      id: generateId('ANN'),
      content,
      level,
      createdAt: new Date().toISOString(),
      createdBy: data.currentUser.id,
      isActive: true // Auto activate new ones
    };
    
    const log = logOperation('CREATE', 'ANNOUNCEMENT', `發布公告: ${content.substring(0, 10)}...`);
    
    setData(prev => ({
      ...prev,
      // Deactivate others? Or allow multiple? Layout currently best supports one.
      // Let's deactivate others to keep it clean for MVP.
      announcements: [newAnn, ...prev.announcements.map(a => ({...a, isActive: false}))],
      logs: [...prev.logs, log]
    }));
  };

  const handleUpdateAnnouncement = (id: string, updates: Partial<Announcement>) => {
    const ann = data.announcements.find(a => a.id === id);
    if(!ann) return;

    const log = logOperation('UPDATE', 'ANNOUNCEMENT', `更新公告: ${ann.content.substring(0, 10)}...`);
    
    // If activating this one, deactivate others
    let updatedList = data.announcements.map(a => {
      if (a.id === id) return { ...a, ...updates };
      if (updates.isActive) return { ...a, isActive: false };
      return a;
    });

    setData(prev => ({
      ...prev,
      announcements: updatedList,
      logs: [...prev.logs, log]
    }));
  };

  const handleDeleteAnnouncement = (id: string) => {
    const ann = data.announcements.find(a => a.id === id);
    if(!ann) return;
    const log = logOperation('DELETE', 'ANNOUNCEMENT', `刪除公告: ${ann.content.substring(0, 10)}...`);
    
    setData(prev => ({
      ...prev,
      announcements: prev.announcements.filter(a => a.id !== id),
      logs: [...prev.logs, log]
    }));
  };

  // --- REUSABLE VISUAL FILTER BAR ---
  const FilterBar = () => {
    const FilterChip = ({ active, label, onClick, icon: Icon }: any) => (
      <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
          active 
            ? 'bg-stone-800 text-white border-stone-800 shadow-md' 
            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400 hover:bg-stone-50'
        }`}
      >
        {Icon && <Icon size={12} />}
        {label}
      </button>
    );

    return (
      <div className="bg-white p-4 rounded-[1.5rem] border border-stone-200 shadow-sm animate-in fade-in slide-in-from-top-2 flex flex-col gap-4">
        
        {/* Row 1: Role & Time Type */}
        <div className="flex flex-wrap items-center gap-2">
           <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-2">權責</div>
           {[
            { id: 'all', label: '全部' },
            { id: 'created_by_me', label: '我建立' },
            { id: 'assigned_to_me', label: '被指派' },
            { id: 'assigned_by_me', label: '我指派' },
           ].map(role => (
             <FilterChip 
               key={role.id} 
               label={role.label} 
               active={filterRole === role.id} 
               onClick={() => setFilterRole(role.id as any)} 
             />
           ))}

           <div className="w-px h-4 bg-stone-300 mx-2"></div>

           <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-2">類型</div>
           <FilterChip label="全部" active={filterType === 'all'} onClick={() => setFilterType('all')} />
           <FilterChip label="零碎" icon={Zap} active={filterType === 'misc'} onClick={() => setFilterType('misc')} />
           <FilterChip label="當日" icon={Sun} active={filterType === 'daily'} onClick={() => setFilterType('daily')} />
           <FilterChip label="長期" icon={Briefcase} active={filterType === 'long'} onClick={() => setFilterType('long')} />
        </div>

        {/* Row 2: Goals */}
        <div className="flex flex-wrap items-center gap-2">
           <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-2">目標</div>
           <FilterChip label="所有目標" active={filterGoal === 'all'} onClick={() => setFilterGoal('all')} />
           {INITIAL_GOALS.map(g => (
             <FilterChip key={g} label={g} active={filterGoal === g} onClick={() => setFilterGoal(g)} />
           ))}
        </div>
        
        {/* Row 3: Admin User Filter (if applicable) & Reset */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100">
          {(data.currentUser.role === 'admin' || data.currentUser.role === 'manager') && (
            <div className="flex items-center gap-2">
               <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">負責人</div>
               <select 
                 value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
                 className="px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-200 text-xs font-bold text-stone-600 outline-none cursor-pointer"
               >
                 <option value="all">顯示全部</option>
                 {data.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
               </select>
            </div>
          )}

          <div className="flex-1"></div>

          {(filterRole !== 'all' || filterType !== 'all' || filterGoal !== 'all' || filterAssignee !== 'all') && (
            <button 
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-bold text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RotateCcw size={12} /> 重置篩選
            </button>
          )}
        </div>
      </div>
    );
  };

  // --- RENDER CONTENT ---
  
  const renderContent = () => {
    // === PROJECT DETAIL VIEW ===
    if (currentTab === 'projects' && selectedProjectId) {
      const project = data.projects.find(p => p.id === selectedProjectId);
      const projectTasks = activeTasks.filter(t => t.projectId === selectedProjectId);
      const totalHrs = projectTasks.reduce((acc, t) => acc + convertToHours(t.timeValue, t.timeType), 0);

      const handleSaveProject = () => {
        if(selectedProjectId && editProjectData.name) {
          handleUpdateProject(selectedProjectId, editProjectData);
        }
      };

      return (
        <div className="space-y-6">
           {/* Detail Header with View Switcher */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <button onClick={() => setSelectedProjectId(null)} className="flex items-center text-stone-500 hover:text-stone-800">
               <ArrowLeft size={18} className="mr-2" /> 返回專案列表
             </button>
             
             {/* Detail View Switcher */}
             <div className="flex items-center bg-stone-200 p-1 rounded-xl">
                {VIEW_MODES.filter(m => m.id === 'board' || m.id === 'card' || m.id === 'list').map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setProjectDetailViewMode(m.id as ViewMode)}
                    className={`p-2 rounded-lg transition-all ${projectDetailViewMode === m.id ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
                    title={m.label}
                  >
                    <m.icon size={20} />
                  </button>
                ))}
             </div>
           </div>
           
           {/* Project Info Header (With Edit Support) */}
           <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm relative group">
             <div className="flex justify-between items-start">
               <div className="flex-1 mr-8">
                  {isEditingProject ? (
                    <div className="space-y-3">
                       <input 
                         value={editProjectData.name}
                         onChange={(e) => setEditProjectData(prev => ({...prev, name: e.target.value}))}
                         className="text-3xl font-bold text-stone-800 w-full border border-orange-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-orange-500 outline-none"
                         placeholder="專案名稱"
                       />
                       <textarea 
                         value={editProjectData.description}
                         onChange={(e) => setEditProjectData(prev => ({...prev, description: e.target.value}))}
                         className="text-stone-600 w-full border border-orange-200 rounded-lg px-2 py-2 focus:ring-2 focus:ring-orange-500 outline-none h-20"
                         placeholder="專案描述..."
                       />
                       <div className="flex gap-2">
                         <button onClick={handleSaveProject} className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-600">
                           <Check size={16} /> 儲存
                         </button>
                         <button onClick={() => setIsEditingProject(false)} className="flex items-center gap-1 bg-stone-200 text-stone-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-stone-300">
                           <X size={16} /> 取消
                         </button>
                       </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-stone-800">{project?.name}</h1>
                        <button 
                          onClick={() => {
                            if(project) {
                              setEditProjectData({ name: project.name, description: project.description });
                              setIsEditingProject(true);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                      <p className="text-stone-500 mt-2">{project?.description}</p>
                    </>
                  )}
               </div>
               <div className="text-right">
                  <p className="text-xs font-bold text-stone-400 uppercase">總投入</p>
                  <p className="text-4xl font-bold text-amber-500">{totalHrs.toFixed(1)} <span className="text-lg text-stone-400">小時</span></p>
               </div>
             </div>
           </div>

           {/* Content based on projectDetailViewMode */}
           {projectDetailViewMode === 'board' ? (
             // --- Kanban / Board View (3-Column) ---
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2">
               {['misc', 'daily', 'long'].map(type => (
                 <div key={type} className="bg-stone-50 rounded-[2rem] p-6 border border-stone-200">
                   <h3 className="font-bold text-stone-600 uppercase text-sm mb-4 border-b border-stone-200 pb-2 flex justify-between">
                     {type === 'misc' ? '零碎工作 (分鐘)' : type === 'daily' ? '當日工作 (小時)' : '長期任務 (天)'}
                   </h3>
                   <div className="space-y-3">
                     {projectTasks.filter(t => t.timeType === type).map(task => (
                       <div 
                         key={task.id} 
                         onClick={() => setSelectedTask(task)}
                         className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
                       >
                         <span className={task.status === 'done' ? 'line-through text-stone-400' : 'text-stone-800 font-medium'}>{task.title}</span>
                         <span className="text-xs font-bold bg-stone-100 px-2 py-1 rounded">{task.timeValue}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             // --- Card or List View (Reusing TaskViews) ---
             <TaskViews 
               mode="daily" 
               viewMode={projectDetailViewMode}
               tasks={projectTasks} // Only pass filtered tasks
               projects={data.projects}
               users={data.users}
               onUpdateTask={handleUpdateTask}
               onSelectProject={() => {}} // No-op, already in project
               onSelectTask={setSelectedTask}
             />
           )}
        </div>
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard 
            tasks={activeTasks} 
            projects={data.projects} 
            users={data.users}
            currentUser={data.currentUser}
            viewingUserId={viewingUserId}
            allocations={data.allocations} 
            onSwitchUser={setViewingUserId}
            onNavigateToTasks={(filter) => {
              // Reset other filters to ensure clear view
              setSearchTerm('');
              setFilterGoal('all');
              setFilterAssignee('all');
              setFilterRole('all');
              
              if (filter.timeType) {
                setFilterType(filter.timeType);
              }
              // To go to Daily view tasks, we use setCurrentTab. 
              // handleNavigate is safer as it resets selection
              setCurrentTab('daily');
              setSelectedProjectId(null);
              if (viewMode === 'group') setViewMode('grid');
            }}
            onOpenCreate={() => { setIsProjectCreation(false); setShowCreateModal(true); }}
          />
        );
      
      case 'daily':
        return (
          <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-stone-800">日常任務</h1>
                <p className="text-stone-500">管理您的日常作業流程</p>
              </div>
              <div className="flex items-center bg-stone-200 p-1 rounded-xl">
                 {VIEW_MODES.filter(v => v.id !== 'group' && v.id !== 'board').map(m => (
                   <button 
                     key={m.id}
                     onClick={() => setViewMode(m.id as ViewMode)}
                     className={`p-2 rounded-lg transition-all ${viewMode === m.id ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
                   >
                     <m.icon size={20} />
                   </button>
                 ))}
              </div>
            </header>
            
            <div className="flex flex-col gap-4">
               <div className="flex gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="搜尋任務..." 
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-400 outline-none" 
                    />
                  </div>
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors ${showFilters ? 'bg-stone-800 text-white border-stone-800' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                  >
                    <SlidersHorizontal size={18} /> 篩選
                  </button>
               </div>

               {/* Visual Filter Bar */}
               {showFilters && <FilterBar />}
            </div>

            <TaskViews 
              mode="daily" 
              tasks={displayedTasks} 
              projects={data.projects} 
              users={data.users}
              viewMode={viewMode} 
              onUpdateTask={handleUpdateTask}
              onSelectProject={(id) => { 
                // Navigate to Projects Tab and Select Project
                setCurrentTab('projects');
                setSelectedProjectId(id);
              }}
              onSelectTask={setSelectedTask} 
            />
          </div>
        );

      case 'projects':
        // === TOP LEVEL PROJECT LIST ===
        return (
           <div className="space-y-6">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div>
                   <h1 className="text-3xl font-bold text-stone-800">專案任務</h1>
                   <p className="text-stone-500">聚合長期目標</p>
                 </div>
                 
                 {/* No View Switcher here - Forced to Group View */}
                 <div className="flex items-center gap-4">
                   <button 
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-colors ${showFilters ? 'bg-stone-800 text-white border-stone-800' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'}`}
                    >
                      <SlidersHorizontal size={18} /> 篩選
                    </button>
                 </div>
              </header>

              <div className="flex gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="搜尋專案或任務..." 
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-400 outline-none" 
                    />
                  </div>
              </div>

              {showFilters && <FilterBar />}

              <TaskViews 
                mode="project" 
                tasks={displayedTasks} 
                projects={data.projects} 
                users={data.users}
                viewMode="group" // Forced Group Mode
                searchTerm={searchTerm}
                onUpdateTask={handleUpdateTask}
                onSelectProject={(id) => { setSelectedProjectId(id); }}
                onSelectTask={setSelectedTask}
                onProjectReorder={handleProjectReorder}
                onCreateProject={handleCreateProject}
              />
           </div>
        );
      
      case 'timeline':
        return (
          <TimelineView 
            tasks={activeTasks}
            allocations={data.allocations}
            currentUser={data.currentUser}
            users={data.users}
            viewingUserId={viewingUserId === 'ALL' ? data.currentUser.id : viewingUserId} 
            onUpdateTask={handleUpdateTask}
            onAddAllocation={handleAddAllocation}
            onUpdateAllocation={handleUpdateAllocation}
            onRemoveAllocation={handleRemoveAllocation}
            onSwitchUser={setViewingUserId}
            onSelectTask={setSelectedTask} 
          />
        );

      case 'knowledge':
        return (
          <KnowledgeBase 
            tasks={activeTasks} 
            users={data.users} 
            onSelectTask={setSelectedTask} 
          />
        );

      case 'announcement':
        // Determine styles based on level
        const annLevel = activeAnnouncement?.level || 'info';
        let annStyles = {
          bg: 'bg-stone-50',
          border: 'border-stone-100',
          title: 'text-stone-800',
          iconColor: 'text-blue-600',
          iconBg: 'bg-blue-100',
          icon: Info,
          label: '一般通知'
        };

        if (annLevel === 'urgent') {
          annStyles = {
            bg: 'bg-red-50',
            border: 'border-red-100',
            title: 'text-red-900',
            iconColor: 'text-red-600',
            iconBg: 'bg-red-100',
            icon: AlertTriangle,
            label: '緊急通知'
          };
        } else if (annLevel === 'warning') {
          annStyles = {
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            title: 'text-amber-900',
            iconColor: 'text-amber-600',
            iconBg: 'bg-amber-100',
            icon: Megaphone,
            label: '重要提醒'
          };
        }

        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
             <header>
               <h1 className="text-3xl font-bold text-stone-800 mb-2">系統公告</h1>
               <p className="text-stone-500 font-medium">查看最新消息與系統通知</p>
             </header>

             {/* Current Active Announcement Card */}
             <div className={`rounded-[2.5rem] p-10 border shadow-lg relative overflow-hidden ${annStyles.bg} ${annStyles.border}`}>
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <annStyles.icon size={200} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                     <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${annStyles.iconBg} ${annStyles.iconColor} shadow-sm`}>
                        <annStyles.icon size={32} />
                     </div>
                     <div>
                        <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/60 ${annStyles.iconColor}`}>
                          {annStyles.label}
                        </span>
                        <h2 className={`text-3xl font-bold mt-2 ${annStyles.title}`}>最新公告內容</h2>
                     </div>
                  </div>
                  
                  {activeAnnouncement ? (
                    <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[2rem] border border-white/50 shadow-sm">
                      <div className="prose prose-lg prose-stone max-w-none text-stone-700 leading-loose whitespace-pre-wrap font-medium">
                        {activeAnnouncement.content}
                      </div>
                      <div className="mt-4 text-xs font-bold text-stone-400 text-right">
                        發布時間: {new Date(activeAnnouncement.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-stone-400 bg-white/50 rounded-[2rem] border border-dashed border-stone-200">
                       <p>目前尚無已發布的系統公告</p>
                    </div>
                  )}
                </div>
             </div>

             {/* History */}
             <div className="pt-8">
                <div className="flex items-center gap-3 mb-6">
                   <div className="h-px bg-stone-200 flex-1"></div>
                   <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} /> 歷史紀錄
                   </h3>
                   <div className="h-px bg-stone-200 flex-1"></div>
                </div>

                <div className="space-y-4">
                   {data.announcements
                     .filter(a => !a.isActive) // Show inactive ones in history
                     .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                     .map(ann => {
                       let levelStyle = 'bg-stone-100 text-stone-500';
                       if (ann.level === 'urgent') levelStyle = 'bg-red-100 text-red-600';
                       else if (ann.level === 'warning') levelStyle = 'bg-amber-100 text-amber-600';
                       else if (ann.level === 'info') levelStyle = 'bg-blue-50 text-blue-600';

                       return (
                         <div key={ann.id} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex gap-5 items-center opacity-80 hover:opacity-100 transition-all hover:shadow-md">
                            <div className="flex flex-col items-center min-w-[80px]">
                               <div className="text-xs font-bold text-stone-400 mb-1">{new Date(ann.createdAt).getFullYear()}</div>
                               <div className="text-sm font-bold text-stone-600 bg-stone-100 px-2 py-1 rounded-lg">
                                 {new Date(ann.createdAt).toLocaleDateString('zh-TW', {month:'short', day:'numeric'})}
                               </div>
                            </div>
                            <div className="w-px h-10 bg-stone-100"></div>
                            <div className="flex-1">
                               <p className="text-stone-800 font-medium text-base line-clamp-2 leading-relaxed">
                                 {ann.content}
                               </p>
                            </div>
                            <div>
                               <div className={`w-3 h-3 rounded-full ${levelStyle.split(' ')[0]}`}></div>
                            </div>
                         </div>
                       );
                     })}
                   {data.announcements.filter(a => !a.isActive).length === 0 && (
                      <p className="text-center text-stone-400 text-sm py-10">無歷史紀錄</p>
                   )}
                </div>
             </div>
          </div>
        );
        
      case 'admin':
        return (
          <AdminCenter 
            data={data}
            onAddGoal={handleAddGoal}
            onToggleGoal={() => {}} 
            onUpdateUser={handleUpdateUser}
            onCreateAnnouncement={handleCreateAnnouncement}
            onUpdateAnnouncement={handleUpdateAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
          />
        );

      default: return null;
    }
  };

  return (
    <Layout 
      currentTab={currentTab} 
      onNavigate={handleNavigate}
      onOpenCreate={() => { setIsProjectCreation(false); setShowCreateModal(true); }}
      currentUser={data.currentUser}
      activeAnnouncement={activeAnnouncement}
    >
      {renderContent()}
      
      {/* Modals */}
      {showCreateModal && (
        <CreateTaskModal 
          users={data.users}
          currentUser={data.currentUser}
          onClose={() => setShowCreateModal(false)} 
          onCreate={handleCreateTasks} 
        />
      )}
      
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          users={data.users}
          currentUser={data.currentUser}
          logs={data.logs} 
          allocations={data.allocations}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onConvertToKnowledge={handleConvertToKnowledge}
          onDelete={handleDeleteTask}
          onNavigateToTimeline={() => { setSelectedTask(null); handleNavigate('timeline'); }} 
        />
      )}
    </Layout>
  );
};

export default App;