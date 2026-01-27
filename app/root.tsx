import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigate,
  useLocation,
} from "@remix-run/react";
import { useState, useRef, useEffect, createContext, useContext } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  BookOpen,
  Settings,
  Plus,
  CalendarClock,
  Megaphone,
  AlertTriangle,
  Info,
  Repeat,
  UserCircle,
  ListTodo,
  ChevronDown,
  HelpCircle,
  Target,
  Moon,
  Check,
  Users,
  Building,
  ShieldCheck,
} from "lucide-react";
import globalStyles from "~/styles/globals.css?url";
import CreateTaskModal from "~/components/CreateTaskModal";
import { useSubmit } from "@remix-run/react";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: globalStyles },
];

// 定義 NavTab 類型
export type NavTab =
  | "dashboard"
  | "personal_dashboard"
  | "daily"
  | "task_list"
  | "timeline"
  | "projects"
  | "routines"
  | "knowledge"
  | "announcement"
  | "feature_request"
  | "admin";

interface User {
  id: string;
  name: string;
  role: "admin" | "manager" | "user";
  department?: string;
  active: boolean;
  workdayStart: string;
  workdayEnd: string;
  dailyHours: number;
  defaultLongTaskConversion: number;
}

interface RootLoaderData {
  users: User[];
  currentUser: User;
  projects: Array<{ id: string; name: string; goal: string }>;
}

// 建立 User Context
const UserContext = createContext<{
  currentUser: User;
  users: User[];
  onSwitchUser: (userId: string) => void;
} | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};

