import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  goalCategory?: string | null;
  timeType?: string | null;
  projectId?: string | null;
  dueAt?: Date | null;
  status?: string;
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskId: string, data: any) => void;
  task: Task | null;
  projects: Array<{ id: string; name: string }>;
}

export default function EditTaskModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  projects,
}: EditTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalCategory: 'BUSINESS',
    timeType: 'LONG_TERM',
    projectId: '',
    dueAt: '',
    status: 'PENDING',
  });

  // 當 task 改變時，更新表單資料
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        goalCategory: task.goalCategory || 'BUSINESS',
        timeType: task.timeType || 'LONG_TERM',
        projectId: task.projectId || '',
        dueAt: task.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : '',
        status: task.status || 'PENDING',
      });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) {
      onSubmit(task.id, formData);
      onClose();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">編輯任務</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 任務標題 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任務標題 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="輸入任務標題..."
            />
          </div>

          {/* 任務描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任務描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="輸入任務描述..."
            />
          </div>

          {/* 目標分類 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目標分類
            </label>
            <select
              name="goalCategory"
              value={formData.goalCategory}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="BUSINESS">業務</option>
              <option value="HR">人資</option>
              <option value="MANAGEMENT">管理</option>
              <option value="WAREHOUSE">倉儲</option>
              <option value="ADMIN">行政</option>
            </select>
          </div>

          {/* 時間類型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              時間類型
            </label>
            <select
              name="timeType"
              value={formData.timeType}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="TRIVIAL">零碎</option>
              <option value="TODAY">當日</option>
              <option value="LONG_TERM">長期</option>
            </select>
          </div>

          {/* 專案 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              所屬專案
            </label>
            <select
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">無專案</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* 到期日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              到期日
            </label>
            <input
              type="date"
              name="dueAt"
              value={formData.dueAt}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 狀態 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              狀態
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="PENDING">待辦</option>
              <option value="IN_PROGRESS">進行中</option>
              <option value="DONE">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              儲存變更
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
