import { Router } from 'express';
import {
  createRequest,
  getMyRequests,
  getAllRequests,
  getRequestDetails,
  getDonorAlerts,
  respondToAlert,
} from '../controllers/requestController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/', protect, createRequest);
router.get('/my', protect, getMyRequests);
router.get('/all', protect, getAllRequests);
router.get('/alerts', protect, getDonorAlerts);
router.get('/:id', protect, getRequestDetails);
router.patch('/alerts/:alertId', protect, respondToAlert);

export default router;
