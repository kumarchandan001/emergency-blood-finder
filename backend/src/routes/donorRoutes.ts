import { Router } from 'express';
import { searchDonors, updateProfile, toggleAvailability } from '../controllers/donorController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/search', protect, searchDonors);
router.put('/profile', protect, updateProfile);
router.patch('/availability', protect, toggleAvailability);

export default router;
