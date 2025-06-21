// src/health.ts
import { Client } from 'discord.js';
import express from 'express';

export function setupHealthCheck(client: Client) {
  const app = express();
  const port = process.env.HEALTH_PORT || 3000;

  app.get('/health', (req, res) => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      bot: {
        ready: client.isReady(),
        guilds: client.guilds.cache.size,
        users: client.users.cache.size,
        ping: client.ws.ping
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    if (!client.isReady()) {
      res.status(503).json({ ...health, status: 'error' });
    } else {
      res.json(health);
    }
  });

  app.get('/ready', (req, res) => {
    if (client.isReady()) {
      res.json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready' });
    }
  });

  app.listen(port, () => {
    console.log(`Health check server running on port ${port}`);
  });
}