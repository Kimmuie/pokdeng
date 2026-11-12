import { RANK_LABELS, SUITS, isRed, rankOf, suitOf, type SuitName } from "@/lib/pokdeng";

export function SuitIcon({ suit, className = "w-4 h-4" }: { suit: SuitName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      {suit === "heart" && (
        <path d="M12 21s-8.5-5.6-8.5-11.2C3.5 6.6 5.8 4.5 8.3 4.5c1.5 0 2.9.8 3.7 2.1.8-1.3 2.2-2.1 3.7-2.1 2.5 0 4.8 2.1 4.8 5.3C20.5 15.4 12 21 12 21z" />
      )}
      {suit === "diamond" && <path d="M12 2l7 10-7 10-7-10z" />}
      {suit === "spade" && (
        <path d="M12 2C9 6.5 3.5 9.5 3.5 14.2c0 2.6 2 4.3 4.3 4.3 1.6 0 2.8-.7 3.6-1.8-.1 1.9-.8 3.3-2.2 4.3h5.6c-1.4-1-2.1-2.4-2.2-4.3.8 1.1 2 1.8 3.6 1.8 2.3 0 4.3-1.7 4.3-4.3C20.5 9.5 15 6.5 12 2z" />
      )}
      {suit === "club" && (
        <>
          <circle cx="12" cy="7.2" r="4.3" />
          <circle cx="6.8" cy="13.6" r="4.3" />
          <circle cx="17.2" cy="13.6" r="4.3" />
          <path d="M12 12c0 4-.8 6.8-2.8 9.2h5.6C12.8 18.8 12 16 12 12z" />
        </>
      )}
    </svg>
  );
}

export type CardState = "default" | "hand" | "revealed" | "used";
type Size = "sm" | "lg";

interface Props {
  card: number;
  size?: Size;
  state?: CardState;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
}

const RING: Record<CardState, string> = {
  default: "",
  hand: "ring-2 ring-gold-400 shadow-[0_0_14px_rgba(240,194,79,0.45)] -translate-y-0.5",
  revealed: "ring-2 ring-[#7fa6c4] shadow-[0_0_12px_rgba(127,166,196,0.35)] -translate-y-0.5",
  used: "opacity-40 grayscale",
};

export default function PlayingCard({ card, size = "sm", state = "default", onClick, disabled, title, className = "" }: Props) {
  const suit = SUITS[suitOf(card)];
  const rank = RANK_LABELS[rankOf(card) - 1];
  const color = isRed(card) ? "text-[#d6283b]" : "text-[#1b2430]";
  const base = "relative select-none rounded-[10px] bg-[#faf6ea] transition-all duration-150 shadow-[0_2px_6px_rgba(0,0,0,0.35)]";
  const interactive = onClick && !disabled ? "cursor-pointer hover:-translate-y-0.5" : disabled ? "cursor-not-allowed" : "";

  if (size === "lg") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        aria-label={`${rank} ${suit}`}
        className={`${base} ${interactive} ${RING[state]} ${color} h-[142px] w-24 rounded-xl ${className}`}
      >
        <span className="absolute left-2 top-1.5 flex flex-col items-center leading-none">
          <span className="text-[22px] font-extrabold">{rank}</span>
          <SuitIcon suit={suit} className="mt-1 h-4 w-4" />
        </span>
        <SuitIcon suit={suit} className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2" />
        <span className="absolute bottom-1.5 right-2 flex rotate-180 flex-col items-center leading-none">
          <span className="text-[22px] font-extrabold">{rank}</span>
          <SuitIcon suit={suit} className="mt-1 h-4 w-4" />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={`${rank} ${suit}`}
      aria-pressed={state === "hand" || state === "revealed"}
      className={`${base} ${interactive} ${RING[state]} ${color} flex h-[58px] w-[42px] flex-col items-center justify-start pt-1.5 leading-none ${className}`}
    >
      <span className="text-[13px] font-bold">{rank}</span>
      <SuitIcon suit={suit} className="mt-1.5 h-[11px] w-[11px]" />
    </button>
  );
}
