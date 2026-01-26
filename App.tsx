
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskViews from './components/TaskViews';
import CreateTaskModal from './components/CreateTaskModal';
import CreateProjectModal from './components/CreateProjectModal'; 
import TaskDetailModal from './components/TaskDetailModal'; 
import AdminCenter from './components/AdminCenter';
import TimelineView from './components/TimelineView';
import KnowledgeBase from './components/KnowledgeBase';
import RoutineManager from './components/RoutineManager'; 
import PersonalDashboard from './components/PersonalDashboard';
import TaskListView from './components/TaskListView';
import AnnouncementView from './components/AnnouncementView';
import FeatureRequestView from './components/FeatureRequestView';
import { NavTab, Task, Project, AppState, TaskAllocation, RoutineStatus, RoutineTemplate, TaskTemplate, FeatureRequest, TimeType, User, GoalCategory, Announcement } from './types';
import { INITIAL_GOALS, INITIAL_TUTORIALS, generateId } from './constants';
import { api } from './services/api';

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alex Chen', role: 'admin', department: '研發部', active: true, workdayStart: '09:00', workdayEnd: '18:00', dailyHours: 9, defaultLongTaskConversion: 8 },
  { id: 'u2', name: '林書豪', role: 'manager', department: '設計部', active: true, workdayStart: '08:30', workdayEnd: '17:30', dailyHours: 9, defaultLongTaskConversion: 8 },
  { id: 'u3', name: '王大明', role: 'user', department: '業務部', active: true, workdayStart: '09:00', workdayEnd: '18:00', dailyHours: 9, defaultLongTaskConversion: 8 },
  { id: 'u4', name: '張小美', role: 'user', department: '設計部', active: true, workdayStart: '09:00', workdayEnd: '18:00', dailyHours: 9, defaultLongTaskConversion: 8 },
  { id: 'u5', name: '李阿龍', role: 'manager', department: '業務部', active: true, workdayStart: '09:00', workdayEnd: '18:00', dailyHours: 9, defaultLongTaskConversion: 8 }
];

