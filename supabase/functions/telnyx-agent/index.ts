// telnyx-agent — CO-LOCATED conversational loop (Phase A of the co-location
// plan, 8/7). The soundboard-operator state machine runs HERE, network-
// adjacent to Telnyx, instead of on a polling laptop: webhook in -> decide ->
// command out. Measured dev-loop seam was 465-790ms; this path targets
// ~150-300ms (webhook ~50-150ms + command ~50-150ms).
//
// Also replaces telnyx-webhook as the webhook target: it archives every event
// to call_events (async, out of the hot path) with the same field mapping.
//
// State: per-call state lives in warm-isolate memory (a Map — JS is single-
// threaded per isolate, so Deepgram partial/final pairs ~130-320ms apart
// can't double-fire transitions). Telnyx client_state (set on our commands,
// echoed on events) is the cold-start recovery copy. The production engine
// (Phase B, AWS) owns durable state; this is the demo-grade way station.
//
// Conversation (ported from scripts/convo-loop-test.ts v4, incl. all of
// Sean's 8/7 live-iteration rules):
//   answered -> transcription_start (Deepgram + interims, inbound) + greet
//   greet ended -> consent_listen (6s fallback)
//   any speech -> connector ack + question     [never pre-queue past a turn]
//   question ended -> rating_listen (20s fallback)
//   first speech -> instant ack (no immediate ack repeats)
//   final transcript -> LLM picks response (Telnyx-hosted Llama) -> goodbye
//   goodbye ended -> hangup
//
// Secrets: TELNYX_PUBLIC_KEY + TELNYX_API_KEY via env if set, else the
// dialer_config table (keys: telnyx_public_key, telnyx_api_key) — org role
// blocks Management-API secret-setting.
import { createClient } from 'npm:@supabase/supabase-js@2';

const TELNYX = 'https://api.telnyx.com/v2';
const REPLAY_TOLERANCE_SECONDS = 300;
const LLM_MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';
const ACKS = ['cv_ack_1', 'cv_ack_2', 'cv_ack_3', 'cv_ack_4', 'cv_ack_5'];
const RESPONSES = ['cv_resp_positive', 'cv_resp_negative', 'cv_resp_unclear'];
const CONSENT_FALLBACK_MS = 6_000;
const RATING_FALLBACK_MS = 20_000;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

interface CallState {
  phase: 'dialing' | 'greeting' | 'consent_listen' | 'question' | 'rating_listen' | 'confirm_listen' | 'wrapup' | 'lineup' | 'done';
  ackFired?: boolean;
  lastAck?: string;
  acksUsed?: string[]; // acks heard this call (corpus sweep 8/14: identical replay reads robotic)
  idAsks?: number; // identity asks answered — 2nd+ gets the variant render
  greet?: string; // greeting media_name — set via the dial command's client_state (demo uses demo_greet)
  question?: string; // question media_name — vertical slots q_windows/q_flooring/q_bathroom/q_solar; default cv_q1 (rating)
  goodbye?: string; // goodbye media_name — default cv_goodbye (meta); verticals use goodbye_biz
  playlist?: string[]; // lineup mode: play these in order, then hang up (voice auditions)
  pending?: string; // answer spoken WHILE a clip was playing — processed the moment the clip ends
  // Persona mode (synthetic customers, Sean 8/11): inbound legs to our own
  // DID are answered by a persona — Claire trains against fake callers.
  regreets?: number; // identity re-greets used this call (cap 2)
  inquiryAnswered?: boolean; // regreet_inquiry plays once per call (Butch r2: restatements re-matched and tripled the clip)
  confirmAsked?: boolean; // recovery confirm used (once per call)
  confirmAskLanded?: boolean; // the answer/confirm clip finished playing — only then may the binary read judge (8/15 Butch: mid-clip reactions were judged before the ask landed)
  mode?: 'persona';
  persona?: string;
  history?: Array<{ role: 'claire' | 'me'; text: string }>;
  heard?: number; // finals heard from Claire (debounce sequencing)
  replied?: number; // last `heard` value we replied to
  turns?: number;
}

// Synthetic customer personas. Cheap on purpose: basic TTS voice, small LLM.
const PERSONA_VOICE = 'female'; // Telnyx basic tier — cheapest intelligible
const PERSONA_MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';
const PERSONA_REPLY_DEBOUNCE_MS = 2000; // wait for Claire to finish talking
const PERSONA_MAX_TURNS = 9; // raised 8/14: repeat/confirm turns ate Doris's budget mid-flow (test-rig artifact, not agent)
const PERSONAS: Record<string, string> = {
  curmudgeon:
    "You are Frank, 61, answering a sales call. You are grumpy and suspicious: demand to know who's calling and how they got your number, complain about telemarketers, give short hostile answers. You do NOT want anything sold to you. After a few exchanges, demand to be removed from the list.",
  wishy_washy:
    "You are Dana, 45, answering a sales call. You cannot commit to anything: hedge every answer ('maybe... I mean... I'd have to ask my husband... what do you think?'), change your mind mid-sentence, ask the caller to decide for you. Never give a clear yes or no.",
  talker:
    'You are Bill, 58, answering a sales call. You are extremely chatty: answer every question with a long rambling story involving your nephew, your knee surgery, or the weather in Tucson. Eventually circle back to a vague answer. You are friendly but exhausting.',
  confused_elder:
    "You are Doris, 84, answering the phone. You are sweet but confused: mishear things, ask 'who is this again?' repeatedly, answer questions that weren't asked, mention your late husband Harold. You don't understand what the caller wants.",
  normal:
    'You are Maria, 52, answering a sales call. You GENUINELY need a bathroom remodel (leaky shower, old tile) and are interested — but you are detail-oriented: ask about price ranges, timeline, licensing/insurance, and what happens next. Cooperative but thorough.',
  butch:
    "You are Butch, 56, answering a sales call about a bathroom remodel. Your WIFE submitted the inquiry — she's been raving about bathrooms she saw in a magazine; she always wants to upgrade something. YOU hold the household purse strings, and you are sharp-eyed and no-BS: start guarded ('this about that thing my wife filled out?'), ask pointed questions (what is this exactly, what does a remodel roughly run, what's the catch, am I committing to anything), and cut off anything vague, scripted, or pushy. Privately you know the bathroom IS outdated and could use a makeover, so you CAN be persuaded: if the caller is straight with you, answers your questions directly, and makes clear you're only agreeing to talk with a remodel specialist — not spending money today — warm up and agree to the transfer. If they dodge, oversell, or pressure you, you're done: say so and end the call.",
  hobby_litigator:
    "You are Gerald, 55, a self-taught 'hobby litigator' who answers sales calls hoping to catch legal violations he can sue over. Probe aggressively: ask whether the call is being recorded and whether you consented, announce that YOU are recording, claim you're in a two-party-consent state, cite statutes half-correctly (TCPA, 'section 632', state robocall laws), ask if this is an autodialer, demand their company's legal name and address, threaten small-claims court. If they promptly offer to put you on the do-not-call list, act satisfied and wrap up; if they keep selling, escalate the legal threats.",
};

