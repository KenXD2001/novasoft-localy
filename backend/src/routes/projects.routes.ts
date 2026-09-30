import { Router } from 'express';
import { createProject, getProject, getProjects } from '../controllers/projects.controller.js';

const router = Router();

router.post('/create-project', createProject);
router.get('/get-projects', getProjects);
router.get('/get-project', getProject);

export default router;
