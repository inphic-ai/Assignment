
import React, { useState, useRef } from 'react';
import { AppState, LogEntry, User, GoalCategory, AnnouncementLevel, Announcement, TutorialTip } from '../types';
import { Users, History, Target, ShieldAlert, Plus, Ban, MoreHorizontal, Check, X, Edit2, Power, Shield, Smartphone, Globe, Settings, Bell, Camera, AlertTriangle, Info, Megaphone, Trash2, BookOpen, Lightbulb } from 'lucide-react';

interface AdminCenterProps {
  data: AppState;
  onAddGoal: (goal: string) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  onToggleGoal: (goal: GoalCategory, active: boolean) => void; 
  // Announcement Actions
  onCreateAnnouncement: (content: string, level: AnnouncementLevel) => void;
  onUpdateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  onDeleteAnnouncement: (id: string) => void;
  // Tutorial Actions (Add these to App.tsx later)
  onUpdateTutorial?: (id: string, updates: Partial<TutorialTip>) => void;
}

const AdminCenter: React.FC<AdminCenterProps> = ({ 
  data, onAddGoal, onUpdateUser, 
  onCreateAnnouncement, onUpdateAnnouncement, onDeleteAnnouncement,
  onUpdateTutorial
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'users' | 'goals' | 'login_logs' | 'system' | 'tutorials'>('logs');
  
  // User Editing State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<User>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Goal State
  const [newGoal, setNewGoal] = useState('');

  // System Settings State (Mocked)
  const [timezone, setTimezone] = useState('Asia/Taipei');
  
  // Announcement State
  const [announcementInput, setAnnouncementInput] = useState('');
  const [announcementLevel, setAnnouncementLevel] = useState<AnnouncementLevel>('info');
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  // Tutorial Editing State
  const [editingTutorialId, setEditingTutorialId] = useState<string | null>(null);
  const [editTutorialForm, setEditTutorialForm] = useState<Partial<TutorialTip>>({});

  const startEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditUserForm({ ...user });
  };

  const saveUser = () => {
    if (editingUserId && editUserForm) {
      onUpdateUser(editingUserId, editUserForm);
      setEditingUserId(null);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0] && editingUserId) {
        const file = e.target.files[0];
        const avatarUrl = URL.createObjectURL(file);
        setEditUserForm(prev => ({ ...prev, avatar: avatarUrl }));
     }
  };

  // --- Announcement Handlers ---
  const handleEditAnnouncement = (ann: Announcement) => {
    setEditingAnnouncementId(ann.id);
    setAnnouncementInput(ann.content);
    setAnnouncementLevel(ann.level);
  };

  const handleSaveAnnouncement = () => {
    if (!announcementInput.trim()) return;

    if (editingAnnouncementId) {
      onUpdateAnnouncement(editingAnnouncementId, { 
        content: announcementInput, 
        level: announcementLevel 
      });
      setEditingAnnouncementId(null);
    } else {
      onCreateAnnouncement(announcementInput, announcementLevel);
    }
    setAnnouncementInput('');
    setAnnouncementLevel('info');
  };

  const handleCancelAnnouncementEdit = () => {
    setEditingAnnouncementId(null);
    setAnnouncementInput('');
    setAnnouncementLevel('info');
  };

  // --- Tutorial Handlers ---
  const startEditTutorial = (tut: TutorialTip) => {
    setEditingTutorialId(tut.id);
    setEditTutorialForm({...tut});
  };

  const saveTutorial = () => {
    if (editingTutorialId && editTutorialForm && onUpdateTutorial) {
      onUpdateTutorial(editingTutorialId, editTutorialForm);
      setEditingTutorialId(null);
    }
  };

  // --- RENDERERS ---

  const renderLogs = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden p-2">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-100">
            <tr>
              <th className="p-5 rounded-tl-2xl">時間</th>
              <th className="p-5">人員</th>
              <th className="p-5">動作</th>
              <th className="p-5">對象</th>
              <th className="p-5 rounded-tr-2xl">詳情</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {[...data.logs].reverse().map(log => {
              const user = data.users.find(u => u.id === log.userId);
              return (
                <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-5 text-stone-400 font-mono text-xs">
                    {new Date(log.timestamp).toLocaleString('zh-TW')}
                  </td>
                  <td className="p-5 font-bold text-stone-700">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500 border border-stone-200 overflow-hidden">
                         {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover"/> : (user?.name.charAt(0) || '?')}
                       </div>
                       {user?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600' :
                      log.action === 'DELETE' ? 'bg-red-50 text-red-600' :
                      log.action === 'UPDATE' ? 'bg-orange-50 text-orange-600' :
                      'bg-stone-100 text-stone-600'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-5 text-stone-600 font-medium">{log.target}</td>
                  <td className="p-5 text-stone-500 max-w-xs truncate" title={log.details}>{log.details}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLoginLogs = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden p-2">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 font-bold border-b border-stone-100">
            <tr>
              <th className="p-5 rounded-tl-2xl">登入時間</th>
              <th className="p-5">人員</th>
              <th className="p-5">IP 位址</th>
              <th className="p-5">裝置</th>
              <th className="p-5 rounded-tr-2xl">狀態</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {[...data.loginLogs].reverse().map(log => (
              <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                <td className="p-5 text-stone-400 font-mono text-xs">
                  {new Date(log.timestamp).toLocaleString('zh-TW')}
                </td>
                <td className="p-5 font-bold text-stone-700">
                  <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-500">
                        {log.userName.charAt(0)}
                      </div>
                      {log.userName}
                  </div>
                </td>
                <td className="p-5 font-mono text-stone-600 flex items-center gap-2">
                  <Globe size={14} className="text-stone-400" />
                  {log.ipAddress}
                </td>
                <td className="p-5 text-stone-500 flex items-center gap-2">
                  <Smartphone size={14} />
                  {log.device}
                </td>
                <td className="p-5">
                   {log.status === 'success' ? (
                     <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">成功</span>
                   ) : (
                     <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">失敗</span>
                   )}
                </td>
              </tr>
            ))}
            {data.loginLogs.length === 0 && (
               <tr><td colSpan={5} className="p-8 text-center text-stone-400">尚無登入紀錄</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-stone-700">人員設定</h3>
        <button className="text-sm bg-stone-800 text-white px-5 py-2.5 rounded-xl hover:bg-stone-700 font-bold shadow-lg shadow-stone-200">
          + 新增人員
        </button>
      </div>
      
      <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden p-2">
        <table className="w-full text-left border-collapse">
          <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="p-5 rounded-tl-2xl">狀態</th>
              <th className="p-5">姓名/頭像</th>
              <th className="p-5">角色權限</th>
              <th className="p-5">工作日設定 (起~迄)</th>
              <th className="p-5 rounded-tr-2xl text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {data.users.map(user => {
              const isEditing = editingUserId === user.id;
              
              return (
                <tr key={user.id} className={`transition-colors ${isEditing ? 'bg-orange-50/30' : 'hover:bg-stone-50'}`}>
                  <td className="p-5">
                    <div className={`flex items-center gap-2 text-xs font-bold px-2 py-1 rounded-full w-fit ${user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-500'}`}>
                      {user.active ? '啟用' : '停用'}
                    </div>
                  </td>
                  
                  <td className="p-5">
                    {isEditing ? (
                      <div className="flex items-center gap-3">
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 cursor-pointer hover:opacity-80 relative group overflow-hidden"
                        >
                          {editUserForm.avatar ? <img src={editUserForm.avatar} className="w-full h-full object-cover"/> : editUserForm.name?.charAt(0)}
                          <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center text-white">
                            <Camera size={14} />
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                        </div>
                        <input 
                          value={editUserForm.name} 
                          onChange={e => setEditUserForm({...editUserForm, name: e.target.value})}
                          className="p-2 rounded border border-orange-200 focus:ring-2 focus:ring-orange-500 flex-1"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold overflow-hidden border border-stone-200">
                          {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                        </div>
                        <span className="font-bold text-stone-800">{user.name}</span>
                      </div>
                    )}
                  </td>

                  <td className="p-5">
                     {isEditing ? (
                       <select 
                         value={editUserForm.role}
                         onChange={e => setEditUserForm({...editUserForm, role: e.target.value as any})}
                         className="p-2 rounded border border-orange-200 text-sm"
                       >
                         <option value="user">一般成員 (User)</option>
                         <option value="manager">管理人員 (Manager)</option>
                         <option value="admin">系統管理員 (Admin)</option>
                       </select>
                     ) : (
                       <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                         user.role === 'admin' ? 'bg-stone-800 text-white' : 
                         user.role === 'manager' ? 'bg-amber-100 text-amber-800' :
                         'bg-stone-100 text-stone-500'
                       }`}>
                         {user.role}
                       </span>
                     )}
                  </td>

                  <td className="p-5">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="time"
                          value={editUserForm.workdayStart} 
                          onChange={e => setEditUserForm({...editUserForm, workdayStart: e.target.value})}
                          className="p-1 rounded border border-stone-200 text-xs"
                        />
                        <span>~</span>
                        <input 
                          type="time"
                          value={editUserForm.workdayEnd} 
                          onChange={e => setEditUserForm({...editUserForm, workdayEnd: e.target.value})}
                          className="p-1 rounded border border-stone-200 text-xs"
                        />
                      </div>
                    ) : (
                      <span className="text-stone-600 font-mono text-sm">
                        {user.workdayStart} - {user.workdayEnd}
                      </span>
                    )}
                  </td>

                  <td className="p-5 text-right">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={saveUser} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"><Check size={16}/></button>
                        <button onClick={() => setEditingUserId(null)} className="p-2 bg-stone-200 text-stone-600 rounded-lg hover:bg-stone-300"><X size={16}/></button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2 opacity-60 hover:opacity-100">
                        <button onClick={() => startEditUser(user)} className="p-2 hover:bg-stone-200 rounded-lg text-stone-600" title="編輯">
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => onUpdateUser(user.id, { active: !user.active })} 
                          className={`p-2 rounded-lg ${user.active ? 'hover:bg-red-50 text-red-500' : 'hover:bg-emerald-50 text-emerald-500'}`}
                          title={user.active ? "停用" : "啟用"}
                        >
                          <Power size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6">
      <div className="flex gap-3 mb-6 bg-white p-2 rounded-2xl shadow-sm border border-stone-100">
        <input 
          type="text" 
          value={newGoal}
          onChange={(e) => setNewGoal(e.target.value)}
          placeholder="輸入新目標名稱..."
          className="flex-1 p-3 rounded-xl bg-stone-50 border-transparent focus:bg-white focus:ring-2 focus:ring-orange-100 outline-none transition-all"
        />
        <button 
          onClick={() => {
            if(newGoal) { onAddGoal(newGoal); setNewGoal(''); }
          }}
          className="bg-stone-800 text-white px-6 py-2 rounded-xl hover:bg-stone-700 font-bold flex items-center gap-2"
        >
          <Plus size={18} /> 新增
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden p-2">
        <table className="w-full text-left border-collapse">
          <thead className="bg-stone-50 text-stone-500 text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="p-5 rounded-tl-2xl w-20">狀態</th>
              <th className="p-5">目標名稱</th>
              <th className="p-5">關聯任務數</th>
              <th className="p-5 rounded-tr-2xl text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {data.goals.map((goal, idx) => (
              <tr key={goal} className="hover:bg-stone-50 transition-colors">
                <td className="p-5">
                   <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full w-fit">
                     <Check size={12} /> 啟用
                   </span>
                </td>
                <td className="p-5 font-bold text-stone-700">{goal}</td>
                <td className="p-5 text-stone-500">
                  {data.tasks.filter(t => t.goal === goal).length}
                </td>
                <td className="p-5 text-right">
                   <button className="p-2 text-stone-300 hover:bg-stone-100 hover:text-stone-600 rounded-lg">
                      <MoreHorizontal size={18} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTutorials = () => (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
          <h3 className="text-lg font-bold text-stone-800 mb-2 flex items-center gap-2">
             <BookOpen size={20} className="text-amber-500" /> 使用教學與錯誤提示管理
          </h3>
          <p className="text-sm text-stone-500 mb-6">設定系統在特定情境下顯示的引導文字，取代生硬的錯誤訊息。</p>
          
          <div className="space-y-4">
             {data.tutorials && data.tutorials.map(tut => {
               const isEditing = editingTutorialId === tut.id;
               return (
                 <div key={tut.id} className={`p-5 rounded-2xl border transition-all ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-100 hover:shadow-md'}`}>
                    {isEditing ? (
                       <div className="space-y-3">
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">{tut.triggerKey}</span>
                             <div className="flex gap-2">
                                <button onClick={saveTutorial} className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-600 flex items-center gap-1"><Check size={14}/> 儲存</button>
                                <button onClick={() => setEditingTutorialId(null)} className="bg-stone-200 text-stone-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-stone-300 flex items-center gap-1"><X size={14}/> 取消</button>
                             </div>
                          </div>
                          <div>
                             <label className="text-xs font-bold text-stone-500 mb-1 block">提示標題</label>
                             <input 
                               value={editTutorialForm.title} 
                               onChange={e => setEditTutorialForm({...editTutorialForm, title: e.target.value})}
                               className="w-full p-2 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-400 outline-none"
                             />
                          </div>
                          <div>
                             <label className="text-xs font-bold text-stone-500 mb-1 block">教學內容</label>
                             <textarea 
                               value={editTutorialForm.content} 
                               onChange={e => setEditTutorialForm({...editTutorialForm, content: e.target.value})}
                               className="w-full p-2 rounded-xl border border-amber-200 focus:ring-2 focus:ring-amber-400 outline-none h-24"
                             />
                          </div>
                       </div>
                    ) : (
                       <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-bold text-stone-800 text-lg">{tut.title}</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${tut.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-500'}`}>
                                   {tut.isActive ? '啟用中' : '已停用'}
                                </span>
                                <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded font-mono">{tut.triggerKey}</span>
                             </div>
                             <p className="text-stone-600 text-sm whitespace-pre-wrap leading-relaxed">{tut.content}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                             <button 
                               onClick={() => startEditTutorial(tut)}
                               className="p-2 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-700" title="編輯"
                             >
                                <Edit2 size={16} />
                             </button>
                             {onUpdateTutorial && (
                                <button 
                                  onClick={() => onUpdateTutorial(tut.id, { isActive: !tut.isActive })}
                                  className={`p-2 rounded-lg ${tut.isActive ? 'hover:bg-red-50 text-emerald-500 hover:text-red-500' : 'hover:bg-emerald-50 text-stone-300 hover:text-emerald-500'}`}
                                  title={tut.isActive ? '停用' : '啟用'}
                                >
                                   <Power size={16} />
                                </button>
                             )}
                          </div>
                       </div>
                    )}
                 </div>
               );
             })}
          </div>
       </div>
    </div>
  );

  const renderSystem = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
       {/* Left: General Settings */}
       <div className="space-y-8">
         <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
            <h3 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
              <Globe size={20} className="text-blue-500" /> 地區與時間
            </h3>
            <div className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-stone-500 mb-2">系統時區 (Timezone)</label>
                 <select 
                   value={timezone} 
                   onChange={(e) => setTimezone(e.target.value)}
                   className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 font-medium"
                 >
                   <option value="Asia/Taipei">Asia/Taipei (GMT+8)</option>
                   <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                   <option value="America/New_York">America/New_York (GMT-4)</option>
                   <option value="UTC">UTC</option>
                 </select>
               </div>
            </div>
         </div>

         {/* Create/Edit Announcement */}
         <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
            <h3 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
               <Bell size={20} className="text-amber-500" /> 
               {editingAnnouncementId ? '編輯公告' : '發布新公告'}
            </h3>
            <div className="space-y-4">
               <div>
                 <label className="block text-sm font-bold text-stone-500 mb-2">公告等級</label>
                 <div className="flex gap-2">
                    {[
                      { id: 'info', label: '一般通知', icon: Info, color: 'bg-blue-100 text-blue-700 border-blue-200' },
                      { id: 'warning', label: '重要提醒', icon: Megaphone, color: 'bg-amber-100 text-amber-700 border-amber-200' },
                      { id: 'urgent', label: '緊急通知', icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-200' },
                    ].map(lvl => (
                      <button
                        key={lvl.id}
                        onClick={() => setAnnouncementLevel(lvl.id as AnnouncementLevel)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border-2 transition-all ${
                          announcementLevel === lvl.id ? lvl.color : 'bg-white border-stone-200 text-stone-400 hover:bg-stone-50'
                        }`}
                      >
                        <lvl.icon size={16} />
                        <span className="text-xs font-bold">{lvl.label}</span>
                      </button>
                    ))}
                 </div>
               </div>

               <div>
                 <label className="block text-sm font-bold text-stone-500 mb-2">內容</label>
                 <textarea 
                   value={announcementInput} 
                   onChange={(e) => setAnnouncementInput(e.target.value)}
                   placeholder="輸入公告內容..."
                   className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 h-24 text-stone-700 focus:ring-2 focus:ring-amber-500 outline-none"
                 />
               </div>
               
               <div className="flex gap-2">
                 <button 
                   onClick={handleSaveAnnouncement}
                   className="flex-1 bg-stone-800 text-white py-3 rounded-xl font-bold hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
                 >
                   <Check size={18} /> {editingAnnouncementId ? '儲存更新' : '確認發布'}
                 </button>
                 {editingAnnouncementId && (
                   <button 
                     onClick={handleCancelAnnouncementEdit}
                     className="px-4 py-3 rounded-xl font-bold text-stone-500 bg-stone-200 hover:bg-stone-300"
                   >
                     取消
                   </button>
                 )}
               </div>
            </div>
         </div>
       </div>

       {/* Right: Announcement List */}
       <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm flex flex-col h-[600px]">
          <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
             <History size={20} className="text-stone-400" /> 公告列表
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
             {data.announcements && data.announcements.length > 0 ? (
               [...data.announcements].reverse().map(ann => (
                 <div key={ann.id} className={`p-4 rounded-xl border transition-all ${ann.isActive ? 'bg-white border-amber-200 shadow-sm' : 'bg-stone-50 border-stone-100 opacity-70 hover:opacity-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            ann.level === 'urgent' ? 'bg-red-100 text-red-600' : 
                            ann.level === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                          }`}>
                            {ann.level}
                          </span>
                          <span className="text-xs text-stone-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                       </div>
                       
                       <div className="flex gap-1">
                          <button 
                            onClick={() => onUpdateAnnouncement(ann.id, { isActive: !ann.isActive })}
                            title={ann.isActive ? "下架" : "上架"}
                            className={`p-1.5 rounded-lg ${ann.isActive ? 'text-emerald-500 hover:bg-emerald-50' : 'text-stone-300 hover:text-stone-500 hover:bg-stone-200'}`}
                          >
                            <Power size={14} />
                          </button>
                          <button 
                            onClick={() => handleEditAnnouncement(ann)}
                            title="編輯"
                            className="p-1.5 text-stone-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => { if(confirm("確定刪除此公告？")) onDeleteAnnouncement(ann.id); }}
                            title="刪除"
                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={14} />
                          </button>
                       </div>
                    </div>
                    <p className={`text-sm font-medium line-clamp-2 ${ann.isActive ? 'text-stone-800' : 'text-stone-500'}`}>
                      {ann.content}
                    </p>
                    {ann.isActive && <div className="mt-2 text-[10px] font-bold text-emerald-500 flex items-center gap-1"><Check size={10} /> 目前顯示中</div>}
                 </div>
               ))
             ) : (
               <div className="text-center py-10 text-stone-400 text-sm">尚無公告紀錄</div>
             )}
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-stone-800 mb-2">管理中心</h1>
        <p className="text-stone-500 font-medium">系統配置與稽核</p>
      </header>

      <div className="flex gap-2 border-b border-stone-200/60 pb-1 overflow-x-auto">
        {[
          { id: 'logs', label: '操作日誌', icon: History },
          { id: 'login_logs', label: '登入日誌', icon: Shield },
          { id: 'users', label: '人員權限', icon: Users },
          { id: 'goals', label: '目標項目', icon: Target },
          { id: 'system', label: '系統設定', icon: Settings },
          { id: 'tutorials', label: '使用教學', icon: BookOpen }, // New Tab
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-t-2xl flex items-center gap-2 transition-all font-bold whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-stone-800 border-b-2 border-orange-500' 
                : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50/50'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in duration-300">
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'login_logs' && renderLoginLogs()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'goals' && renderGoals()}
        {activeTab === 'system' && renderSystem()}
        {activeTab === 'tutorials' && renderTutorials()}
      </div>
    </div>
  );
};

export default AdminCenter;