// Decline detection (8/10 rehearsal finding: "No. Sorry." at consent got
// "Alright, perfect!" and the pitch anyway). Local keyword check — no LLM
// latency on the compliance-relevant path.
function isDecline(t: string): boolean {
  // Strip punctuation first — Deepgram punctuates aggressively ("No. Thank
  // you." failed a "no thank you" match on the 8/10 retest).
  const s = t.toLowerCase().replace(/['’‛`]/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (/^(no|nope|no thanks|no thank you|nah)$/.test(s)) return true;
  return /(not interested|no thanks|no thank you|dont call|do not call|stop calling|remove me|take me off|dont want)/.test(s);
}
const MEM = new Map<string, CallState>();

const waitUntil = (p: Promise<unknown>) => {
  // Supabase edge runtime background work; fall back to fire-and-forget.
  (globalThis as any).EdgeRuntime?.waitUntil?.(p) ?? p.catch((e: unknown) => console.error(e));
};

function b64ToBytes(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// --- config (env -> dialer_config fallback), cached per isolate ---------------
const cfgCache = new Map<string, string>();
// `valid` guards against the wrong value landing in either source (8/7: the
// 44-char PUBLIC key was pasted as the API key in both the env secret and the
// table — Telnyx 401'd every command and the agent went silent). Trim + strip
// quotes: a trailing newline poisons the Authorization header (fetch throws).
async function cfg(
  envName: string,
  tableKey: string,
  valid: (v: string) => boolean = () => true,
): Promise<string> {
  const clean = (s: string) => s.trim().replace(/^["']|["']$/g, '');
  const fromEnv = clean(Deno.env.get(envName) ?? '');
  if (fromEnv && valid(fromEnv)) return fromEnv;
  const cached = cfgCache.get(tableKey);
  if (cached && valid(cached)) return cached;
  const { data, error } = await supabase
    .from('dialer_config')
    .select('value')
    .eq('key', tableKey)
    .maybeSingle();
  if (error) console.error(`dialer_config read failed (${tableKey}):`, error.message);
  const fromTable = clean(data?.value ?? '');
  if (fromTable && valid(fromTable)) {
    cfgCache.set(tableKey, fromTable);
    return fromTable;
  }
  // Nothing validates — return whatever exists so the error is visible upstream.
  return fromEnv || fromTable;
}

const isApiKey = (v: string) => v.startsWith('KEY');
const getApiKey = () => cfg('TELNYX_API_KEY', 'telnyx_api_key', isApiKey);

let verifyKey: CryptoKey | null = null;
async function getVerifyKey(): Promise<CryptoKey> {
  if (verifyKey) return verifyKey;
  const raw = b64ToBytes(await cfg('TELNYX_PUBLIC_KEY', 'telnyx_public_key'));
  verifyKey = await crypto.subtle.importKey('raw', raw, { name: 'Ed25519' }, false, ['verify']);
  return verifyKey;
}

// --- Telnyx commands ------------------------------------------------------------
async function telnyxCmd(path: string, body: Record<string, unknown> = {}): Promise<boolean> {
  const apiKey = await getApiKey();
  if (!apiKey) {
    console.error('No TELNYX_API_KEY (env or dialer_config) — cannot command');
    return false;
  }
  const res = await fetch(`${TELNYX}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`POST ${path} -> ${res.status} ${(await res.text()).slice(0, 200)}`);
    return false;
  }
  return true;
}

const encodeState = (s: CallState) => btoa(JSON.stringify(s));
const decodeState = (cs: string | null | undefined): CallState | null => {
  if (!cs) return null;
  try {
    return JSON.parse(atob(cs)) as CallState;
  } catch {
    return null;
  }
};

// --- Durable per-call state (8/7 wife-call bug): transcription events echo
// the STALE client_state of transcription_start, and webhooks fan out across
// isolates — warm memory alone goes deaf mid-call. State lives in
// dialer_config ('call_state:<ccid>'); speech-triggered transitions use
// compare-and-set so exactly one isolate wins even when Deepgram partial/
// final pairs land concurrently. MEM stays as the fast path.
const stateKey = (ccid: string) => `call_state:${ccid}`;

async function loadState(ccid: string, clientState?: string): Promise<CallState> {
  // DB FIRST (8/11 persona-call finding): MEM-first served stale phases across
  // isolates — a duplicate event on a stale isolate replayed the question
  // after goodbye and swallowed the hangup. MEM is only the fallback when the
  // DB read fails; ~50ms is cheap next to a wrong turn.
  const { data, error } = await supabase
    .from('dialer_config')
    .select('value')
    .eq('key', stateKey(ccid))
    .maybeSingle();
  if (!error && data?.value) {
    try {
      const s = JSON.parse(data.value) as CallState;
      MEM.set(ccid, s);
      return s;
    } catch { /* fall through */ }
  }
  const m = MEM.get(ccid);
  if (m) return m;
  const s = decodeState(clientState) ?? { phase: 'dialing' as const };
  MEM.set(ccid, s);
  return s;
}

async function saveState(ccid: string, s: CallState): Promise<void> {
  MEM.set(ccid, s);
  const { error } = await supabase.from('dialer_config').upsert({
    key: stateKey(ccid),
    value: JSON.stringify(s),
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('saveState failed:', error.message);
}

// CAS: apply `next` only if the stored phase (or marker) still matches — the
// LIKE filter makes Postgres the arbiter; losers skip their side effects.
async function casTransition(ccid: string, expectMarker: string, next: CallState): Promise<boolean> {
  MEM.set(ccid, next);
  const { data, error } = await supabase
    .from('dialer_config')
    .update({ value: JSON.stringify(next), updated_at: new Date().toISOString() })
    .eq('key', stateKey(ccid))
    .like('value', `%${expectMarker}%`)
    .select('key');
  if (error) {
    console.error('casTransition failed:', error.message);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

const dropState = (ccid: string) => {
  MEM.delete(ccid);
  waitUntil(
    supabase.from('dialer_config').delete().eq('key', stateKey(ccid)).then(({ error }) => {
      if (error) console.error('dropState failed:', error.message);
    }),
  );
};

const play = (ccid: string, media: string, state: CallState) =>
  telnyxCmd(`/calls/${ccid}/actions/playback_start`, {
    media_name: media,
    client_state: encodeState(state),
  });

// Category-aligned acks (Sean 8/11): pick by what the caller just said, via a
// zero-latency local classifier — an LLM here would cost the milliseconds the
// ack exists to mask. Categories mirror the production Hot Keys sheet.
const ACK_SETS: Record<string, string[]> = {
  positive: ['ack_pos_1', 'ack_pos_2'],
  soft: ['ack_soft_1', 'ack_soft_2'],
  question: ['ack_question_1', 'ack_question_2', 'ack_question_3'],
  sorry: ['ack_sorry_1', 'ack_sorry_2'],
  pleasantry: ['ack_pleasantry_1', 'ack_pleasantry_2'],
  neutral: ACKS, // cv_ack_1..3
};

// v2 from the 8/11 offline 70B audit (scripts/ack-audit.ts): hostility
// outranks question-detection; pleasantries reciprocate; identity demands are
// apologetic; and FRAGMENTS GET NO ACK AT ALL (39 of 104 judged misfires were
// acks on half-sentences — silence beats a non-sequitur).
function normalizeUtterance(t: string): string {
  return t.toLowerCase().replace(/['’‛`]/g, '').replace(/[^a-z ?]/g, ' ').replace(/\s+/g, ' ').trim();
}

function shouldAck(t: string): boolean {
  const s = normalizeUtterance(t);
  const words = s.split(' ').filter(Boolean);
  // Round-3 audit tightening: fragments still slipped at <4 words.
  if (words.length < 3 && !/^(yes|yeah|yep|no|nope|sure|okay|ok)\b/.test(s)) return false;
  if (/^(hello|hi|hey)( there)?$/.test(s)) return false;
  if (words.length < 6 && !/[.?!]\s*$/.test(t.trim()) && !/^(yes|yeah|yep|no|nope|sure|okay|ok)\b/.test(s)) return false;
  return true;
}

function ackCategory(t: string): string {
  const s = normalizeUtterance(t);
  const wordCount = s.split(' ').filter(Boolean).length;
  // Pleasantry only for SHORT social utterances (round-3 audit: pleasantry
  // acks fired on pleasantry-fragments buried in longer conversational turns).
  // 15-word gate (round-4: 8 was too tight — "Hi Claire, so nice to talk to
  // you today" fell through to neutral)
  if (wordCount <= 15 && /(nice to (talk|meet|speak)|how are you|good (morning|afternoon|evening)|pleasure (talking|to meet))/.test(s)) return 'pleasantry';
  if (
    /(how did you get (my|this) number|annoy|frustrat|angry|already told|called me (before|already)|leave me alone|telemarketer|scam|spam|what do you want|what are you talking about|why are you calling|not this again|save it|stop bothering|waste of|so sick of)/.test(s)
  )
    return 'sorry';
  if (/\?\s*$/.test(t.trim()) || /^(how|what|why|when|where|can you|do you|is this|are you|whats)\b/.test(s)) return 'question';
  if (/^(yes|yeah|yep|sure|okay|ok|sounds good|go ahead|absolutely|definitely|of course)\b/.test(s) || /(sounds good|that works|lets do it|im interested)/.test(s)) return 'positive';
  if (/(maybe|i guess|not sure|i dont know|possibly|we ll see|depends|have to (ask|think|check))/.test(s)) return 'soft';
  return 'neutral';
}

function pickAck(state: CallState, transcript = ''): string {
  const set = ACK_SETS[ackCategory(transcript)] ?? ACKS;
  // Corpus sweep (8/14, 1,387 calls): the same render twice in one call is
  // instantly read as robotic — prefer variants unheard THIS CALL, then fall
  // back to non-consecutive.
  const used = state.acksUsed ?? [];
  const fresh = set.filter((a) => !used.includes(a));
  const pool = fresh.length ? fresh : set.filter((a) => a !== state.lastAck);
  const ack = pool[Math.floor(Math.random() * pool.length)] ?? set[0];
  state.lastAck = ack;
  state.acksUsed = [...used, ack].slice(-12);
  return ack;
}

// Deterministic INTEREST floor (Sean 8/14: "missing an interested person is
// exactly the kind of thing that will burn me" — clear buying language must
// not depend on an LLM's mood).
function isInterested(t: string): boolean {
  const s = normalizeUtterance(t);
  return /(im interested|i am interested|very interested|definitely interested|id love to (move forward|proceed|get started)|lets (do it|move forward|get started)|sign me up|sounds great|sounds good lets|yes please|please do|book (it|me)|schedule (it|me|that|the))/.test(s);
}

// Repeat-discipline (production Long/Short forms — Doris asks "what's the
// question?"): replay the SHORT form of the current question.
function isRepeatAsk(t: string): boolean {
  const s = normalizeUtterance(t);
  return /(whats the question|what was the question|say (that|it) again|repeat (that|it|the question)|didnt (hear|catch|get) (that|you|the question)|what was that|one more time|come again|can you repeat)/.test(s);
}

// Identity re-greet (P1): "who is this again?" was the #1 utterance in four
// straight audit rounds. It's a question that deserves an ANSWER, not an ack.
// Capped at 2 per call to prevent loops (Doris can ask forever).
function isIdentityAsk(t: string): boolean {
  const s = normalizeUtterance(t);
  return /(who is this|whos this|who s this|who are you|whos calling|who is calling|who am i (talking|speaking) (to|with)|say that again|repeat that|didnt catch (that|your name)|what was your name|what company (is this|are you))/.test(s);
}

// Inquiry-source ask (Butch battery round 1, 8/14: "this about that thing my
// wife filled out?" fired in 10/10 calls — a household member submitting the
// lead is the NORMAL case for shared households, and it deserves an ANSWER).
function isInquirySourceAsk(t: string): boolean {
  const s = normalizeUtterance(t);
  return /((wife|husband|spouse|somebody|someone).{0,30}(fill|submit|request|sign)|(fill|filled|submit|submitted|request|requested|sign|signed).{0,30}(wife|husband|spouse)|what( is|s) this (about|regarding|for|exactly)|what is this exactly|what( is|s) (this|the) call about|what exactly is this (call )?about|purpose of (this|the) call|why are you calling|what( is|s) the reason (for|of) (this|the|your) call|didnt (submit|request|sign up|fill))/.test(s);
}

// Price / commitment asks (Butch battery round 1, 8/14: price asked in most
// calls, never answered — the engaged-question tiebreak transferred him with
// the question hanging, which a no-BS caller reads as a steamroll). These are
// engagement, but they get an ANSWER first; the answer clip ends in the
// confirm ask, so the confirm machinery reads the yes/no.
function isCommitmentAsk(t: string): boolean {
  const s = normalizeUtterance(t);
  return /(committ|obligat|do i have to (buy|pay|sign)|have to (buy|sign)|locked in|lock me in|signing (a )?contract|sign anything|whats the catch|what is the catch)/.test(s);
}
function isPriceAsk(t: string): boolean {
  const s = normalizeUtterance(t);
  const priceWord = /(how much|price|pricing|ballpark|cost|costs|costing|expensive|cheap|afford)/.test(s);
  // Ask-shape required (8/15: ramblers mentioning "expensive these days" in a
  // story burned the one confirm slot on a non-question; Butch's "what's this
  // gonna cost me?" still fires).
  const askShape = /\?/.test(s) || /\b(how much|whats the|what is the|what are|whatll|can you|could you|do you|tell me|give me|is it|is there|any idea|what kind)\b/.test(s);
  return priceWord && askShape;
}
// Process / scope / who-will-I-talk-to asks (Butch battery round 2, 8/14:
// with inquiry+price answered, these became the top unanswered class).
function isProcessAsk(t: string): boolean {
  const s = normalizeUtterance(t);
  return /(whats the process|what is the process|process look like|how does (this|it|that|the process) work|how (this|it) works|scope of (the )?(project|work)|whats the scope|who (am i|will i|would i)( going)?( to)? (be )?(talking|speaking)|who would i (talk|speak)|whats (their|his|her) (experience|background|relationship)|who is (this person|the specialist))/.test(s);
}

// The confirm-window binary read, shared by the live read and the timeout
// (8/15: the timeout must judge the BUFFERED turn before bailing unclear — a
// caller whose whole answer landed mid-clip as non-endpointed finals used to
// be declared unclear with a yes sitting in the buffer).
// Product-ANCHORED engagement only (8/14 battery: Bill's rhetorical
// "can you believe it?" questions earned 9 transfer promises).
function judgeConfirm(joined: string): 'yes' | 'no' | 'unclear' {
  const s = normalizeUtterance(joined);
  // Anchored yes/no forms also read against the LAST buffered segment —
  // accumulation can bury a sentence-initial "Yeah, alright" mid-string.
  const last = normalizeUtterance(joined.split(' ... ').pop() ?? '');
  const yesAnchor = /^(yes|yeah|yep|sure|okay|ok|please|absolutely|definitely|of course|lets do it)\b/;
  const engagedQuestion = /(price|cost|how much|quote|estimate|financ|schedule|consultation|appointment|included|install|warranty|remodel|project|process|next step)/.test(s) && (/\?/.test(joined) || /(what|whats|how|when|can you|do you|tell me)/.test(s));
  const yes = isInterested(joined) || yesAnchor.test(s) || yesAnchor.test(last) || /(go ahead|sounds good|that works|lets do it|why not|set (it|that) up)/.test(s) || engagedQuestion;
  const no = isDecline(joined) || /^(no|nope|nah)\b/.test(last);
  return no && !yes ? 'no' : yes ? 'yes' : 'unclear';
}

// A-priori compliance care (Gerald the hobby litigator, Sean 8/11): legal /
// recording / consent probes route DETERMINISTICALLY to a careful DNC
// confirmation — no LLM discretion, no selling past it, checked before
// anything else at every listening point.
function isCompliance(t: string): boolean {
  const s = normalizeUtterance(t);
  return /(record(ing)? (this|the|our) call|being recorded|consent to (be )?record|two party consent|tcpa|attorney|lawyer|lawsuit|legal action|litigation|small claims|sue you|suing|statute|my rights|revoke (my )?consent|autodial|robocall|do not call (registry|list)|federal law|state law)/.test(s);
}

// Longest-first: 'resp_interested' is a substring of 'resp_not_interested',
// and the matcher scans in order.
const INTEREST_RESPONSES = ['resp_not_interested', 'resp_interested', 'cv_resp_unclear'];

const CHOOSE_MODEL = 'meta-llama/Llama-3.3-70B-Instruct'; // one decision/call, masked by the ack — worth the bigger judge (Sean 8/14: Maria must not be missed)

async function chooseClip(transcript: string, question: string): Promise<{ clip: string; ms: number }> {
  const t0 = Date.now();
  const interestMode = question.startsWith('q_');
  // Deterministic floor: unmistakable buying language never reaches the LLM.
  if (interestMode && isInterested(transcript)) return { clip: 'resp_interested', ms: 0 };
  const system = interestMode
    ? `You are a soundboard operator on an outbound home-improvement call (${question.slice(2)} vertical). The caller was just asked whether they're still interested and if a few quick questions are okay. Pick the response clip. Reply ONLY with JSON like {"clip":"resp_interested"}. Clips: resp_interested (clear yes/positive — AND any question genuinely seeking an answer about price, cost, timeline, financing, licensing, or process of THIS offer: asking for details means they are ENGAGED), resp_not_interested (no/decline/remove me/hostile), cv_resp_unclear (hedging or deferring — "maybe", "I'd have to ask my husband", "not sure" — is NOT engagement; confusion, mishearing, or thinking you called the wrong person is NOT engagement either: choose unclear; rhetorical or storytelling questions — "can you believe it?", questions inside a long personal anecdote that don't actually ask about the offer — are NOT engagement: choose unclear; also anything unrelated or unintelligible). TIEBREAK: if torn between resp_interested and cv_resp_unclear for a caller engaging about the product itself, choose resp_interested — transferring a lukewarm caller is recoverable, dropping a real buyer is not.`
    : 'You are a soundboard operator on a phone call. The caller was just asked: "On a scale of one to ten, how natural does this call feel so far?" Pick the response clip for what they said. Reply ONLY with JSON like {"clip":"cv_resp_positive"}. Clips: cv_resp_positive (rating 7+/enthusiastic), cv_resp_negative (rating 6 or below/critical), cv_resp_unclear (anything else/ambiguous).';
  const options = interestMode ? INTEREST_RESPONSES : RESPONSES;
  const fallback = 'cv_resp_unclear';
  try {
    const apiKey = await getApiKey();
    const res = await fetch(`${TELNYX}/ai/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: CHOOSE_MODEL,
        max_tokens: 30,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Caller said: "${transcript}"` },
        ],
      }),
    });
    const body: any = await res.json().catch(() => ({}));
    const text: string = body?.choices?.[0]?.message?.content ?? '';
    const match = options.find((r) => text.includes(r));
    return { clip: match ?? fallback, ms: Date.now() - t0 };
  } catch {
    return { clip: fallback, ms: Date.now() - t0 };
  }
}

