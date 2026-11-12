// ป๊อกเด้ง — deck management, hand evaluator, multiplier logic, Monte Carlo + exact draw analysis

export type Card = number; // 0..51 → suit = floor(c / 13), rank = c % 13 + 1
export type Role = "banker" | "player";
export type SuitName = "spade" | "heart" | "diamond" | "club";

export const SUITS: SuitName[] = ["spade", "heart", "diamond", "club"]; // row order in the picker
export const RANK_LABELS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
export const FULL_DECK: Card[] = Array.from({ length: 52 }, (_, i) => i);

export const suitOf = (c: Card) => Math.floor(c / 13);
export const rankOf = (c: Card) => (c % 13) + 1;
/** A = 1, 2–9 = face value, 10/J/Q/K = 0 */
export const valueOf = (c: Card) => {
  const r = rankOf(c);
  return r >= 10 ? 0 : r;
};
export const isRed = (c: Card) => suitOf(c) === 1 || suitOf(c) === 2;
export const cardKey = (rank: number, suit: number): Card => suit * 13 + (rank - 1);

export function remainingDeck(used: readonly Card[]): Card[] {
  const taken = new Set(used);
  return FULL_DECK.filter((c) => !taken.has(c));
}

/* ───────────── Hand evaluation ───────────── */

export type HandCategory = "pok9" | "pok8" | "tong" | "sflush" | "straight" | "sian" | "normal";

export interface Hand {
  size: number;
  points: number;
  category: HandCategory;
  /** payout multiplier (เด้ง) applied when this hand wins / loses */
  mult: number;
  /** ranking tier: pok9 9 > pok8 8 > tong 7 > sflush 6 > straight 5 > sian 4 > normal 0 */
  level: number;
}

const LEVEL: Record<HandCategory, number> = {
  pok9: 9, pok8: 8, tong: 7, sflush: 6, straight: 5, sian: 4, normal: 0,
};

export function evaluate(cards: readonly Card[]): Hand {
  const n = cards.length;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += valueOf(cards[i]);
  const points = sum % 10;

  if (n < 3) {
    // 2 เด้ง: same suit OR pair (2 cards only)
    const deng = n === 2 && (suitOf(cards[0]) === suitOf(cards[1]) || rankOf(cards[0]) === rankOf(cards[1])) ? 2 : 1;
    if (n === 2 && points === 9) return { size: n, points, category: "pok9", mult: deng, level: 9 };
    if (n === 2 && points === 8) return { size: n, points, category: "pok8", mult: deng, level: 8 };
    return { size: n, points, category: "normal", mult: deng, level: 0 };
  }

  const [a, b, c] = cards;
  const ra = rankOf(a), rb = rankOf(b), rc = rankOf(c);
  const flush = suitOf(a) === suitOf(b) && suitOf(b) === suitOf(c);
  const tong = ra === rb && rb === rc;
  const sorted = [ra, rb, rc].sort((x, y) => x - y);
  const straight =
    (sorted[1] === sorted[0] + 1 && sorted[2] === sorted[1] + 1) ||
    (sorted[0] === 1 && sorted[1] === 12 && sorted[2] === 13); // Q-K-A
  const sian = ra >= 11 && rb >= 11 && rc >= 11;

  const make = (category: HandCategory, mult: number): Hand => ({
    size: 3, points, category, mult, level: LEVEL[category],
  });
  if (tong) return make("tong", 5);
  if (straight && flush) return make("sflush", 5);
  if (straight) return make("straight", 3);
  if (sian) return make("sian", 3);
  return make("normal", flush ? 3 : 1); // 3 เด้ง = three of the same suit
}

/** 1 = a wins, -1 = b wins, 0 = draw */
export function compare(a: Hand, b: Hand): number {
  if (a.level !== b.level) return a.level > b.level ? 1 : -1;
  if (a.level === 0) return a.points === b.points ? 0 : a.points > b.points ? 1 : -1;
  return 0;
}

/** Net result in bets: winner's multiplier is paid by the loser */
export function settle(me: Hand, opp: Hand): number {
  const r = compare(me, opp);
  return r > 0 ? me.mult : r < 0 ? -opp.mult : 0;
}

export function handLabel(h: Hand): string {
  switch (h.category) {
    case "pok9": return `ป๊อก 9${h.mult > 1 ? ` · ${h.mult} เด้ง` : ""}`;
    case "pok8": return `ป๊อก 8${h.mult > 1 ? ` · ${h.mult} เด้ง` : ""}`;
    case "tong": return "ตอง · 5 เด้ง";
    case "sflush": return "สเตรทฟลัช · 5 เด้ง";
    case "straight": return "เรียง · 3 เด้ง";
    case "sian": return "เซียน · 3 เด้ง";
    default: return `${h.points} แต้ม${h.mult > 1 ? ` · ${h.mult} เด้ง` : ""}`;
  }
}

