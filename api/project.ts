// api/project.ts
import { Router } from 'express';
import { prisma } from '../services/db';

const router = Router();

// 獲取所有專案
router.get('/', async (req, res) => {
  try {
    // 這裡應該加入使用者身份驗證，但目前先跳過
    const projects = await prisma.project.findMany({
      include: {
        tasks: true,
        owner: true,
      },
    });
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// 創建新專案
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    // 這裡應該從 session 或 token 獲取真實的 ownerId
    const ownerId = 'clx1234567890abcdefghijk'; // 暫時使用一個固定的 ID

    const newProject = await prisma.project.create({
      data: {
        title,
        description,
        ownerId,
        status: 'PENDING',
      },
    });
    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// 獲取單一專案
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        tasks: true,
        owner: true,
      },
    });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// 更新專案
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        title,
        description,
        status,
      },
    });
    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// 刪除專案
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