const App = () => {
  const [data, setData] = useState<AppState>({
    tasks: [],
    projects: [
      { id: 'p1', name: '市場與競品分析', description: '深度分析目前市場趨勢', createdAt: new Date().toISOString(), projectOrder: 0, archived: false },
      { id: 'p2', name: '2026 產品路線圖', description: '規劃未來年度產品方向', createdAt: new Date().toISOString(), projectOrder: 1, archived: false }
    ],
    goals: INITIAL_GOALS,
    logs: [],
    loginLogs: [],
    users: MOCK_USERS,
    currentUser: MOCK_USERS[0],
    allocations: [],
    announcements: [],
    routineTemplates: [],
    tutorials: INITIAL_TUTORIALS,
    featureRequests: [],
    taskTemplates: []
  });

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [viewingUserId, setViewingUserId] = useState<string>('u1');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false); 
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projects = await api.getProjects();
        // 暫時保留 Mock 資料，因為後端還沒有任務端點
        setData(prev => ({
          ...prev,
          projects: projects.length > 0 ? projects : prev.projects
        }));
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const handleSwitchCurrentUser = (userId: string) => {
    const newUser = data.users.find(u => u.id === userId);
    if (newUser) {
      setData(prev => ({ ...prev, currentUser: newUser }));
      setViewingUserId(userId);
    }
  };

  const handleCreateTasks = (tasks: Partial<Task>[], project?: Partial<Project>) => {
    const newTasks = tasks.map(t => ({
      ...t,
      id: generateId('TASK'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collaboratorIds: t.collaboratorIds || [],
      watchers: [],
      attachments: t.attachments || [],
      requireProof: false
    } as Task));

    setData(prev => ({
      ...prev,
      tasks: [...prev.tasks, ...newTasks],
      projects: project ? [...prev.projects, project as Project] : prev.projects
    }));
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    setData(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
    }));
  };

  const handleDeleteProject = (id: string) => {
    setData(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      tasks: prev.tasks.map(t => t.projectId === id ? { ...t, projectId: null } : t)
    }));
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  const handleCreateProjectFull = (projectData: Partial<Project>, tasksData: Partial<Task>[]) => {
    const newProjectId = generateId('PROJ');
    const newProject: Project = { 
      id: newProjectId, 
      name: projectData.name || '未命名專案', 
      description: projectData.description || '', 
      createdAt: new Date().toISOString(), 
      projectOrder: data.projects.length, 
      archived: false 
    };

    const newTasks = tasksData.map(t => ({
      ...t,
      id: generateId('TASK'),
      projectId: newProjectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      collaboratorIds: [],
      watchers: [],
      attachments: [],
      requireProof: false
    } as Task));

    setData(prev => ({ 
      ...prev, 
      projects: [...prev.projects, newProject],
      tasks: [...prev.tasks, ...newTasks]
    }));
    
    setSelectedProjectId(newProjectId);
    setShowCreateProjectModal(false);
  };

  const handleAddAllocation = (alloc: TaskAllocation) => {
    setData(prev => ({
      ...prev,
      allocations: [...prev.allocations, alloc]
    }));
  };

  const handleUpdateAllocation = (id: string, updates: Partial<TaskAllocation>) => {
    setData(prev => ({
      ...prev,
      allocations: prev.allocations.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  };

  const handleRemoveAllocation = (id: string) => {
    setData(prev => ({
      ...prev,
      allocations: prev.allocations.filter(a => a.id !== id)
    }));
  };

  const handleUpdateRoutineTemplate = (id: string, updates: Partial<RoutineTemplate>) => {
    setData(prev => ({
      ...prev,
      routineTemplates: prev.routineTemplates.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const instantiateRoutine = (t: RoutineTemplate): Task => {
    const newTask = {
      id: generateId('TASK'),
      title: t.title,
      description: t.description,
      aiRiskHint: t.aiRiskHint, 
      timeType: t.timeType,
      timeValue: t.timeValue,
      goal: t.goal,
      role: 'created_by_me',
      projectId: null,
      status: 'todo',
      startAt: new Date().toISOString(),
      dueAt: new Date().toISOString(),
      creatorId: data.currentUser.id,
      assigneeId: data.currentUser.id,
      collaboratorIds: [],
      watchers: [],
      requireProof: false,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderDaily: 0,
      orderInProject: 0,
      fromRoutineId: t.id
    } as Task;
    setData(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
    return newTask;
  };

  const activeAnnouncement = useMemo(() => {
    return data.announcements.find(a => a.isActive);
  }, [data.announcements]);

  return (
    <Layout 
      currentTab={currentTab} 
      onNavigate={setCurrentTab} 
      onOpenCreate={() => setShowCreateModal(true)}
      currentUser={data.currentUser}
      users={data.users}
      onSwitchUser={handleSwitchCurrentUser}
      activeAnnouncement={activeAnnouncement}
    >
      {currentTab === 'dashboard' && (
        <Dashboard 
          tasks={data.tasks} 
          projects={data.projects} 
          users={data.users} 
          currentUser={data.currentUser}
          viewingUserId={viewingUserId}
          allocations={data.allocations}
          onSwitchUser={setViewingUserId}
          onNavigateToTasks={() => setCurrentTab('task_list')}
          onOpenCreate={() => setShowCreateModal(true)}
        />
      )}

      {currentTab === 'projects' && (
        <TaskViews 
          mode="project"
          tasks={data.tasks}
          projects={data.projects}
          users={data.users}
          viewMode="card"
          onUpdateTask={handleUpdateTask}
          onSelectProject={setSelectedProjectId}
          onDeleteProject={handleDeleteProject}
          selectedProjectId={selectedProjectId}
          onSelectTask={setSelectedTask}
          onOpenCreateProject={() => setShowCreateProjectModal(true)}
        />
      )}

      {currentTab === 'daily' && (
        <TaskViews 
          mode="daily"
          tasks={data.tasks}
          projects={data.projects}
          users={data.users}
          viewMode="card"
          onUpdateTask={handleUpdateTask}
          onSelectProject={setSelectedProjectId}
          selectedProjectId={selectedProjectId}
          onSelectTask={setSelectedTask}
        />
      )}

      {currentTab === 'personal_dashboard' && (
        <PersonalDashboard 
          tasks={data.tasks} 
          allocations={data.allocations} 
          users={data.users} 
          currentUser={data.currentUser}
          viewingUserId={viewingUserId}
          onSwitchUser={setViewingUserId}
          onSelectTask={setSelectedTask}
        />
      )}

      {currentTab === 'timeline' && (
        <TimelineView 
          tasks={data.tasks} 
          routineTemplates={data.routineTemplates}
          allocations={data.allocations}
          currentUser={data.currentUser}
          users={data.users}
          viewingUserId={viewingUserId}
          onUpdateTask={handleUpdateTask}
          onUpdateAllocation={handleUpdateAllocation}
          onAddAllocation={handleAddAllocation}
          onInstantiateRoutine={instantiateRoutine}
          onUpdateRoutineTemplate={handleUpdateRoutineTemplate}
          onRemoveAllocation={handleRemoveAllocation}
          onSwitchUser={setViewingUserId}
          onSelectTask={setSelectedTask}
          taskTemplates={data.taskTemplates}
          onSaveTemplate={(task) => {
            const template: TaskTemplate = {
              id: generateId('TPL'),
              title: task.title,
              description: task.description,
              goal: task.goal,
              timeType: task.timeType,
              timeValue: task.timeValue,
              source: 'user',
              useCount: 1
            };
            setData(prev => ({ ...prev, taskTemplates: [...prev.taskTemplates, template] }));
          }}
        />
      )}

      {currentTab === 'task_list' && (
        <TaskListView 
          tasks={data.tasks} 
          users={data.users} 
          onSelectTask={setSelectedTask} 
        />
      )}

      {currentTab === 'admin' && (
        <AdminCenter data={data} />
      )}

      {currentTab === 'knowledge' && (
        <KnowledgeBase 
          tasks={data.tasks} 
          users={data.users} 
          onSelectTask={setSelectedTask} 
        />
      )}

      {currentTab === 'routines' && (
        <RoutineManager 
          currentUser={data.currentUser} 
          users={data.users} 
          templates={data.routineTemplates} 
          onInstantiate={instantiateRoutine} 
          onSaveTemplate={(t) => setData(prev => ({ 
            ...prev, 
            routineTemplates: prev.routineTemplates.some(old => old.id === t.id) 
              ? prev.routineTemplates.map(old => old.id === t.id ? t : old) 
              : [...prev.routineTemplates, t] 
          }))}
          onDeleteTemplate={(id) => setData(prev => ({ ...prev, routineTemplates: prev.routineTemplates.filter(t => t.id !== id) }))}
          onToggleTemplate={(id, status) => handleUpdateRoutineTemplate(id, { status })}
        />
      )}

      {currentTab === 'announcement' && (
        <AnnouncementView 
          announcements={data.announcements} 
          currentUser={data.currentUser} 
          onCreate={(ann) => {
            const newAnn: Announcement = {
              ...ann,
              id: generateId('ANN'),
              createdAt: new Date().toISOString(),
              createdBy: data.currentUser.id,
              readBy: [],
              isActive: true
            } as Announcement;
            setData(prev => ({ ...prev, announcements: [...prev.announcements, newAnn] }));
          }}
        />
      )}

      {currentTab === 'feature_request' && (
        <FeatureRequestView 
          data={data} 
          onCreateRequest={(req) => {
            const newReq: FeatureRequest = {
              ...req,
              id: generateId('REQ'),
              createdAt: new Date().toISOString(),
              createdBy: data.currentUser.id,
              status: 'pending',
              attachments: []
            } as FeatureRequest;
            setData(prev => ({ ...prev, featureRequests: [...prev.featureRequests, newReq] }));
          }} 
        />
      )}

      {showCreateModal && (
        <CreateTaskModal 
          users={data.users} 
          currentUser={data.currentUser} 
          projects={data.projects}
          onClose={() => setShowCreateModal(false)} 
          onCreate={handleCreateTasks} 
        />
      )}

      {showCreateProjectModal && (
        <CreateProjectModal 
          currentUser={data.currentUser}
          users={data.users}
          onClose={() => setShowCreateProjectModal(false)}
          onCreate={handleCreateProjectFull}
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
          onConvertToKnowledge={(task) => {}}
          onDelete={(id) => setData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }))}
          onNavigateToTimeline={() => setCurrentTab('timeline')}
        />
      )}
    </Layout>
  );
};

export default App;