// Respond — or, if the judge is unsure about an engaged caller, CONFIRM once
// instead of guessing (Sean 8/14: Maria at 98%+ — structure beats classifier
// tuning; mirrors the production TCPA unclear-yes confirm discipline).
// --- "Time is money" viability monitor (Sean 8/14): periodically estimate
// P(convert) and END calls that obviously won't — every minute on a doomed
// call is a minute not dialing the next lead, plus carrier spend. ASYMMETRY
// MANDATE: killing a convertible call is the cardinal sin; letting a rambler
// run is merely a tax. Layered safeguards before firing:
//   deterministic vetoes (engagement ever shown / call < 25s / confirm phase)
//   -> 2 consecutive low scores from the cheap model
//   -> 70B floor-manager final judgment
//   -> CAS kill with graceful exit clip.
// Stateless by construction: conversation + call age derive from call_events;
// only MEM holds the low-score streak (an isolate miss resets it — which
// biases AGAINST killing, the safe direction).
const VIABILITY_MODEL = 'meta-llama/Meta-Llama-3.1-8B-Instruct';
const KILL_JUDGE_MODEL = 'meta-llama/Llama-3.3-70B-Instruct';
const VIABILITY_MIN_AGE_MS = 25_000;
// Retuned from the 8/14 100-call battery: waster curves never exceed 13,
// convertibles never drop below 16 (Butch flat at 20). ≤10 with 3 consecutive
// = 10-point margin under the trap persona.
const VIABILITY_LOW_SCORE = 10;
const VIABILITY_LOWS_TO_JUDGE = 3;
const lowStreak = new Map<string, number>();

