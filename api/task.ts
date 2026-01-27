// api/task.ts
import { Router } from 'express';
import { prisma } from '../services/db.js';

const router = Router();

// 獲取所有任務
router.get('/', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        project: true,
        assignedTo: true,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log(`[GET /api/tasks] Fetched ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('[GET /api/tasks] Error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// 獲取單一任務
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
        assignedTo: true,
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    if (!task) {
      console.log(`[GET /api/tasks/:id] Task not found: ${id}`);
      return res.status(404).json({ error: 'Task not found' });
    }
    console.log(`[GET /api/tasks/:id] Fetched task: ${id}`);
    res.json(task);
  } catch (error) {
    console.error(`[GET /api/tasks/:id] Error:`, error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// 創建新任務
router.post('/', async (req, res) => {
  try {
    console.log('[POST /api/tasks] Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      title, 
      description, 
      projectId, 
      categoryId, 
      assignedToId,
      suggestedType, 
      suggestedValue,
      status 
    } = req.body;

    // 驗證必填欄位
    if (!title || title.trim() === '') {
      console.error('[POST /api/tasks] Validation error: title is required');
      return res.status(400).json({ error: 'Title is required' });
    }

    // 如果有 projectId，驗證專案是否存在
    if (projectId) {
      const projectExists = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!projectExists) {
        console.error(`[POST /api/tasks] Validation error: project not found: ${projectId}`);
        return res.status(400).json({ error: 'Project not found' });
      }
    }

    // 如果有 categoryId，驗證分類是否存在
    if (categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!categoryExists) {
        console.error(`[POST /api/tasks] Validation error: category not found: ${categoryId}`);
        return res.status(400).json({ error: 'Category not found' });
      }
    }

    // 如果有 assignedToId，驗證使用者是否存在
    if (assignedToId) {
      const userExists = await prisma.user.findUnique({
        where: { id: assignedToId },
      });
      if (!userExists) {
        console.error(`[POST /api/tasks] Validation error: user not found: ${assignedToId}`);
        return res.status(400).json({ error: 'User not found' });
      }
    }

    const newTask = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        projectId: projectId || null,
        categoryId: categoryId || null,
        assignedToId: assignedToId || null,
        suggestedType: suggestedType || 'MISC',
        suggestedValue: suggestedValue || 0,
        status: status || 'PENDING',
      },
      include: {
        project: true,
        assignedTo: true,
        category: true,
      },
    });
    
    console.log('[POST /api/tasks] Task created successfully:', {
      id: newTask.id,
      title: newTask.title,
      projectId: newTask.projectId,
      categoryId: newTask.categoryId,
      createdAt: newTask.createdAt,
    });
    
    res.status(201).json(newTask);
  } catch (error) {
    console.error('[POST /api/tasks] Error:', error);
    
    // 處理 Prisma 特定錯誤
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return res.status(400).json({ error: 'Invalid reference to project, category, or user' });
      }
    }
    
    res.status(500).json({ error: 'Failed to create task', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// 更新任務
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[PUT /api/tasks/:id] Request body for ${id}:`, JSON.stringify(req.body, null, 2));
    
    const { title, description, status, assignedToId, suggestedType, suggestedValue, projectId, categoryId } = req.body;

    // 驗證任務是否存在
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });
    
    if (!existingTask) {
      console.log(`[PUT /api/tasks/:id] Task not found: ${id}`);
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(status !== undefined && { status }),
        ...(assignedToId !== undefined && { assignedToId }),
        ...(suggestedType !== undefined && { suggestedType }),
        ...(suggestedValue !== undefined && { suggestedValue }),
        ...(projectId !== undefined && { projectId }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: {
        project: true,
        assignedTo: true,
        category: true,
      },
    });
    
    console.log(`[PUT /api/tasks/:id] Task updated successfully: ${id}`);
    res.json(updatedTask);
  } catch (error) {
    console.error(`[PUT /api/tasks/:id] Error:`, error);
    res.status(500).json({ error: 'Failed to update task', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// 刪除任務
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE /api/tasks/:id] Deleting task: ${id}`);
    
    // 先刪除關聯的 tags
    await prisma.tagOnTask.deleteMany({
      where: { taskId: id },
    });
    
    await prisma.task.delete({
      where: { id },
    });
    
    console.log(`[DELETE /api/tasks/:id] Task deleted successfully: ${id}`);
    res.status(204).send();
  } catch (error) {
    console.error(`[DELETE /api/tasks/:id] Error:`, error);
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete task', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
