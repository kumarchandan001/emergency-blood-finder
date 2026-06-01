import { Router } from 'express';
import {
  getDashboardStats,
  updateDonorVerification,
  manageUsers,
  deleteUser,
  manageRequestStatus,
  getInventory,
  updateInventory,
  getAuditLogs,
  getDonations,
  createDonation,
  broadcastNotification,
} from '../controllers/adminController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Protect all routes under /api/admin to only admins
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.patch('/verify/:donorId', updateDonorVerification);
router.get('/users', manageUsers);
router.delete('/users/:id', deleteUser);
router.patch('/requests/:requestId', manageRequestStatus);
router.get('/inventory', getInventory);
router.post('/inventory', updateInventory);
router.get('/audit-logs', getAuditLogs);
router.get('/donations', getDonations);
router.post('/donations', createDonation);
router.post('/broadcast', broadcastNotification);

export default router;
