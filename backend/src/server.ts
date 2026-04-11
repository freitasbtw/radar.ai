import dotenv from 'dotenv';
import { app } from './app';
import { startIngestionScheduler } from './workers/ingestionWorker';

dotenv.config();

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Backend is running on http://localhost:${PORT}`);
  startIngestionScheduler();
});
