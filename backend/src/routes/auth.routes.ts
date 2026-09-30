import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';

const router = Router();

router.post('/user-login', login);

export default router;
