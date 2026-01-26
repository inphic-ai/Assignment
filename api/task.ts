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
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
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
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// 創建新任務
router.post('/', async (req, res) => {
  try {
    const { title, description, projectId, categoryId, suggestedType, suggestedValue } = req.body;

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        categoryId,
        suggestedType: suggestedType || 'MISC',
        suggestedValue: suggestedValue || 0,
        status: 'PENDING',
      },
    });
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// 更新任務
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, assignedToId, suggestedType, suggestedValue } = req.body;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        assignedToId,
        suggestedType,
        suggestedValue,
      },
    });
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// 刪除任務
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