// Loader：從資料庫載入使用者資訊
export async function loader({ request }: LoaderFunctionArgs) {
  const users: User[] = [
    {
      id: "u1",
      name: "Alex Chen",
      role: "admin",
      department: "研發部",
      active: true,
      workdayStart: "09:00",
      workdayEnd: "18:00",
      dailyHours: 9,
      defaultLongTaskConversion: 8,
    },
    {
      id: "u2",
      name: "林書豪",
      role: "manager",
      department: "設計部",
      active: true,
      workdayStart: "08:30",
      workdayEnd: "17:30",
      dailyHours: 9,
      defaultLongTaskConversion: 8,
    },
    {
      id: "u3",
      name: "王大明",
      role: "user",
      department: "業務部",
      active: true,
      workdayStart: "09:00",
      workdayEnd: "18:00",
      dailyHours: 9,
      defaultLongTaskConversion: 8,
    },
    {
      id: "u4",
      name: "張小美",
      role: "user",
      department: "設計部",
      active: true,
      workdayStart: "09:00",
      workdayEnd: "18:00",
      dailyHours: 9,
      defaultLongTaskConversion: 8,
    },
    {
      id: "u5",
      name: "李阿龍",
      role: "manager",
      department: "業務部",
      active: true,
      workdayStart: "09:00",
      workdayEnd: "18:00",
      dailyHours: 9,
      defaultLongTaskConversion: 8,
    },
  ];

  // 載入專案資料
  const projects = [
    { id: "p1", name: "客戶管理系統", goal: "業務" as const },
    { id: "p2", name: "內部流程優化", goal: "管理" as const },
  ];

  return json<RootLoaderData>({
    users,
    currentUser: users[0],
    projects,
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  const { users, currentUser: initialUser, projects } = useLoaderData<RootLoaderData>();
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const submit = useSubmit();

  // 根據路徑判斷當前選中的導航項目
  const getCurrentTab = (): NavTab => {
    const path = location.pathname;
    if (path.includes("dashboard")) return "dashboard";
    if (path.includes("personal")) return "personal_dashboard";
    if (path.includes("daily")) return "daily";
    if (path.includes("tasks")) return "task_list";
    if (path.includes("timeline")) return "timeline";
    if (path.includes("projects")) return "projects";
    if (path.includes("routines")) return "routines";
    if (path.includes("knowledge")) return "knowledge";
    if (path.includes("announcement")) return "announcement";
    if (path.includes("feature")) return "feature_request";
    if (path.includes("admin")) return "admin";
    return "dashboard";
  };

  const currentTab = getCurrentTab();

  const navItems = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "戰情室",
      category: "資源導覽",
      path: "/dashboard",
    },
    {
      id: "personal_dashboard",
      icon: UserCircle,
      label: "個人儀表板",
      category: "資源導覽",
      path: "/personal",
    },
    {
      id: "daily",
      icon: CheckSquare,
      label: "日常任務",
      category: "資源導覽",
      path: "/daily",
    },
    {
      id: "task_list",
      icon: ListTodo,
      label: "任務清單",
      category: "資源導覽",
      path: "/tasks",
    },
    {
      id: "timeline",
      icon: CalendarClock,
      label: "時間分配",
      category: "資源導覽",
      path: "/timeline",
    },
    {
      id: "projects",
      icon: FolderKanban,
      label: "專案任務",
      category: "資源導覽",
      path: "/projects",
    },
    {
      id: "routines",
      icon: Repeat,
      label: "例行工作",
      category: "資源導覽",
      path: "/routines",
    },
    {
      id: "knowledge",
      icon: BookOpen,
      label: "知識庫",
      category: "管理中心",
      path: "/knowledge",
    },
    {
      id: "announcement",
      icon: Megaphone,
      label: "系統公告",
      category: "管理中心",
      path: "/announcement",
    },
    {
      id: "feature_request",
      icon: HelpCircle,
      label: "功能建議",
      category: "管理中心",
      path: "/feature",
    },
    {
      id: "admin",
      icon: Settings,
      label: "系統管理",
      category: "管理中心",
      path: "/admin",
      requiredRole: "admin" as const,
    },
  ];

  // 取得當前使用者可見的導覽項目
  const visibleItems = navItems.filter((item) => {
    if (item.requiredRole === "admin" && currentUser.role !== "admin")
      return false;
    return true;
  });

  // 按部門分組使用者
  const groupedUsers = users.reduce(
    (acc, user) => {
      const dept = user.department || "核心部隊";
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(user);
      return acc;
    },
    {} as Record<string, User[]>
  );

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleSwitchUser = (userId: string) => {
    const newUser = users.find((u) => u.id === userId);
    if (newUser) {
      setCurrentUser(newUser);
      setShowUserMenu(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        onSwitchUser: handleSwitchUser,
      }}
    >
      <div className="flex h-screen bg-white overflow-hidden font-sans text-stone-900">
      {/* 側邊導覽欄 */}
      <aside className="w-[280px] bg-white border-r border-stone-100 flex flex-col z-20">
        <div className="p-8 pb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Moon size={20} fill="currentColor" />
            </div>
            <h1 className="text-xl font-black text-stone-900 tracking-tight">
              精英團隊
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar">
          {["資源導覽", "管理中心"].map((cat) => {
            const categoryItems = visibleItems.filter(
              (item) => item.category === cat
            );
            if (categoryItems.length === 0) return null;

            return (
              <div key={cat} className="space-y-2">
                <h3 className="px-4 text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] mb-4">
                  {cat}
                </h3>
                <div className="space-y-1">
                  {categoryItems.map((item) => {
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.path)}
                        className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                          isActive
                            ? "bg-[#44403c] text-white shadow-xl"
                            : "text-stone-400 hover:bg-stone-50 hover:text-stone-900"
                        }`}
                      >
                        <item.icon
                          size={20}
                          className={
                            isActive
                              ? "text-white"
                              : "text-stone-300 group-hover:text-stone-500"
                          }
                        />
                        <span className="text-[14px] font-bold">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* 使用者切換器 */}
        <div className="p-6 border-t border-stone-50 relative" ref={menuRef}>
          {showUserMenu && (
            <div className="absolute bottom-full left-6 right-6 mb-4 bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-stone-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-300 z-50">
              <div className="p-5 border-b border-stone-50 bg-stone-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-400">
                  <Users size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    切換角色視角
                  </span>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto p-2 space-y-4 custom-scrollbar">
                {Object.entries(groupedUsers).map(([dept, deptUsers]) => (
                  <div key={dept} className="space-y-1">
                    <div className="px-3 py-2 flex items-center gap-2">
                      <div className="w-1 h-3 bg-stone-200 rounded-full"></div>
                      <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                        {dept}
                      </span>
                    </div>
                    {deptUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleSwitchUser(u.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          currentUser.id === u.id
                            ? "bg-amber-50 shadow-sm"
                            : "hover:bg-stone-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] uppercase shadow-sm ${
                              currentUser.id === u.id
                                ? "bg-amber-500 text-white"
                                : "bg-stone-100 text-stone-400"
                            }`}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div className="text-left">
                            <p
                              className={`text-[12px] font-black ${
                                currentUser.id === u.id
                                  ? "text-amber-900"
                                  : "text-stone-700"
                              }`}
                            >
                              {u.name}
                            </p>
                            <p className="text-[9px] font-bold text-stone-300 uppercase tracking-tighter">
                              {u.role}
                            </p>
                          </div>
                        </div>
                        {currentUser.id === u.id && (
                          <Check size={14} className="text-amber-500" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer group ${
              showUserMenu
                ? "bg-stone-100 shadow-inner"
                : "hover:bg-stone-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-stone-100 p-0.5 overflow-hidden shadow-sm">
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xs uppercase transition-colors ${
                    showUserMenu
                      ? "bg-amber-500 text-white"
                      : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {currentUser.name.charAt(0)}
                </div>
              </div>
              <div className="flex flex-col">
                <p className="text-[13px] font-black text-stone-900 leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[11px] font-medium text-stone-300 uppercase tracking-widest">
                  {currentUser.role}
                </p>
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`text-stone-300 transition-transform duration-300 ${
                showUserMenu ? "rotate-180 text-amber-500" : ""
              }`}
            />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-stone-50/30 relative">
        <div className="p-12 max-w-7xl mx-auto">
          <Outlet context={{ currentUser, users }} />
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-stone-800 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-[90] cursor-pointer"
        >
          <Plus size={32} strokeWidth={3} />
        </button>

        {showCreateModal && (
          <CreateTaskModal
            users={users}
            currentUser={currentUser}
            projects={projects}
            onClose={() => setShowCreateModal(false)}
            onCreate={(tasks) => {
              tasks.forEach(task => {
                const formData = new FormData();
                formData.append("intent", "create");
                formData.append("title", task.title || "");
                formData.append("description", task.description || "");
                formData.append("projectId", task.projectId || "");
                formData.append("goal", task.goal || "");
                formData.append("timeType", task.timeType || "misc");
                formData.append("timeValue", String(task.timeValue || 0));
                formData.append("assignedToId", task.assigneeId || "");
                
                submit(formData, { method: "post", action: "/tasks" });
              });
              setShowCreateModal(false);
            }}
          />
        )}
      </main>
    </div>
    </UserContext.Provider>
  );
}
