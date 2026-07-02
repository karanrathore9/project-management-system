import express from 'express';
import http from 'http';
import cors from 'cors';


import env from './config/env';
import connectDB from './config/db';
import { initSocket } from './sockets';
import routes from './routes';
import notFound from './middleware/notFound.middleware';
import errorHandler from './middleware/error.middleware';

const app = express();

// Needed so req.ip / secure headers behave correctly behind the Nginx reverse proxy
app.set('trust proxy', 1);

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

async function start(): Promise<void> {
  await connectDB();

  const server = http.createServer(app);
  await initSocket(server);

  server.listen(env.port, () => {
    console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
}

start();

export default app;
