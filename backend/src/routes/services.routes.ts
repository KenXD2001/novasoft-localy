import { Router } from 'express';
import { addService, clearServiceLogs, deleteService, getProjectServices, getServiceLogs, restartService, startService, stopService, updateService } from '../controllers/services.controller.js';

const router = Router();

router.post('/add-service', addService);
router.get('/get-project-services', getProjectServices);
router.delete('/delete-service', deleteService);
router.put('/update-service', updateService);
router.post('/start-service', startService);
router.post('/stop-service', stopService);
router.post('/restart-service', restartService);
router.get('/get-service-logs', getServiceLogs);
router.delete('/clear-service-logs', clearServiceLogs);

export default router;
