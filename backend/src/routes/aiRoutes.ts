import { Router } from 'express';
import { checkEligibility, chatAssistant } from '../controllers/aiController';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/eligibility', protect, checkEligibility);
router.post('/chat', protect, chatAssistant);

export default router;
