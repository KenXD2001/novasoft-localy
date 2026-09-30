import { Router } from 'express';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import projectsRoutes from './projects.routes.js';
import servicesRoutes from './services.routes.js';

const router = Router();

// Mount domain routers here as the API grows:
// router.use('/projects', projectRoutes);

router.use('/', healthRoutes);
router.use('/', authRoutes);
router.use('/', projectsRoutes);
router.use('/', servicesRoutes);

export default router;