/* ───────────── Exact 3rd-card analysis ───────────── */

export interface DrawStats {
  total: number;
  better: number;
  same: number;
  worse: number;
  threeDeng: number;
  tong: number;
  sflush: number;
  straight: number;
  sian: number;
}

export function drawAnalysis(hand: readonly Card[], revealed: readonly Card[]): DrawStats | null {
  if (hand.length !== 2) return null;
  const cur = evaluate(hand);
  if (cur.level >= 8) return null;
  const deck = remainingDeck([...hand, ...revealed]);
  const s: DrawStats = { total: deck.length, better: 0, same: 0, worse: 0, threeDeng: 0, tong: 0, sflush: 0, straight: 0, sian: 0 };
  for (const c of deck) {
    const h = evaluate([hand[0], hand[1], c]);
    const r = compare(h, cur);
    if (r > 0) s.better++; else if (r < 0) s.worse++; else s.same++;
    if (suitOf(hand[0]) === suitOf(hand[1]) && suitOf(hand[1]) === suitOf(c)) s.threeDeng++;
    if (h.category === "tong") s.tong++;
    else if (h.category === "sflush") s.sflush++;
    else if (h.category === "straight") s.straight++;
    else if (h.category === "sian") s.sian++;
  }
  return s;
}

/* ───────────── Monte Carlo ───────────── */

export interface SimParams {
  role: Role;
  players: number;   // total at table, including banker
  threshold: number; // opponents draw a 3rd card when points ≤ threshold (and no pok)
  rounds: number;
  hand: Card[];
  revealed: Card[];
}

export interface Outcome {
  win: number;
  draw: number;
  lose: number;
  /** expected net result per comparison, in units of the bet */
  ev: number;
}

export interface SimResult {
  error?: string;
  rounds: number;
  opponents: number;      // opponents compared against (1 as player, players-1 as banker)
  deckSize: number;
  hand: Hand;
  stand: Outcome;
  hit?: Outcome;          // only when holding 2 non-pok cards
  ms: number;
}

const EMPTY: Outcome = { win: 0, draw: 0, lose: 0, ev: 0 };

function xorshift(seed: number) {
  let x = seed | 0 || 123456789;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

export function simulate(p: SimParams): SimResult {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

  const k = Math.max(1, p.players - 1); // other seats
  const pool = Int8Array.from(remainingDeck([...p.hand, ...p.revealed]));
  const len = pool.length;
  const myStand = evaluate(p.hand);
  const base = { rounds: p.rounds, deckSize: len, hand: myStand };

  if (len < 2 * k + 1) {
    return { ...base, error: "ไพ่ในสำรับไม่พอสำหรับจำนวนผู้เล่น", opponents: k, stand: EMPTY, ms: 0 };
  }

  const canHit = p.hand.length === 2 && myStand.level < 8;
  const compared = p.role === "banker" ? k : 1;
  const needed = Math.min(len, 3 * k + 1);
  const rng = xorshift((Math.random() * 2 ** 31) | 0);

  let sW = 0, sD = 0, sL = 0, sEv = 0;
  let hW = 0, hD = 0, hL = 0, hEv = 0;

  for (let r = 0; r < p.rounds; r++) {
    // partial Fisher–Yates over the exact remaining deck
    for (let i = 0; i < needed; i++) {
      const j = i + Math.floor(rng() * (len - i));
      const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    let idx = 2 * k;                 // first 2k cards = opening hands of every other seat
    const hitCard = pool[idx++];     // reserved slot for my possible 3rd card
    const myHit = canHit ? evaluate([p.hand[0], p.hand[1], hitCard]) : myStand;

    for (let o = 0; o < compared; o++) {
      const opp2 = evaluate([pool[2 * o], pool[2 * o + 1]]);
      let opp = opp2;
      const oppPok = opp2.level >= 8;
      if (!oppPok && opp2.points <= p.threshold && idx < needed) {
        opp = evaluate([pool[2 * o], pool[2 * o + 1], pool[idx++]]);
      }

      const rs = settle(myStand, opp);
      if (rs > 0) sW++; else if (rs < 0) sL++; else sD++;
      sEv += rs;

      if (canHit) {
        // a pok settles before anyone draws, so the draw only matters when the opponent has no pok
        const rh = oppPok ? rs : settle(myHit, opp);
        if (rh > 0) hW++; else if (rh < 0) hL++; else hD++;
        hEv += rh;
      }
    }
  }

  const n = p.rounds * compared;
  const out = (w: number, d: number, l: number, ev: number): Outcome => ({ win: w / n, draw: d / n, lose: l / n, ev: ev / n });
  return {
    ...base,
    opponents: compared,
    stand: out(sW, sD, sL, sEv),
    hit: canHit ? out(hW, hD, hL, hEv) : undefined,
    ms: Math.round(now() - t0),
  };
}
