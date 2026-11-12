"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Eraser, Eye, Layers, Minus, Plus, Shuffle, SlidersHorizontal, User } from "lucide-react";
import CardPicker, { type PickTarget } from "@/components/CardPicker";
import PlayingCard, { SuitIcon } from "@/components/PlayingCard";
import ResultPanel from "@/components/ResultPanel";
import { drawAnalysis, remainingDeck, simulate, type Card, type Role, type SimParams, type SimResult } from "@/lib/pokdeng";

function Segmented<T extends string | number>({
  options, value, onChange, mono,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-felt-900/90 p-1" role="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-[10px] px-3 py-2.5 text-sm font-semibold transition-all ${mono ? "font-mono" : ""} ${
              on
                ? role_on(o.value)
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
// gold for the role toggle, green for numeric pills
const role_on = (v: string | number) =>
  v === "banker" || v === "player" ? "gold-grad text-felt-950" : "bg-felt-600 text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]";

export default function Home() {
  const [role, setRole] = useState<Role>("player");
  const [players, setPlayers] = useState(4);
  const [threshold, setThreshold] = useState(4);
  const [rounds, setRounds] = useState(60000);
  const [bet, setBet] = useState("100");
  const [hand, setHand] = useState<Card[]>([]);
  const [revealed, setRevealed] = useState<Card[]>([]);
  const [target, setTarget] = useState<PickTarget>("hand");

  const [sim, setSim] = useState<SimResult | null>(null);
  const [busy, setBusy] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const deckLeft = 52 - hand.length - revealed.length;
  const betNum = Math.max(0, Number(bet) || 0);
  const draw = useMemo(() => drawAnalysis(hand, revealed), [hand, revealed]);

  const pick = (c: Card) => {
    if (target === "hand") {
      setHand((h) => (h.includes(c) ? h.filter((x) => x !== c) : h.length >= 3 ? h : [...h, c]));
    } else {
      setRevealed((r) => (r.includes(c) ? r.filter((x) => x !== c) : [...r, c]));
    }
  };

  const randomTwo = () => {
    const avail = remainingDeck(revealed);
    const a = avail[Math.floor(Math.random() * avail.length)];
    const rest = avail.filter((c) => c !== a);
    const b = rest[Math.floor(Math.random() * rest.length)];
    setHand([a, b]);
    setTarget("hand");
  };

  // Monte Carlo runs off the main thread; falls back to a deferred call if Workers are unavailable.
  useEffect(() => {
    if (hand.length < 2) {
      setSim(null);
      setBusy(false);
      return;
    }
    setBusy(true);
    const params: SimParams = { role, players, threshold, rounds, hand, revealed };
    let dead = false;
    const fallback = () =>
      setTimeout(() => {
        if (dead) return;
        setSim(simulate(params));
        setBusy(false);
      }, 0);

    const timer = setTimeout(() => {
      try {
        const w = new Worker(new URL("../lib/sim.worker.ts", import.meta.url), { type: "module" });
        workerRef.current = w;
        w.onmessage = (e: MessageEvent<SimResult>) => {
          if (dead) return;
          setSim(e.data);
          setBusy(false);
        };
        w.onerror = () => {
          w.terminate();
          fallback();
        };
        w.postMessage(params);
      } catch {
        fallback();
      }
    }, 180);

    return () => {
      dead = true;
      clearTimeout(timer);
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, [role, players, threshold, rounds, hand, revealed]);

  const roleLabel = role === "banker" ? "เจ้ามือ" : "ลูกมือ";

  return (
    <main className="mx-auto max-w-[1240px] px-5 py-6 sm:px-8">
      {/* header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="gold-grad grid h-[54px] w-[54px] grid-cols-2 place-items-center gap-0.5 rounded-full p-3 text-felt-950">
            <SuitIcon suit="spade" className="h-4 w-4" />
            <SuitIcon suit="heart" className="h-4 w-4" />
            <SuitIcon suit="diamond" className="h-4 w-4" />
            <SuitIcon suit="club" className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-[28px] font-extrabold leading-none tracking-tight">
              <span className="text-gold-400">Pokdeng</span> Calculator
            </h1>
            <p className="mt-1.5 text-[13px] text-ink-muted">โอกาสชนะ · EV · ควรจั่วหรืออยู่ — จากสำรับที่เหลืออยู่จริง</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-felt-900/80 px-4 py-2 text-[13px] text-ink-muted">
          <Layers className="h-4 w-4" />
          เหลือในสำรับ <span className="font-mono font-bold text-ink">{deckLeft}</span> ใบ
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.52fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          {/* table settings */}
          <section className="panel p-6">
            <h2 className="mb-5 flex items-center gap-2.5 text-lg font-bold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-felt-900 text-gold-400">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              ตั้งค่าโต๊ะ
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <div className="field-label">บทบาทของฉัน</div>
                <Segmented<Role>
                  value={role}
                  onChange={setRole}
                  options={[
                    { value: "banker", label: <><Crown className="h-4 w-4" />เจ้ามือ</> },
                    { value: "player", label: <><User className="h-4 w-4" />ลูกมือ</> },
                  ]}
                />
              </div>
              <div>
                <div className="field-label">จำนวนคนทั้งโต๊ะ (รวมเจ้ามือ)</div>
                <div className="flex items-center justify-between rounded-xl bg-felt-900/90 p-1">
                  <button
                    type="button"
                    aria-label="ลดจำนวนคน"
                    disabled={players <= 2}
                    onClick={() => setPlayers((n) => Math.max(2, n - 1))}
                    className="grid h-10 w-10 place-items-center rounded-lg bg-felt-600 text-ink transition-colors hover:bg-felt-500 disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="text-center leading-tight">
                    <div className="font-mono text-2xl font-bold">{players}</div>
                    <div className="text-[11px] text-ink-muted">ลูกมือ {players - 1} + เจ้ามือ 1</div>
                  </div>
                  <button
                    type="button"
                    aria-label="เพิ่มจำนวนคน"
                    disabled={players >= 10}
                    onClick={() => setPlayers((n) => Math.min(10, n + 1))}
                    className="grid h-10 w-10 place-items-center rounded-lg bg-felt-600 text-ink transition-colors hover:bg-felt-500 disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-[1.25fr_1.1fr_0.7fr]">
              <div>
                <div className="field-label">คู่แข่งจั่วเมื่อแต้ม ≤</div>
                <Segmented
                  value={threshold}
                  onChange={setThreshold}
                  options={[3, 4, 5].map((v) => ({ value: v, label: `${v} แต้ม` }))}
                />
              </div>
              <div>
                <div className="field-label">จำนวนรอบจำลอง</div>
                <Segmented
                  mono
                  value={rounds}
                  onChange={setRounds}
                  options={[{ value: 20000, label: "20K" }, { value: 60000, label: "60K" }, { value: 150000, label: "150K" }]}
                />
              </div>
              <div>
                <label htmlFor="bet" className="field-label block">เดิมพัน (฿)</label>
                <input
                  id="bet"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={bet}
                  onChange={(e) => setBet(e.target.value)}
                  className="h-[46px] w-full rounded-xl border border-white/[0.06] bg-felt-900/90 px-4 font-mono font-bold text-ink"
                />
              </div>
            </div>
          </section>

          {/* my hand */}
          <section className="panel p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2.5 text-lg font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-felt-900 text-gold-400">
                  <User className="h-4 w-4" />
                </span>
                ไพ่ในมือฉัน ({roleLabel})
              </h2>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost" onClick={randomTwo}>
                  <Shuffle className="h-4 w-4" /> สุ่ม 2 ใบ
                </button>
                <button type="button" className="btn-ghost" onClick={() => setHand([])} disabled={hand.length === 0}>
                  <Eraser className="h-4 w-4" /> ล้าง
                </button>
              </div>
            </div>

            <div className="felt px-4 pb-5 pt-8">
              <div className="flex items-start justify-center gap-5">
                {[0, 1, 2].map((i) => {
                  const c = hand[i];
                  const lift = i === 1 ? "-translate-y-2" : "";
                  return c !== undefined ? (
                    <PlayingCard
                      key={c}
                      card={c}
                      size="lg"
                      className={lift}
                      onClick={() => setHand((h) => h.filter((x) => x !== c))}
                      title="แตะเพื่อเอาออก"
                    />
                  ) : (
                    <button
                      key={`slot-${i}`}
                      type="button"
                      onClick={() => setTarget("hand")}
                      className={`flex h-[142px] w-24 flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-felt-500/80 bg-black/10 text-gold-400 transition-colors hover:bg-black/20 ${lift}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="text-[10px] text-ink-muted">ใบที่ {i + 1}{i === 2 ? " (จั่วเพิ่ม)" : ""}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-6 text-center text-[13px] text-ink-muted">เลือกไพ่ 2 ใบ (หรือ 3 ใบถ้าจั่วแล้ว) จากตารางด้านล่าง</p>
            </div>
          </section>

          {/* picker */}
          <section className="panel p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2.5 text-lg font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-felt-900 text-gold-400">
                  <Layers className="h-4 w-4" />
                </span>
                เลือกไพ่
              </h2>
              <div className="flex gap-1 rounded-full bg-felt-900/90 p-1 font-mono text-[13px]">
                {([["hand", `มือฉัน ${hand.length}/3`], ["revealed", `เปิดแล้ว ${revealed.length}`]] as const).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={target === k}
                    onClick={() => setTarget(k)}
                    className={`rounded-full px-3.5 py-1.5 font-semibold transition-colors ${target === k ? "bg-felt-600 text-ink" : "text-ink-muted hover:text-ink"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* <p className="mb-4 text-[13px] text-ink-muted">
              กำลังใส่ไพ่ลงใน <span className="font-semibold text-gold-400">{target === "hand" ? "มือฉัน" : "เปิดแล้ว"}</span> · ไพ่หนึ่งใบเลือกได้ใบเดียว
            </p> */}
            <CardPicker hand={hand} revealed={revealed} target={target} onPick={pick} />
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-muted">
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-gold-400" />ในมือฉัน</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#7fa6c4]" />เปิดแล้ว</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#5b6b63]" />ใช้แล้ว (เลือกซ้ำไม่ได้)</span>
            </div>
          </section>

          {/* revealed */}
          <section className="panel p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2.5 text-lg font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-felt-900 text-gold-400">
                  <Eye className="h-4 w-4" />
                </span>
                ไพ่ที่เปิดแล้วบนโต๊ะ
              </h2>
              <button type="button" className="btn-ghost" onClick={() => setRevealed([])} disabled={revealed.length === 0}>
                <Eraser className="h-4 w-4" /> ล้าง
              </button>
            </div>
            {/* <p className="mb-4 text-[13px] text-ink-muted">เช่น ลูกมือที่ป๊อก 8/9 แล้วเปิดไพ่ — ไพ่เหล่านี้จะถูกตัดออกจากสำรับก่อนคำนวณ</p> */}
            {revealed.length === 0 ? (
              <button
                type="button"
                onClick={() => setTarget("revealed")}
                className="w-full rounded-xl border border-dashed border-white/15 px-4 py-5 text-center text-[13px] text-ink-muted transition-colors hover:bg-white/[0.03]"
              >
                ยังไม่มี — แตะเพื่อสลับไปใส่ &quot;เปิดแล้ว&quot; แล้วเลือกไพ่จากตาราง
              </button>
            ) : (
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-dashed border-white/15 p-3">
                {revealed.map((c) => (
                  <PlayingCard key={c} card={c} state="revealed" title="แตะเพื่อเอาออก" onClick={() => setRevealed((r) => r.filter((x) => x !== c))} />
                ))}
              </div>
            )}
            {/* <p className="mt-3 text-[12px] text-ink-muted">
              เหลือในสำรับ <span className="font-mono font-semibold text-ink">{deckLeft}</span> ใบ
            </p> */}
          </section>
        </div>

        <ResultPanel hand={hand} sim={sim} draw={draw} busy={busy} role={role} bet={betNum} players={players} deckLeft={deckLeft} />
      </div>
    </main>
  );
}
