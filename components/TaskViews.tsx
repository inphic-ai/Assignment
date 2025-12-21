import React, { useState } from 'react';
import { Task, Project, ViewMode, TaskStatus, User } from '../types';
import { Calendar, Zap, Target, MoreHorizontal, CheckSquare, Square, FileText, Sun, Briefcase, Paperclip, GripHorizontal, User as UserIcon, AlertCircle, Clock, Inbox, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { convertToHours } from '../constants';

interface TaskViewsProps {
  mode: 'daily' | 'project';
  tasks: Task[];
  projects: Project[];
  users: User[];
  viewMode: ViewMode;
  searchTerm?: string; // Added search term prop
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onSelectProject: (id: string) => void;
  onSelectTask: (task: Task) => void;
  onProjectReorder?: (dragIndex: number, hoverIndex: number) => void;
  onCreateProject?: () => void;
}

const TaskViews: React.FC<TaskViewsProps> = ({ 
  mode, tasks, projects, users, viewMode, searchTerm = '',
  onUpdateTask, onSelectProject, onSelectTask, onProjectReorder, onCreateProject
}) => {
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: 'default' | 'createdAt' | 'dueAt', direction: 'asc' | 'desc' }>({ 
    key: 'default', 
    direction: 'asc' 
  });

  // Sort projects by order
  const sortedProjects = [...projects].sort((a, b) => a.projectOrder - b.projectOrder);

  const filteredTasks = tasks.filter(t => filter === 'all' || t.status === filter);
  
  // 1. Status Priority Map (Lower number = Higher priority in sort)
  const statusPriority: Record<TaskStatus, number> = {
    'todo': 0,
    'doing': 1,
    'submitted': 2,
    'done': 3,
    'archived': 4
  };

  // 2. Sorting Logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // Check for explicit sort columns
    if (sortConfig.key === 'createdAt') {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }

    if (sortConfig.key === 'dueAt') {
      const dateA = new Date(a.dueAt).getTime();
      const dateB = new Date(b.dueAt).getTime();
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }

    // Default Sort Logic (Status -> Due -> Created)
    // Primary: Status (Todo > Doing > Submitted > Done > Archived)
    const statusDiff = statusPriority[a.status] - statusPriority[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Secondary: Due Date (Ascending - Earliest first)
    const dueA = new Date(a.dueAt).getTime();
    const dueB = new Date(b.dueAt).getTime();
    const dueDiff = dueA - dueB;
    if (dueDiff !== 0) return dueDiff;
    
    // Tertiary: Created Date (Descending - Newest first)
    const createdA = new Date(a.createdAt).getTime();
    const createdB = new Date(b.createdAt).getTime();
    return createdB - createdA;
  });

  const handleSort = (key: 'createdAt' | 'dueAt') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: 'createdAt' | 'dueAt') => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const getStatusColor = (status: TaskStatus) => {
    switch(status) {
      case 'done': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'submitted': return 'bg-violet-50 text-violet-600 border-violet-100';
      case 'doing': return 'bg-orange-50 text-orange-600 border-orange-100';
      default: return 'bg-stone-50 text-stone-500 border-stone-100';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch(status) {
      case 'done': return '已完成';
      case 'submitted': return '送審中';
      case 'doing': return '進行中';
      case 'todo': return '待辦';
      default: return status;
    }
  };

  // Enhanced Visual Config based on TimeType
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'misc': return {
        icon: Zap,
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        label: '零碎',
        accent: 'border-l-emerald-500'
      };
      case 'daily': return {
        icon: Sun,
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        label: '當日',
        accent: 'border-l-blue-500'
      };
      case 'long': return {
        icon: Briefcase,
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        label: '長期',
        accent: 'border-l-purple-500'
      };
      default: return {
        icon: FileText,
        bg: 'bg-stone-50',
        border: 'border-stone-200',
        text: 'text-stone-700',
        label: '一般',
        accent: 'border-l-stone-500'
      };
    }
  };

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || '未知';
  };

  const AssigneeAvatar = ({ userId }: { userId: string }) => {
    const user = users.find(u => u.id === userId);
    return (
      <div className="w-6 h-6 rounded-full bg-stone-200 border border-white flex items-center justify-center text-[10px] font-bold text-stone-500" title={user?.name}>
        {user?.name.charAt(0) || '?'}
      </div>
    );
  };

  // --- DRAG HANDLERS FOR PROJECTS ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('dragIndex', index.toString());
    e.dataTransfer.setData('type', 'project');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('type', 'task');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.stopPropagation();
    const type = e.dataTransfer.getData('type');
    
    if (type === 'project') {
      const dragIndex = Number(e.dataTransfer.getData('dragIndex'));
      if (dragIndex === dropIndex) return;
      if (onProjectReorder) {
        onProjectReorder(dragIndex, dropIndex);
      }
    }
  };

  const handleDropTaskOnProject = (e: React.DragEvent, projectId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    if (type === 'task') {
      const taskId = e.dataTransfer.getData('taskId');
      // Assign task to this project
      onUpdateTask(taskId, { projectId: projectId });
    }
  };

  // --- RENDERERS ---

  const renderGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {sortedTasks.map(task => {
        const typeConfig = getTypeConfig(task.timeType);
        const TypeIcon = typeConfig.icon;
        
        return (
          <div 
            key={task.id} 
            draggable
            onDragStart={(e) => handleTaskDragStart(e, task.id)}
            onClick={() => onSelectTask(task)} 
            className={`bg-white p-4 rounded-3xl shadow-sm hover:shadow-xl transition-all flex flex-col justify-between aspect-square group relative border-t-4 ${typeConfig.border.replace('border-', 'border-t-')} border-x border-b border-stone-100 cursor-pointer overflow-hidden active:cursor-grabbing`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${typeConfig.bg} ${typeConfig.text}`}>
                 <TypeIcon size={16} />
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${typeConfig.bg} ${typeConfig.text}`}>
                 {task.timeValue} {task.timeType === 'misc' ? 'm' : task.timeType === 'daily' ? 'h' : 'd'}
              </span>
            </div>
            
            <div className="flex-1">
              <h4 className="font-bold text-stone-800 leading-tight line-clamp-2 mb-1 text-sm">{task.title}</h4>
              <p className="text-[10px] text-stone-400 truncate">{task.goal}</p>
            </div>

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-stone-50">
               {task.status === 'done' ? (
                 <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-1"><CheckSquare size={12}/> 完成</span>
               ) : (
                 <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getStatusColor(task.status)}`}>{getStatusLabel(task.status)}</span>
               )}
               <AssigneeAvatar userId={task.assigneeId} />
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedTasks.map(task => {
        const typeConfig = getTypeConfig(task.timeType);
        const TypeIcon = typeConfig.icon;

        return (
          <div 
            key={task.id} 
            draggable
            onDragStart={(e) => handleTaskDragStart(e, task.id)}
            onClick={() => onSelectTask(task)}
            className={`bg-white rounded-[2rem] shadow-sm hover:shadow-lg transition-all relative group flex flex-col cursor-pointer overflow-hidden border border-stone-100 border-l-[6px] ${typeConfig.accent} active:cursor-grabbing`}
          >
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-3">
                 <div className="flex gap-2 items-center">
                    <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${typeConfig.bg} ${typeConfig.text}`}>
                       <TypeIcon size={12} />
                       {typeConfig.label} {task.timeValue}{task.timeType === 'misc' ? '分' : task.timeType === 'daily' ? '時' : '天'}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                 </div>
                 <AssigneeAvatar userId={task.assigneeId} />
              </div>
              
              <h3 className="text-lg font-bold text-stone-800 mb-2">{task.title}</h3>
              <p className="text-stone-500 text-sm line-clamp-2">{task.description || '暫無描述...'}</p>
            </div>
            
            <div className="mt-auto px-6 py-4 bg-stone-50/50 flex items-center justify-between border-t border-stone-100">
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 text-xs font-bold text-stone-400">
                    <Calendar size={14} />
                    {new Date(task.dueAt).toLocaleDateString('zh-TW')}
                 </div>
                 {task.attachments && task.attachments.length > 0 && (
                   <div className="flex items-center gap-1 text-xs text-stone-400">
                     <Paperclip size={12} /> {task.attachments.length}
                   </div>
                 )}
               </div>

               {task.projectId && (
                 <span 
                    onClick={(e) => { e.stopPropagation(); onSelectProject(task.projectId!); }}
                    className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md cursor-pointer hover:bg-orange-100 flex items-center gap-1"
                 >
                   <Target size={10} />
                   {projects.find(p => p.id === task.projectId)?.name.slice(0, 6) || '專案'}
                 </span>
               )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderList = () => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden p-2">
      <table className="w-full text-left border-collapse">
        <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold tracking-wider">
          <tr>
            <th className="p-5 rounded-l-xl w-12"></th>
            <th className="p-5">任務名稱</th>
            <th className="p-5 w-24">類型</th>
            <th className="p-5 w-24">目標</th>
            <th className="p-5 w-24">負責人</th>
            
            {/* Clickable Header for Created At */}
            <th 
              className="p-5 w-32 cursor-pointer hover:bg-stone-100 transition-colors group select-none"
              onClick={() => handleSort('createdAt')}
            >
              <div className="flex items-center gap-1">
                建立
                <span className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'createdAt' ? 'opacity-100 text-amber-500' : ''}`}>
                  {sortConfig.key === 'createdAt' ? getSortIcon('createdAt') : <ArrowDown size={12} className="text-stone-300" />}
                </span>
              </div>
            </th>

            {/* Clickable Header for Due At */}
            <th 
              className="p-5 w-32 cursor-pointer hover:bg-stone-100 transition-colors group select-none"
              onClick={() => handleSort('dueAt')}
            >
              <div className="flex items-center gap-1">
                截止
                <span className={`opacity-0 group-hover:opacity-100 transition-opacity ${sortConfig.key === 'dueAt' ? 'opacity-100 text-amber-500' : ''}`}>
                  {sortConfig.key === 'dueAt' ? getSortIcon('dueAt') : <ArrowDown size={12} className="text-stone-300" />}
                </span>
              </div>
            </th>

            <th className="p-5 w-28">狀態</th>
            <th className="p-5 rounded-r-xl w-12"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {sortedTasks.map(task => {
            const typeConfig = getTypeConfig(task.timeType);
            const isOverdue = new Date(task.dueAt).getTime() < Date.now() && task.status !== 'done';

            return (
              <tr 
                key={task.id} 
                draggable
                onDragStart={(e) => handleTaskDragStart(e, task.id)}
                onClick={() => onSelectTask(task)} 
                className={`transition-colors group cursor-pointer border-l-4 ${
                  isOverdue 
                    ? 'bg-red-50 border-l-red-500 hover:bg-red-100' // More prominent background for overdue
                    : 'hover:bg-stone-50 border-l-transparent'
                }`}
              >
                <td className="p-5 text-center">
                   {task.status === 'done' ? <CheckSquare size={20} className="text-emerald-500" /> : <Square size={20} className="text-stone-300" />}
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isOverdue ? 'text-red-700' : 'text-stone-800'}`}>{task.title}</span>
                    {/* NEW: Overdue Badge */}
                    {isOverdue && (
                      <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase whitespace-nowrap shadow-sm">
                         <AlertCircle size={10} /> 逾期
                      </span>
                    )}
                  </div>
                  {task.attachments?.length > 0 && <span className="text-[10px] text-stone-400 flex items-center gap-1 mt-1"><Paperclip size={10} /> 有附件</span>}
                </td>
                <td className="p-5">
                   <span className={`text-xs font-bold px-2 py-1 rounded-md ${typeConfig.bg} ${typeConfig.text} border ${typeConfig.border}`}>
                      {typeConfig.label} {task.timeValue}{task.timeType === 'misc' ? 'm' : task.timeType === 'daily' ? 'h' : 'd'}
                   </span>
                </td>
                <td className="p-5">
                  <span className="text-xs font-medium text-stone-500 bg-stone-100 px-2 py-1 rounded">{task.goal}</span>
                </td>
                <td className="p-5">
                   <div className="flex items-center gap-2">
                     <AssigneeAvatar userId={task.assigneeId} />
                     <span className="text-xs font-medium text-stone-600">{getUserName(task.assigneeId)}</span>
                   </div>
                </td>
                
                {/* Created At Column */}
                <td className="p-5">
                   <div className="text-xs font-mono text-stone-400">
                     {new Date(task.createdAt).toLocaleDateString()}
                   </div>
                </td>

                {/* Due At Column */}
                <td className="p-5">
                   <div className={`text-xs font-mono flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-stone-400'}`}>
                     {isOverdue && <AlertCircle size={12} />}
                     {new Date(task.dueAt).toLocaleDateString()}
                   </div>
                </td>
                
                <td className="p-5">
                   <span className={`text-[10px] px-2 py-1 rounded font-bold ${getStatusColor(task.status)}`}>
                     {getStatusLabel(task.status)}
                   </span>
                </td>
                <td className="p-5 text-right">
                   <button className="text-stone-300 hover:text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal size={18} />
                   </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderGroup = () => {
    if (mode === 'daily') return renderCard(); 

    // Filter projects based on search term
    const projectList = sortedProjects.filter(p => 
      !p.archived && (
        !searchTerm || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // Check if project has matching tasks (tasks prop is already filtered by searchTerm in App.tsx)
        tasks.some(t => t.projectId === p.id)
      )
    );
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {projectList.map((project, idx) => {
          // Calculate stats
          const projectTasks = tasks.filter(t => t.projectId === project.id);
          const totalHours = projectTasks.reduce((acc, t) => acc + convertToHours(t.timeValue, t.timeType), 0);
          
          const previewItems = Array.from({ length: 4 }).map((_, i) => {
             const task = projectTasks[i];
             if (!task) return null; 
             return task;
          });
          
          return (
             <div 
               key={project.id}
               draggable
               onDragStart={(e) => handleDragStart(e, idx)}
               onDragOver={handleDragOver}
               onDrop={(e) => { 
                  // If dropping task, assign it. If dropping project, reorder.
                  const type = e.dataTransfer.getData('type');
                  if (type === 'task') handleDropTaskOnProject(e, project.id);
                  else handleDrop(e, idx);
               }}
               onClick={() => onSelectProject(project.id)}
               className="bg-white p-6 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 cursor-pointer hover:-translate-y-1 transition-all duration-300 group relative select-none"
             >
               <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-stone-300">
                  <GripHorizontal size={20} />
               </div>

               <div className="bg-stone-50 rounded-[1.5rem] p-4 mb-6 h-40 grid grid-cols-2 gap-3 mt-4 pointer-events-none">
                  {previewItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-center bg-white rounded-2xl shadow-sm border border-stone-50 h-full w-full overflow-hidden">
                       {item ? (
                         <div className={`w-full h-full flex flex-col items-center justify-center ${getTypeConfig(item.timeType).bg}`}>
                           {React.createElement(getTypeConfig(item.timeType).icon, { size: 16, className: getTypeConfig(item.timeType).text })}
                         </div>
                       ) : <div className="w-2 h-2 rounded-full bg-stone-200"></div>}
                    </div>
                  ))}
               </div>

               <div className="flex justify-between items-end">
                 <div>
                    {/* Project Name + ID Display Rule */}
                    <h3 className="text-xl font-bold text-stone-800 mb-1 flex items-center gap-2 flex-wrap">
                      {project.name}
                      <span className="text-[10px] font-mono font-normal text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                        {project.id}
                      </span>
                    </h3>
                    <div className="flex gap-2 text-xs font-medium text-stone-400">
                       <span>{projectTasks.length} 個任務</span>
                       <span>•</span>
                       <span className="text-amber-500 font-bold">{totalHours.toFixed(1)} hr</span>
                    </div>
                 </div>
               </div>
             </div>
          );
        })}
        
        {/* Project Create Button */}
        <div 
           onClick={onCreateProject}
           className="border-2 border-dashed border-stone-200 rounded-[2.5rem] flex flex-col items-center justify-center p-6 text-stone-400 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/50 transition-all cursor-pointer min-h-[300px] group"
        >
           <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-orange-500 transition-colors">
             <Plus size={32} />
           </div>
           <span className="font-bold">新建專案群組</span>
        </div>
      </div>
    )
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {mode === 'project' && viewMode === 'group' ? renderGroup() : (
        <>
          {viewMode === 'grid' && renderGrid()}
          {viewMode === 'card' && renderCard()}
          {viewMode === 'list' && renderList()}
        </>
      )}
    </div>
  );
};

export default TaskViews;