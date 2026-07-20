import Telnyx from 'telnyx';
import { config } from '../config.js';

export const telnyx = new Telnyx(config.telnyx.apiKey);

/**
 * Verify a Telnyx webhook signature (ED25519). Throws if invalid.
 * Telnyx sends `telnyx-signature-ed25519` and `telnyx-timestamp` headers;
 * both the signature header and the account public key are base64 and must be
 * decoded to raw bytes for the SDK's tweetnacl verification.
 */
export function verifyTelnyxWebhook(
  rawBody: string,
  signature: string,
  timestamp: string,
): void {
  telnyx.webhooks.constructEvent(
    rawBody,
    Buffer.from(signature, 'base64'),
    timestamp,
    Buffer.from(config.telnyx.publicKey, 'base64'),
  );
}
