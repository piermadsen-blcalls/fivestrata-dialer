import Fastify from 'fastify';
import { healthRoutes } from './routes/health.js';
import { leadRoutes } from './routes/leads.js';
import { telnyxWebhookRoutes } from './routes/webhooks/telnyx.js';

export async function buildServer() {
  const server = Fastify({
    logger: true,
  });

  await server.register(healthRoutes);
  await server.register(leadRoutes);
  await server.register(telnyxWebhookRoutes, { prefix: '/webhooks' });

  return server;
}
