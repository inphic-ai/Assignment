import React, { useState, useRef } from 'react';
import { AppState, LogEntry, User, GoalCategory } from '../types';
import { Users, History, Target, ShieldAlert, Plus, Ban, MoreHorizontal, Check, X, Edit2, Power, Shield, Smartphone, Globe, Settings, Bell, Camera } from 'lucide-react';

interface AdminCenterProps {
  data: AppState;
  onAddGoal: (goal: string) => void;
  onUpdateUser: (id: string, updates: Partial<User>) => void;
  onToggleGoal: (goal: GoalCategory, active: boolean) => void; 
}

const AdminCenter: React.FC<AdminCenterProps> = ({ data, onAddGoal, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'users' | 'goals' | 'login_logs' | 'system'>('logs');
  
  // User Editing State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<User>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Goal State
  const [newGoal, setNewGoal] = useState('');

  // System Settings State (Mocked)
  const [timezone, setTimezone] = useState('Asia/Taipei');
  const [systemAnnouncement, setSystemAnnouncement] = useState('');

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

  const renderSystem = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
               <p className="text-xs text-stone-400 mt-2">此設定將影響系統日誌的時間戳記與排程基準。</p>
             </div>
          </div>
       </div>

       <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm">
          <h3 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
             <Bell size={20} className="text-amber-500" /> 系統公告
          </h3>
          <div className="space-y-4">
             <div>
               <label className="block text-sm font-bold text-stone-500 mb-2">全域公告內容</label>
               <textarea 
                 value={systemAnnouncement} 
                 onChange={(e) => setSystemAnnouncement(e.target.value)}
                 placeholder="輸入顯示在 Dashboard 的公告..."
                 className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 h-24 text-stone-700"
               />
             </div>
             <button className="w-full bg-stone-800 text-white py-3 rounded-xl font-bold hover:bg-stone-700 transition-colors">
               發布公告
             </button>
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
      </div>
    </div>
  );
};

export default AdminCenter;
