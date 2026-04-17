import { Router } from 'express';
import { homeController } from '../controllers/homeController';
import { ingestionController } from '../controllers/ingestionController';
import { requireIngestionAuth } from '../middlewares/requireIngestionAuth';

const router = Router();

router.get('/', homeController.index);
router.use('/ingestion', requireIngestionAuth);
router.get('/ingestion/health', ingestionController.health);
router.post('/ingestion/run-due', ingestionController.runDue);
router.post('/ingestion/run/:sourceKey', ingestionController.runBySource);

export { router };