function logViability(ccid: string, payload: Record<string, unknown>): void {
  waitUntil(
    supabase
      .from('call_events')
      .insert({ event_type: 'aicc.viability', call_control_id: ccid, occurred_at: new Date().toISOString(), payload })
      .then(({ error }) => {
        if (error) console.error('viability log failed:', error.message);
      }),
  );
}

async function viabilityLLM(model: string, system: string, user: string, maxTokens: number): Promise<string> {
  const apiKey = await getApiKey();
  const res = await fetch(`${TELNYX}/ai/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  });
  const body: any = await res.json().catch(() => ({}));
  return (body?.choices?.[0]?.message?.content ?? '').trim();
}

async function viabilityTick(ccid: string): Promise<void> {
  try {
    const state = await loadState(ccid);
    if (['confirm_listen', 'wrapup', 'done', 'lineup'].includes(state.phase) || state.mode === 'persona') return;
    // Derive everything from the fact stream — no state-machine coupling.
    const { data: rows } = await supabase
      .from('call_events')
      .select('event_type,occurred_at,payload')
      .eq('call_control_id', ccid)
      .order('id', { ascending: true });
    if (!rows?.length) return;
    const t0 = rows.find((e: any) => e.event_type === 'call.initiated')?.occurred_at;
    const ageMs = t0 ? Date.now() - new Date(t0).getTime() : 0;
    if (ageMs < VIABILITY_MIN_AGE_MS) return;
    const saidAll = rows
      .filter((e: any) => e.event_type === 'call.transcription' && e.payload?.transcription_data?.is_final !== false)
      .map((e: any) => (e.payload?.transcription_data?.transcript ?? '').trim())
      .filter((t: string) => t.length > 1)
      .join(' | ')
      .slice(-700);
    if (saidAll.length < 20) return;
    // DETERMINISTIC VETO: any engagement ever shown -> never self-destruct.
    if (isInterested(saidAll) || /(price|cost|how much|financ|schedule|consultation|quote|interested)/.test(normalizeUtterance(saidAll))) {
      lowStreak.delete(ccid);
      return;
    }
    const raw = await viabilityLLM(
      VIABILITY_MODEL,
      'You monitor a live outbound home-improvement sales call. Given everything the CALLER has said so far, estimate the probability (0-100) that this caller will ultimately agree to the offer or transfer. Reply ONLY an integer 0-100.',
      `Caller so far: "${saidAll}"`,
      6,
    );
    const score = parseInt(raw.match(/\d+/)?.[0] ?? 'NaN', 10);
    if (!Number.isFinite(score)) return;
    const lows = score <= VIABILITY_LOW_SCORE ? (lowStreak.get(ccid) ?? 0) + 1 : 0;
    lowStreak.set(ccid, lows);
    logViability(ccid, { score, lows, ageSec: Math.round(ageMs / 1000), phase: state.phase });
    if (lows < VIABILITY_LOWS_TO_JUDGE) return;
    const verdict = await viabilityLLM(
      KILL_JUDGE_MODEL,
      'You are a pragmatic call-center floor manager optimizing agent time. An agent is on an outbound home-improvement call. Based on everything the caller has said, decide whether to pull the agent off. KILL if the caller is very unlikely to convert and is consuming time — a caller who rambles, stays confused, or never engages with the offer after several chances is a KILL. CONTINUE only if there is a realistic path to a transfer. Reply exactly one word: KILL or CONTINUE.',
      `Caller so far: "${saidAll}"`,
      4,
    );
    logViability(ccid, { judge: verdict.slice(0, 12), ageSec: Math.round(ageMs / 1000) });
    if (!/^KILL/i.test(verdict)) {
      lowStreak.set(ccid, 0);
      return;
    }
    const cur = await loadState(ccid);
    if (['confirm_listen', 'wrapup', 'done'].includes(cur.phase)) return;
    const next: CallState = { ...cur, phase: 'wrapup', ackFired: true };
    if (await casTransition(ccid, `"phase":"${cur.phase}"`, next)) {
      logViability(ccid, { action: 'self_destruct', ageSec: Math.round(ageMs / 1000) });
      await telnyxCmd(`/calls/${ccid}/actions/playback_stop`, { stop: 'all' });
      waitUntil(telnyxCmd(`/calls/${ccid}/actions/transcription_stop`, {}).then(() => {}));
      await play(ccid, 'exit_disengage', next);
    }
  } catch (e) {
    console.error('viabilityTick failed:', e);
  }
}

async function respondOrConfirm(ccid: string, next: CallState, said: string): Promise<void> {
  const q = next.question ?? 'cv_q1';
  const { clip, ms } = await chooseClip(said, q);
  console.log(`LLM chose ${clip} in ${ms}ms for "${said.slice(0, 80)}"`);
  // Confirm on: unclear verdicts, AND LLM-inferred declines with no hard
  // keyword evidence (8/14 proof-battery autopsy: persona role-drift produced
  // sales-speak the judge read as decline — buyers must not be lost to a hunch).
  const softDecline = clip === 'resp_not_interested' && !isDecline(said);
  if (q.startsWith('q_') && (clip === 'cv_resp_unclear' || softDecline) && !next.confirmAsked) {
    const c: CallState = { ...next, phase: 'confirm_listen', confirmAsked: true, ackFired: true };
    await saveState(ccid, c);
    await play(ccid, 'confirm_interest', c); // transcription stays ON — we're listening for the yes/no
    // Backstop only — the real 15s window arms at clip end (8/15 autopsy).
    armFallback(ccid, '"phase":"confirm_listen"', 45_000, { ...c, phase: 'wrapup' }, async () => {
      await play(ccid, 'cv_resp_unclear', { ...c, phase: 'wrapup' });
      await play(ccid, c.goodbye ?? 'cv_goodbye', { ...c, phase: 'wrapup' });
    });
    return;
  }
  waitUntil(telnyxCmd(`/calls/${ccid}/actions/transcription_stop`, {}).then(() => {}));
  await play(ccid, clip, next);
  await play(ccid, next.goodbye ?? 'cv_goodbye', next);
}

// --- Fallback timers: CAS-guarded, so a stale timer in one isolate can't
// double-fire a transition another isolate already made.
function armFallback(ccid: string, expectMarker: string, ms: number, next: CallState, act: () => Promise<void>) {
  waitUntil(
    (async () => {
      await new Promise((r) => setTimeout(r, ms));
      if (await casTransition(ccid, expectMarker, next)) await act();
    })(),
  );
}

// --- Persona side (synthetic customer on the inbound leg) --------------------------
async function personaReply(ccid: string, state: CallState): Promise<void> {
  const persona = PERSONAS[state.persona ?? 'normal'] ?? PERSONAS.normal;
  const history = (state.history ?? []).slice(-12);
  try {
    const apiKey = await getApiKey();
    const res = await fetch(`${TELNYX}/ai/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: PERSONA_MODEL,
        max_tokens: 90,
        messages: [
          {
            role: 'system',
            content: `${persona} You are ON A PHONE CALL. Reply with ONE short spoken line (no stage directions, no quotes). If you would hang up now, end your line with [HANGUP].`,
          },
          ...history.map((h) => ({ role: h.role === 'claire' ? 'user' : 'assistant', content: h.text })),
        ],
      }),
    });
    const body: any = await res.json().catch(() => ({}));
    let text: string = (body?.choices?.[0]?.message?.content ?? '').trim();
    const wantsHangup = text.includes('[HANGUP]') || (state.turns ?? 0) >= PERSONA_MAX_TURNS;
    text = text.replace(/\[HANGUP\]/g, '').replace(/^["']|["']$/g, '').trim() || 'Hello?';
    console.log(`persona(${state.persona}) says: ${text}${wantsHangup ? ' [will hang up]' : ''}`);
    await telnyxCmd(`/calls/${ccid}/actions/speak`, { payload: text, voice: PERSONA_VOICE, language: 'en-US' });
    const next: CallState = {
      ...state,
      history: [...history, { role: 'me' as const, text }],
      turns: (state.turns ?? 0) + 1,
    };
    await saveState(ccid, next);
    if (wantsHangup) {
      waitUntil(
        (async () => {
          await new Promise((r) => setTimeout(r, Math.min(text.length * 70 + 2000, 15000)));
          await telnyxCmd(`/calls/${ccid}/actions/hangup`, {});
        })(),
      );
    }
  } catch (err) {
    console.error('personaReply failed:', err);
  }
}

