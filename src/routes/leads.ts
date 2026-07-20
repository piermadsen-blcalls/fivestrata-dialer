import type { FastifyInstance } from 'fastify';
import { routeLead, type InboundLead } from '../services/leadRouter.js';

/**
 * Lead intake — the endpoint LeadConduit (and revive batch uploads) post to.
 * Per Joseph: LeadConduit can deliver anywhere we expose an endpoint, set up
 * the same way as BareTel/TopDial delivery.
 *
 * TODO: confirm LeadConduit's actual payload shape and auth scheme against an
 * existing delivery config before go-live; this mirrors the common fields.
 */
export async function leadRoutes(server: FastifyInstance) {
  server.post<{ Body: InboundLead }>('/leads', async (request, reply) => {
    const lead = request.body;

    if (!lead?.phone_number) {
      return reply.code(400).send({ accepted: false, reason: 'phone_number is required' });
    }

    const result = await routeLead(lead);
    return reply.code(result.accepted ? 200 : 422).send(result);
  });
}
