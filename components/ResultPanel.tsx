import { Sparkles } from "lucide-react";
import PlayingCard, { SuitIcon } from "./PlayingCard";
import { SUITS, handLabel, type Card, type DrawStats, type Outcome, type Role, type SimResult } from "@/lib/pokdeng";

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const money = (x: number) => `${x >= 0 ? "+" : "−"}฿${Math.abs(x).toLocaleString("th-TH", { maximumFractionDigits: 2 })}`;

function Bar({ o }: { o: Outcome }) {
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-felt-900">
        <div className="bg-win" style={{ width: pct(o.win) }} />
        <div className="bg-[#8aa399]" style={{ width: pct(o.draw) }} />
        <div className="bg-lose" style={{ width: pct(o.lose) }} />
      </div>
      <div className="mt-2 grid grid-cols-3 text-center font-mono text-[13px]">
        <span className="text-win">ชนะ {pct(o.win)}</span>
        <span className="text-[#aebfb6]">เสมอ {pct(o.draw)}</span>
        <span className="text-lose">แพ้ {pct(o.lose)}</span>
      </div>
    </div>
  );
}

function Scenario({ title, o, bet, badge, active }: { title: string; o: Outcome; bet: number; badge?: string; active?: boolean }) {
  return (
    <div className={`well p-3 ${active ? "ring-1 ring-gold-400/70" : ""}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{title}</span>
        {badge && <span className="gold-grad rounded-full px-2 py-0.5 text-[11px] font-bold text-felt-950">{badge}</span>}
      </div>
      <div className="font-mono text-xl font-bold text-ink">{pct(o.win)}</div>
      <div className="text-[11px] text-ink-dim">โอกาสชนะ</div>
      <div className={`mt-2 font-mono text-sm font-semibold ${o.ev >= 0 ? "text-win" : "text-lose"}`}>
        EV {money(o.ev * bet)}
      </div>
    </div>
  );
}

interface Props {
  hand: Card[];
  sim: SimResult | null;
  draw: DrawStats | null;
  busy: boolean;
  role: Role;
  bet: number;
  players: number;
  deckLeft: number;
}

export default function ResultPanel({ hand, sim, draw, busy, role, bet, players, deckLeft }: Props) {
  return (
    <section className="panel p-6 lg:sticky lg:top-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-felt-900 text-gold-400">
          <Sparkles className="h-4 w-4" />
        </span>
        <h2 className="flex items-center gap-2 text-lg font-bold"> โอกาส &amp; คำแนะนำ </h2>
      </div>

      {hand.length < 2 ? (
        <div className="px-4 py-8 text-center">
          <div className="mb-5 flex justify-center gap-1.5">
            {SUITS.map((s, i) => (
              <div
                key={s}
                className={`flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-[#faf6ea] shadow-[0_3px_8px_rgba(0,0,0,0.4)] ${
                  s === "heart" || s === "diamond" ? "text-[#d6283b]" : "text-[#1b2430]"
                }`}
                style={{ transform: `rotate(${[-5, 3, -3, 5][i]}deg)` }}
              >
                <SuitIcon suit={s} className="h-5 w-5" />
              </div>
            ))}
          </div>
          <p className="text-base font-bold">เลือกไพ่ในมืออย่างน้อย 2 ใบ</p>
          <p className="mx-auto mt-3 max-w-[300px] text-[13px] leading-relaxed text-ink-muted">
            แตะไพ่ในตารางเพื่อใส่ลงมือ ระบบจะจำลองหลายหมื่นรอบจากสำรับที่เหลือทันที
          </p>
        </div>
      ) : (
        <div className={`space-y-5 transition-opacity ${busy ? "opacity-50" : ""}`} aria-busy={busy}>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">{hand.map((c) => <PlayingCard key={c} card={c} disabled />)}</div>
            {sim && (
              <span className="rounded-full border border-gold-400/40 bg-gold-400/10 px-3 py-1 text-sm font-semibold text-gold-300">
                {handLabel(sim.hand)}
              </span>
            )}
          </div>

          {!sim && <p className="text-sm text-ink-muted">กำลังจำลอง…</p>}
          {sim?.error && <p className="rounded-xl bg-lose/10 p-3 text-sm text-lose">{sim.error}</p>}

          {sim && !sim.error && (() => {
            const hit = sim.hit;
            const diff = hit ? hit.ev - sim.stand.ev : 0;
            const rec: "stand" | "hit" | "even" | null = hit ? (Math.abs(diff) < 0.005 ? "even" : diff > 0 ? "hit" : "stand") : null;
            const main = hit && rec === "hit" ? hit : sim.stand;
            return (
              <>
                {hit ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Scenario title="อยู่" o={sim.stand} bet={bet} badge={rec === "stand" ? "แนะนำ" : undefined} active={rec === "stand"} />
                      <Scenario title="จั่วเพิ่ม" o={hit} bet={bet} badge={rec === "hit" ? "แนะนำ" : undefined} active={rec === "hit"} />
                    </div>
                    <p className="text-sm text-ink-muted">
                      {rec === "even"
                        ? "อยู่กับจั่วเพิ่มให้ผลใกล้เคียงกัน"
                        : `${rec === "hit" ? "จั่วเพิ่ม" : "อยู่"} ให้ EV สูงกว่า ${money(Math.abs(diff) * bet).replace(/^[+−]/, "")} ต่อรอบ`}
                    </p>
                  </>
                ) : null}

                <div>
                  <p className="mb-2 text-xs text-ink-muted">
                    {hit ? `ผลลัพธ์ถ้า${rec === "hit" ? "จั่วเพิ่ม" : "อยู่"}` : "ผลลัพธ์"} · {role === "banker" ? `เทียบกับลูกมือแต่ละคน (${players - 1} คน)` : "เทียบกับเจ้ามือ"}
                  </p>
                  <Bar o={hit && rec !== "stand" ? main : sim.stand} />
                </div>

                <div className="well flex items-center justify-between p-3">
                  <span className="text-sm text-ink-muted">EV ต่อรอบ (เดิมพัน ฿{bet})</span>
                  <span className={`font-mono text-lg font-bold ${(rec === "hit" ? hit!.ev : sim.stand.ev) >= 0 ? "text-win" : "text-lose"}`}>
                    {money((rec === "hit" ? hit!.ev : sim.stand.ev) * bet * (role === "banker" ? players - 1 : 1))}
                  </span>
                </div>
                {role === "banker" && <p className="-mt-3 text-[11px] text-ink-dim">รวมทุกลูกมือในโต๊ะ</p>}

                {draw && (
                  <div>
                    <p className="mb-2 text-xs text-ink-muted">ถ้าจั่วใบที่ 3 (จากไพ่ที่เหลือ {draw.total} ใบ)</p>
                    <div className="grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-3">
                      {([
                        ["แต้มดีขึ้น", draw.better],
                        ["แต้มเท่าเดิม", draw.same],
                        ["แต้มแย่ลง", draw.worse],
                        ["3 เด้ง", draw.threeDeng],
                        ["ตอง", draw.tong],
                        ["สเตรทฟลัช", draw.sflush],
                        ["เรียง", draw.straight],
                        ["เซียน", draw.sian],
                      ] as const).map(([label, n]) => (
                        <div key={label} className={`well px-2.5 py-2 ${n === 0 ? "opacity-50" : ""}`}>
                          <div className="text-ink-muted">{label}</div>
                          <div className="font-mono font-semibold">{pct(n / draw.total)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="font-mono text-[11px] text-ink-dim">
                  จำลอง {sim.rounds.toLocaleString()} รอบ · {sim.ms} ms · เหลือในสำรับ {deckLeft} ใบ
                </p>
              </>
            );
          })()}
        </div>
      )}
    </section>
  );
}