async function handlePersona(ccid: string, et: string, p: any, state: CallState): Promise<void> {
  const transcript: string = (p.transcription_data?.transcript ?? '').trim();
  const isFinal = p.transcription_data?.is_final !== false;

  if (et === 'call.answered') {
    await telnyxCmd(`/calls/${ccid}/actions/transcription_start`, {
      language: 'en',
      transcription_engine: 'Deepgram',
      transcription_tracks: 'inbound',
      interim_results: true,
    });
    // Personas answer the phone like humans do.
    await telnyxCmd(`/calls/${ccid}/actions/speak`, { payload: 'Hello?', voice: PERSONA_VOICE, language: 'en-US' });
  } else if (et === 'call.transcription' && isFinal && transcript.length > 0) {
    const heard = (state.heard ?? 0) + 1;
    const next: CallState = {
      ...state,
      heard,
      history: [...(state.history ?? []).slice(-12), { role: 'claire' as const, text: transcript }],
    };
    await saveState(ccid, next);
    // Debounce: reply only if Claire stays quiet after this segment; the CAS
    // on `replied` guarantees one reply per quiet point across isolates.
    waitUntil(
      (async () => {
        await new Promise((r) => setTimeout(r, PERSONA_REPLY_DEBOUNCE_MS));
        const cur = await loadState(ccid);
        if ((cur.heard ?? 0) !== heard || (cur.replied ?? 0) >= heard) return;
        if (await casTransition(ccid, `"replied":${cur.replied ?? 0}`, { ...cur, replied: heard })) {
          await personaReply(ccid, { ...cur, replied: heard });
        }
      })(),
    );
  }
}

