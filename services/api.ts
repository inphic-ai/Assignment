// services/api.ts
import { AppState, Task, TaskAllocation } from '../types';

/**
 * 前端 API 客戶端
 * 所有請求都會發送到後端伺服器 (Express)
 */

const API_BASE = process.env.VITE_API_BASE || 'http://localhost:3000/api';

export const api = {
  // 獲取全域狀態 (從後端 Postgres 讀取)
  async loadAppState(): Promise<Partial<AppState>> {
    try {
      const response = await fetch(`${API_BASE}/app-state`, {
        method: 'GET',
        credentials: 'include', // 包含 Cookie 以支援 Session
      });
      if (!response.ok) {
        throw new Error(`Failed to load app state: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading app state:', error);
      // 降級：返回空狀態，讓前端使用預設值
      return {};
    }
  },

  // 獲取所有任務
  async getTasks(): Promise<Task[]> {
    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  // 創建新任務
  async createTask(taskData: Partial<Task>): Promise<Task> {
    try {
      console.log('[api.createTask] Sending request:', taskData);
      
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(taskData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error('[api.createTask] Error response:', errorData);
        throw new Error(errorData.error || `Failed to create task: ${response.statusText}`);
      }
      
      const createdTask = await response.json();
      console.log('[api.createTask] Task created successfully:', createdTask);
      return createdTask;
    } catch (error) {
      console.error('[api.createTask] Error:', error);
      throw error;
    }
  },

  // 更新任務狀態
  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error updating task ${id}:`, error);
      throw error;
    }
  },

  // 刪除任務
  async deleteTask(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deleting task ${id}:`, error);
      throw error;
    }
  },

  // 獲取附件簽名 URL (用於 R2 存儲)
  async getAttachmentUrl(fileKey: string): Promise<string> {
    try {
      const response = await fetch(`${API_BASE}/storage/sign?key=${encodeURIComponent(fileKey)}`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Failed to get attachment URL: ${response.statusText}`);
      }
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error getting attachment URL:', error);
      throw error;
    }
  },

  // 獲取所有專案
  async getProjects(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },

  // 創建新專案
  async createProject(data: { title: string; description: string }): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // 使用 Gemini AI 自動拆解任務
  async breakdownProjectTask(projectDescription: string): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/ai/breakdown`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ description: projectDescription }),
      });
      if (!response.ok) {
        throw new Error(`Failed to breakdown task: ${response.statusText}`);
      }
      const data = await response.json();
      return data.tasks || [];
    } catch (error) {
      console.error('Error breaking down task:', error);
      // 降級：返回空陣列，讓用戶手動輸入任務
      return [];
    }
  },
};
