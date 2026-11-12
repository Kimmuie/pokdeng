import PlayingCard, { SuitIcon, type CardState } from "./PlayingCard";
import { SUITS, cardKey, type Card } from "@/lib/pokdeng";

export type PickTarget = "hand" | "revealed";

interface Props {
  hand: Card[];
  revealed: Card[];
  target: PickTarget;
  onPick: (card: Card) => void;
}

export default function CardPicker({ hand, revealed, target, onPick }: Props) {
  const stateOf = (c: Card): { state: CardState; disabled: boolean } => {
    const inHand = hand.includes(c);
    const inRevealed = revealed.includes(c);
    if (target === "hand") {
      if (inHand) return { state: "hand", disabled: false };
      if (inRevealed) return { state: "used", disabled: true };
    } else {
      if (inRevealed) return { state: "revealed", disabled: false };
      if (inHand) return { state: "used", disabled: true };
    }
    return { state: "default", disabled: false };
  };

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max flex-col gap-2">
        {SUITS.map((suit, s) => (
          <div key={suit} className="flex items-center gap-1.5">
            <span className={`w-5 shrink-0 ${suit === "heart" || suit === "diamond" ? "text-[#e0344a]" : "text-ink-muted"}`}>
              <SuitIcon suit={suit} className="h-[18px] w-[18px]" />
            </span>
            {Array.from({ length: 13 }, (_, i) => {
              const c = cardKey(i + 1, s);
              const { state, disabled } = stateOf(c);
              return <PlayingCard key={c} card={c} state={state} disabled={disabled} onClick={() => onPick(c)} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