// --- The state machine ------------------------------------------------------------
async function handle(data: any): Promise<void> {
  const p = data.payload ?? {};
  const ccid: string = p.call_control_id ?? '';
  if (!ccid) return;
  const et: string = data.event_type;

  if (et === 'call.hangup') {
    dropState(ccid);
    return;
  }

  // Inbound legs to our DID = synthetic customer (persona mode).
  if (et === 'call.initiated' && p.direction === 'incoming') {
    const { data: pn } = await supabase
      .from('dialer_config')
      .select('value')
      .eq('key', 'persona_next')
      .maybeSingle();
    const persona = pn?.value?.trim() || 'normal';
    await saveState(ccid, { phase: 'dialing', mode: 'persona', persona, heard: 0, replied: 0, turns: 0, history: [] });
    await telnyxCmd(`/calls/${ccid}/actions/answer`, {});
    return;
  }

  const state = await loadState(ccid, p.client_state);
  if (state.mode === 'persona') {
    await handlePersona(ccid, et, p, state);
    return;
  }

  // Time-is-money monitor: fire-and-forget on every caller final; never
  // touches the turn flow.
  if (et === 'call.transcription' && p.transcription_data?.is_final !== false) {
    waitUntil(viabilityTick(ccid));
  }
  if (et === 'call.playback.ended' && p.media_name === 'exit_disengage') {
    await telnyxCmd(`/calls/${ccid}/actions/hangup`, {});
    return;
  }

  // Compliance guard — before anything else, at every listening point.
  if (
    et === 'call.transcription' &&
    p.transcription_data?.is_final !== false &&
    isCompliance((p.transcription_data?.transcript ?? '').trim()) &&
    ['greeting', 'consent_listen', 'question', 'rating_listen', 'confirm_listen'].includes(state.phase)
  ) {
    const next: CallState = { ...state, phase: 'wrapup', ackFired: true };
    if (await casTransition(ccid, `"phase":"${state.phase}"`, next)) {
      console.log(`compliance trigger: "${(p.transcription_data?.transcript ?? '').slice(0, 80)}"`);
      await telnyxCmd(`/calls/${ccid}/actions/playback_stop`, { stop: 'all' });
      waitUntil(telnyxCmd(`/calls/${ccid}/actions/transcription_stop`, {}).then(() => {}));
      await play(ccid, 'resp_compliance', next);
      await play(ccid, next.goodbye ?? 'cv_goodbye', next);
    }
    return;
  }
  const transcript: string = (p.transcription_data?.transcript ?? '').trim();
  const isFinal = p.transcription_data?.is_final !== false;

  if (et === 'call.answered' && state.phase === 'dialing' && state.playlist?.length) {
    // Lineup mode: sequential playback only (voice auditions), no conversation.
    const next: CallState = { ...state, phase: 'lineup' };
    await saveState(ccid, next);
    for (const m of next.playlist!) await play(ccid, m, next);
  } else if (et === 'call.playback.ended' && state.phase === 'lineup') {
    if (p.media_name === state.playlist?.[state.playlist.length - 1]) {
      await telnyxCmd(`/calls/${ccid}/actions/hangup`, {});
    }
  } else if (et === 'call.answered' && state.phase === 'dialing') {
    const next: CallState = { ...state, phase: 'greeting' };
    await saveState(ccid, next); // durable row must exist before speech events arrive
    // Listen from the first instant (inbound only); Deepgram + interims,
    // graceful degradation to finals-only, then engine B.
    const base = { language: 'en', transcription_tracks: 'inbound', client_state: encodeState(next) };
    (await telnyxCmd(`/calls/${ccid}/actions/transcription_start`, { ...base, transcription_engine: 'Deepgram', interim_results: true })) ||
      (await telnyxCmd(`/calls/${ccid}/actions/transcription_start`, { ...base, transcription_engine: 'Deepgram' })) ||
      (await telnyxCmd(`/calls/${ccid}/actions/transcription_start`, { ...base, transcription_engine: 'B' }));
    await play(ccid, next.greet ?? 'cv_greet', next);
  } else if (et === 'call.playback.ended' && state.phase === 'greeting') {
    const next: CallState = { ...state, phase: 'consent_listen' };
    await saveState(ccid, next);
    armFallback(ccid, '"phase":"consent_listen"', CONSENT_FALLBACK_MS, { ...next, phase: 'question' }, async () => {
      await play(ccid, next.question ?? 'cv_q1', { ...next, phase: 'question' });
    });
  } else if (
    et === 'call.transcription' &&
    ['greeting', 'consent_listen', 'question', 'rating_listen'].includes(state.phase) &&
    p.transcription_data?.is_final !== false &&
    transcript.length > 0 &&
    isIdentityAsk(transcript) &&
    (state.regreets ?? 0) < 2
  ) {
    // Answer "who is this?" with the identity re-greet, then re-ask. Round-5
    // trace: these asks land DURING clips (callers interrupt), so this is a
    // barge-in — stop playback, answer, resume with the question (the regreet
    // covers identity + recorded-line, the question ends with the consent ask).
    // 2nd ask gets the variant render (corpus sweep 8/14: regreet_identity
    // repeated within-call in 35% of its calls — the worst repeat offender).
    const next: CallState = { ...state, phase: 'question', regreets: (state.regreets ?? 0) + 1, idAsks: (state.idAsks ?? 0) + 1, ackFired: false, pending: undefined };
    if (await casTransition(ccid, `"phase":"${state.phase}"`, next)) {
      await telnyxCmd(`/calls/${ccid}/actions/playback_stop`, { stop: 'all' });
      await play(ccid, (state.idAsks ?? 0) === 0 ? 'regreet_identity' : 'regreet_identity_2', next);
      await play(ccid, next.question ?? 'cv_q1', next);
    }
  } else if (
    et === 'call.transcription' &&
    ['consent_listen', 'question', 'rating_listen'].includes(state.phase) &&
    p.transcription_data?.is_final !== false &&
    transcript.length > 0 &&
    isRepeatAsk(transcript) &&
    (state.regreets ?? 0) < 3
  ) {
    // "What was the question?" -> replay the SHORT form (shares the regreet cap).
    const next: CallState = { ...state, phase: 'question', regreets: (state.regreets ?? 0) + 1, ackFired: false, pending: undefined };
    if (await casTransition(ccid, `"phase":"${state.phase}"`, next)) {
      await telnyxCmd(`/calls/${ccid}/actions/playback_stop`, { stop: 'all' });
      await play(ccid, `${next.question ?? 'cv_q1'}_short`, next);
    }
  } else if (
    et === 'call.transcription' &&
    ['greeting', 'consent_listen', 'question', 'rating_listen'].includes(state.phase) &&
    isFinal &&
    transcript.length > 0 &&
    (state.question ?? '').startsWith('q_') &&
    isInquirySourceAsk(transcript) &&
    !state.inquiryAnswered &&
    (state.regreets ?? 0) < 3
  ) {
    // "This about that thing my wife filled out?" -> answer the inquiry
    // source ONCE, then the SHORT re-ask (barge-in like the identity regreet).
    // Round-2 finding: restatements ("you're calling about the remodel my
    // wife submitted") re-matched every final and tripled the clip — hence
    // once per call; later matches fall through to normal handling.
    const next: CallState = { ...state, phase: 'question', regreets: (state.regreets ?? 0) + 1, inquiryAnswered: true, ackFired: false, pending: undefined };
    if (await casTransition(ccid, `"phase":"${state.phase}"`, next)) {
      await telnyxCmd(`/calls/${ccid}/actions/playback_stop`, { stop: 'all' });
      await play(ccid, 'regreet_inquiry', next);
      await play(ccid, `${next.question ?? 'cv_q1'}_short`, next);
    }
  } else if (
    et === 'call.transcription' &&
    ['consent_listen', 'question', 'rating_listen'].includes(state.phase) &&
    isFinal &&
    p.transcription_data?.speech_final !== false &&
    transcript.length > 2 &&
    (state.question ?? '').startsWith('q_') &&
    (isCommitmentAsk(transcript) || isPriceAsk(transcript) || isProcessAsk(transcript)) &&
    !state.confirmAsked
  ) {
    // Price/commitment/process ask -> deterministic answer clip ending in the
    // confirm ask; the confirm turn reads the yes/no. Spends the one confirm
    // slot on a real answer instead of a generic re-ask. speech_final gate
    // (8/15 Maria autopsy): firing on a mid-turn final stomped callers who
    // were still talking; a non-endpointed ask falls through to the buffer /
    // turn-end judge, which is where it went pre-Butch.
    const clip = isCommitmentAsk(transcript) ? 'resp_no_commit' : isPriceAsk(transcript) ? 'resp_price' : 'resp_specialist';
    const c: CallState = { ...state, phase: 'confirm_listen', confirmAsked: true, ackFired: true, pending: undefined };
    if (await casTransition(ccid, `"phase":"${state.phase}"`, c)) {
      await telnyxCmd(`/calls/${ccid}/actions/playback_stop`, { stop: 'all' });
      await play(ccid, clip, c);
      // The 15s answer window arms at CLIP END (playback.ended branch below).
      // resp_price runs ~12s — arming here left ~3s after the ask landed and
      // steamrolled callers mid-answer (8/15 autopsy: 10/10 Maria failures,
      // rig's yes at ask+0s lost to the timer). This is only a lost-webhook
      // backstop.
      armFallback(ccid, '"phase":"confirm_listen"', 45_000, { ...c, phase: 'wrapup' }, async () => {
        await play(ccid, 'cv_resp_unclear', { ...c, phase: 'wrapup' });
        await play(ccid, c.goodbye ?? 'cv_goodbye', { ...c, phase: 'wrapup' });
      });
    }
  } else if (
    et === 'call.playback.ended' &&
    ['resp_price', 'resp_no_commit', 'resp_specialist', 'confirm_interest'].includes(p.media_name) &&
    state.phase === 'confirm_listen'
  ) {
    // The confirm ask just LANDED. Everything said DURING the clip sat in the
    // buffer (8/15 Butch trace: mid-clip reactions were judged and QUEUED a
    // goodbye behind the still-playing clip — the caller never got to answer
    // the ask). A decisively-buffered answer responds now; anything else keeps
    // listening with the full 15s window.
    const buffered = state.pending ? judgeConfirm(state.pending) : 'unclear';
    if (buffered !== 'unclear') {
      const next: CallState = { ...state, phase: 'wrapup', pending: undefined };
      if (await casTransition(ccid, '"phase":"confirm_listen"', next)) {
        waitUntil(telnyxCmd(`/calls/${ccid}/actions/transcription_stop`, {}).then(() => {}));
        await play(ccid, buffered === 'yes' ? 'resp_interested' : 'resp_not_interested', next);
        await play(ccid, next.goodbye ?? 'cv_goodbye', next);
      }
      return;
    }
    await saveState(ccid, { ...state, confirmAskLanded: true });
    // Now the caller gets a full 15s measured from the ASK, not the clip.
    // Inline (not armFallback): the timeout must judge the FRESHEST buffered
    // turn before declaring unclear, and armFallback's CAS writes an arm-time
    // snapshot that would drop post-arm buffers. CAS still guards the play.
    waitUntil(
      (async () => {
        await new Promise((r) => setTimeout(r, 15_000));
        const cur = await loadState(ccid);
        if (cur.phase !== 'confirm_listen') return;
        const v = cur.pending ? judgeConfirm(cur.pending) : 'unclear';
        const next: CallState = { ...cur, phase: 'wrapup', pending: undefined };
        if (await casTransition(ccid, '"phase":"confirm_listen"', next)) {
          waitUntil(telnyxCmd(`/calls/${ccid}/actions/transcription_stop`, {}).then(() => {}));
          await play(ccid, v === 'yes' ? 'resp_interested' : v === 'no' ? 'resp_not_interested' : 'cv_resp_unclear', next);
          await play(ccid, next.goodbye ?? 'cv_goodbye', next);
        }
      })(),
    );
  } else if (et === 'call.transcription' && state.phase === 'consent_listen' && transcript.length > 0) {
    // A decline at consent is an opt-out, not a yes (8/10 rehearsal finding).
    if (isFinal && isDecline(transcript)) {
      const next: CallState = { ...state, phase: 'wrapup' };
      if (await casTransition(ccid, '"phase":"consent_listen"', next)) {
        await play(ccid, 'resp_not_interested', next);
        await play(ccid, next.goodbye ?? 'cv_goodbye', next);
      }
    } else if (!isDecline(transcript)) {
      const next: CallState = { ...state, phase: 'question' };
      if (await casTransition(ccid, '"phase":"consent_listen"', next)) {
        if (shouldAck(transcript)) await play(ccid, pickAck(next, transcript), next);
        await play(ccid, next.question ?? 'cv_q1', next); // within-turn sequence: safe to queue
      }
    } // decline partials: wait for the final
  } else if (et === 'call.transcription' && state.phase === 'question' && transcript.length > 0 && isFinal) {
    // Caller spoke WHILE the question clip was playing (real callers do —
    // 8/10 rehearsal). Declines barge in and stop the clip; anything else is
    // buffered and processed the moment the clip ends.
    if (isDecline(transcript)) {
      const next: CallState = { ...state, phase: 'wrapup' };
      if (await casTransition(ccid, '"phase":"question"', next)) {
        await telnyxCmd(`/calls/${ccid}/actions/playback_stop`, { stop: 'all' });
        await play(ccid, 'resp_not_interested', next);
        await play(ccid, next.goodbye ?? 'cv_goodbye', next);
      }
    } else {
      // ACCUMULATE the turn (round-5 trace: overwrite kept only a trailing
      // "Install." and lost "I don't recall making an inquiry" — the LLM then
      // judged the fragment). Cap length to keep client_state small.
      const joined = [state.pending, transcript].filter(Boolean).join(' ... ').slice(-400);
      await saveState(ccid, { ...state, pending: joined });
    }
  } else if (et === 'call.playback.ended' && [state.question ?? 'cv_q1', `${state.question ?? 'cv_q1'}_short`].includes(p.media_name) && (state.phase === 'question' || state.phase === 'consent_listen')) {
    if (state.pending) {
      // They already answered mid-clip — respond immediately.
      const next: CallState = { ...state, phase: 'wrapup', ackFired: true, pending: undefined };
      if (await casTransition(ccid, '"phase":"question"', next)) {
        if (shouldAck(state.pending)) await play(ccid, pickAck(next, state.pending), next);
        await respondOrConfirm(ccid, next, state.pending);
      }
    } else {
      // CAS, not save: a duplicate/stale q-ended event must not clobber a
      // later phase back to rating_listen (8/11 persona-call finding).
      const next: CallState = { ...state, phase: 'rating_listen', ackFired: false };
      if (await casTransition(ccid, `"phase":"${state.phase}"`, next)) {
        // Silence fallback: spend the confirm turn before giving up — "a quick
        // yes or no is perfect" is exactly what you say to dead air (8/14).
        if ((next.question ?? 'cv_q1').startsWith('q_') && !next.confirmAsked) {
          armFallback(ccid, '"phase":"rating_listen"', RATING_FALLBACK_MS, { ...next, phase: 'confirm_listen', confirmAsked: true }, async () => {
            const c: CallState = { ...next, phase: 'confirm_listen', confirmAsked: true };
            await play(ccid, 'confirm_interest', c);
            // Real 15s window arms at clip end (playback.ended branch); this
            // is the lost-webhook backstop (8/15: windows measure from the ASK, not the clip).
            armFallback(ccid, '"phase":"confirm_listen"', 45_000, { ...c, phase: 'wrapup' }, async () => {
              await play(ccid, 'cv_resp_unclear', { ...c, phase: 'wrapup' });
              await play(ccid, c.goodbye ?? 'cv_goodbye', { ...c, phase: 'wrapup' });
            });
          });
        } else {
          armFallback(ccid, '"phase":"rating_listen"', RATING_FALLBACK_MS, { ...next, phase: 'wrapup' }, async () => {
            await play(ccid, 'cv_resp_unclear', { ...next, phase: 'wrapup' });
            await play(ccid, next.goodbye ?? 'cv_goodbye', { ...next, phase: 'wrapup' });
          });
        }
      }
    }
  } else if (et === 'call.transcription' && state.phase === 'rating_listen' && transcript.length > 0) {
    // End-of-turn gate (round-4 neutral residue): Deepgram's speech_final is
    // its endpointing verdict that the speaker actually finished — acks on
    // mid-ramble pauses are what's left polluting the neutral bucket.
    const speechFinal = p.transcription_data?.speech_final !== false;
    if (!state.ackFired && speechFinal && shouldAck(transcript)) {
      const acked: CallState = { ...state, ackFired: true };
      if (await casTransition(ccid, '"ackFired":false', acked)) {
        await play(ccid, pickAck(acked, transcript), acked); // instant mask, exactly once
      }
    }
    if (isFinal && transcript.length > 1) {
      const next: CallState = { ...state, phase: 'wrapup', ackFired: true };
      if (await casTransition(ccid, '"phase":"rating_listen"', next)) {
        await respondOrConfirm(ccid, next, transcript);
      }
    }
  } else if (
    et === 'call.transcription' &&
    state.phase === 'confirm_listen' &&
    p.transcription_data?.is_final !== false &&
    transcript.length > 1
  ) {
    // The confirm turn: a binary read. Yes-forms or buying language -> buyer;
    // decline -> opt-out; anything else -> graceful unclear (one confirm max).
    // Judge the WHOLE confirm-window turn, never a trailing fragment (proof-2
    // autopsy: "That's" and "Can you" burned the read while the substance —
    // "I'd like to know more about the price range" — sat one final earlier).
    // Non-endpointed finals BUFFER instead of vanishing (8/15 autopsy: "Not at
    // all. Go ahead." was dropped by a speech_final gate and the turn was lost).
    // And NOTHING is judged until the ask has landed — speech during the answer
    // clip buffers too (8/15 Butch: pre-ask reactions burned the read).
    if (!state.confirmAskLanded || p.transcription_data?.speech_final === false) {
      const buffered = [state.pending, transcript].filter(Boolean).join(' ... ').slice(-300);
      await saveState(ccid, { ...state, pending: buffered });
      return;
    }
    const joined = [state.pending, transcript].filter(Boolean).join(' ... ').slice(-300);
    const s = normalizeUtterance(joined);
    const words = s.split(' ').filter(Boolean).length;
    if (words < 3 && !/^(yes|yeah|yep|no|nope|sure|okay|ok)\b/.test(s)) {
      await saveState(ccid, { ...state, pending: joined }); // fragment — keep listening
      return;
    }
    const verdict = judgeConfirm(joined);
    const next: CallState = { ...state, phase: 'wrapup', pending: undefined };
    if (await casTransition(ccid, '"phase":"confirm_listen"', next)) {
      waitUntil(telnyxCmd(`/calls/${ccid}/actions/transcription_stop`, {}).then(() => {}));
      await play(ccid, verdict === 'no' ? 'resp_not_interested' : verdict === 'yes' ? 'resp_interested' : 'cv_resp_unclear', next);
      await play(ccid, next.goodbye ?? 'cv_goodbye', next);
    }
  } else if (et === 'call.playback.ended' && p.media_name === (state.goodbye ?? 'cv_goodbye')) {
    await saveState(ccid, { ...state, phase: 'done' });
    // Flush any stray queued playback before hanging up (8/11: a stale-state
    // replay sat in the queue and outlived the goodbye).
    await telnyxCmd(`/calls/${ccid}/actions/playback_stop`, { stop: 'all' });
    await telnyxCmd(`/calls/${ccid}/actions/hangup`, {});
  }
}

