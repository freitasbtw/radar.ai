import { Router } from 'express';
import { homeController } from '../controllers/homeController';
import { ingestionController } from '../controllers/ingestionController';

const router = Router();

router.get('/', homeController.index);
router.get('/ingestion/health', ingestionController.health);
router.post('/ingestion/run-due', ingestionController.runDue);
router.post('/ingestion/run/:sourceKey', ingestionController.runBySource);

export { router };
