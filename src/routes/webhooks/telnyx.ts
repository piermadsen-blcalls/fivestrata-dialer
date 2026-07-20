import type { FastifyInstance } from 'fastify';
import { verifyTelnyxWebhook } from '../../clients/telnyx.js';
import { recordCallEvent } from '../../services/callLog.js';

/**
 * Telnyx Call Control webhooks — every telephony event (initiated, answered,
 * bridged, hangup, recording saved, machine detection...) lands here and is
 * persisted to call_events. This is the source of the granular per-dial data
 * the platform is built around.
 */
export async function telnyxWebhookRoutes(server: FastifyInstance) {
  // Signature verification needs the raw body, not the parsed JSON.
  server.addContentTypeParser(
    'application/json',
    { parseAs: 'string', bodyLimit: 1048576 },
    (_req, body, done) => done(null, body),
  );

  server.post('/telnyx', async (request, reply) => {
    const rawBody = request.body as string;
    const signature = request.headers['telnyx-signature-ed25519'];
    const timestamp = request.headers['telnyx-timestamp'];

    if (typeof signature !== 'string' || typeof timestamp !== 'string') {
      return reply.code(400).send({ error: 'missing signature headers' });
    }

    try {
      verifyTelnyxWebhook(rawBody, signature, timestamp);
    } catch (err) {
      request.log.warn({ err }, 'telnyx webhook signature verification failed');
      return reply.code(400).send({ error: 'invalid signature' });
    }

    const event = JSON.parse(rawBody);
    await recordCallEvent(event);

    // Always 200 quickly — Telnyx retries on non-2xx and events must not back up.
    return reply.code(200).send();
  });
}