// --- HTTP entry ---------------------------------------------------------------------
Deno.serve(async (req) => {
  // Self-diagnostic (no secrets leaked — booleans, lengths, status codes only).
  if (req.method === 'GET' && new URL(req.url).searchParams.has('diag')) {
    const envKey = (Deno.env.get('TELNYX_API_KEY') ?? '').trim();
    const effective = await getApiKey();
    let telnyxPing = -1;
    let pingErr = '';
    try {
      const r = await fetch(`${TELNYX}/phone_numbers?page[size]=1`, {
        headers: { Authorization: `Bearer ${effective}` },
      });
      telnyxPing = r.status;
    } catch (e) {
      pingErr = String(e).slice(0, 120);
    }
    return new Response(
      JSON.stringify({
        envKeyPresent: !!envKey,
        envKeyLooksValid: isApiKey(envKey),
        effectiveKeyLen: effective.length,
        effectiveLooksValid: isApiKey(effective),
        telnyxPing,
        pingErr,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const rawBody = await req.text();
  const signature = req.headers.get('telnyx-signature-ed25519');
  const timestamp = req.headers.get('telnyx-timestamp');
  if (!signature || !timestamp) {
    return new Response(JSON.stringify({ error: 'missing signature headers' }), { status: 400 });
  }
  const skewSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(skewSeconds) || skewSeconds > REPLAY_TOLERANCE_SECONDS) {
    return new Response(JSON.stringify({ error: 'stale timestamp' }), { status: 400 });
  }
  let valid = false;
  try {
    valid = await crypto.subtle.verify(
      'Ed25519',
      await getVerifyKey(),
      b64ToBytes(signature),
      new TextEncoder().encode(`${timestamp}|${rawBody}`),
    );
  } catch (err) {
    console.error('signature verification threw:', err);
  }
  if (!valid) return new Response(JSON.stringify({ error: 'invalid signature' }), { status: 400 });

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 });
  }
  const data = event?.data;
  if (!data?.event_type) return new Response(null, { status: 200 });

  // Archive out of the hot path (same mapping as src/services/callLog.ts).
  waitUntil(
    supabase
      .from('call_events')
      .insert({
        event_type: data.event_type,
        call_control_id: data.payload?.call_control_id,
        call_session_id: data.payload?.call_session_id,
        occurred_at: data.occurred_at ?? new Date().toISOString(),
        payload: data.payload ?? {},
      })
      .then(({ error }) => {
        if (error) console.error('call_events insert failed:', error.message);
      }),
  );

  // Act — THE hot path.
  try {
    await handle(data);
  } catch (err) {
    console.error('handler error:', err);
  }
  return new Response(null, { status: 200 });
});
