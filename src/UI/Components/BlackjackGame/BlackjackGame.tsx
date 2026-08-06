import { useState } from 'react';
import styles from './BlackjackGame.module.css';

type ResultVariant = 'win' | 'loss' | 'push';
type GamePhase = 'betting' | 'playing' | 'split1' | 'split2' | 'result';
type FinishOutcome = 'win' | 'loss' | 'push' | 'bust';

interface Card {
  rank: string;
  suit: string;
}

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const RED_SUITS = new Set(['♥', '♦']);
const RESULT_CLASS: Record<ResultVariant, string> = {
  win: styles.resultWin,
  loss: styles.resultLoss,
  push: styles.resultPush,
};

const createDeck = (): Card[] =>
  SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit }))).sort(() => Math.random() - 0.5);

const getCardValue = (card: Card): number => {
  if (card.rank === 'A') return 11;
  if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') return 10;
  return Number(card.rank);
};

const calculateHandValue = (cards: Card[]): number => {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    value += getCardValue(card);
    if (card.rank === 'A') aces++;
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
};

const canSplit = (cards: Card[]): boolean =>
  cards.length === 2 && getCardValue(cards[0]) === getCardValue(cards[1]);

const drawDealerTo17 = (dealer: Card[], remainingDeck: Card[]): { dealer: Card[]; deck: Card[] } => {
  const dealerCards = [...dealer];
  const deckCopy = [...remainingDeck];

  while (calculateHandValue(dealerCards) < 17) {
    dealerCards.push(deckCopy.pop()!);
  }

  return { dealer: dealerCards, deck: deckCopy };
};

const outcomeVsDealer = (playerValue: number, dealerValue: number): FinishOutcome => {
  if (playerValue > 21) return 'bust';
  if (dealerValue > 21) return 'win';
  if (playerValue > dealerValue) return 'win';
  if (playerValue < dealerValue) return 'loss';
  return 'push';
};

const splitHandOutcome = (
  playerValue: number,
  dealerValue: number,
  wager: number
): { label: string; payout: number } => {
  if (playerValue > 21) return { label: 'Bust', payout: 0 };
  if (dealerValue > 21) return { label: 'Win', payout: wager * 2 };
  if (playerValue > dealerValue) return { label: 'Win', payout: wager * 2 };
  if (playerValue < dealerValue) return { label: 'Loss', payout: 0 };
  return { label: 'Push', payout: wager };
};

const BlackjackGame = () => {
  const [balance, setBalance] = useState(1000);
  const [wager, setWager] = useState('');
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<GamePhase>('betting');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ text: string; variant: ResultVariant } | null>(null);
  const [split1Hand, setSplit1Hand] = useState<Card[]>([]);
  const [split2Hand, setSplit2Hand] = useState<Card[]>([]);
  const [wagerAmount, setWagerAmount] = useState(0);

  const isSplitPhase = gameState === 'split1' || gameState === 'split2';

  const activeSplitHand = (): { cards: Card[]; setCards: (cards: Card[]) => void } | null => {
    if (gameState === 'split1') return { cards: split1Hand, setCards: setSplit1Hand };
    if (gameState === 'split2') return { cards: split2Hand, setCards: setSplit2Hand };
    return null;
  };

  const dealInitialHands = () => {
    const newDeck = createDeck();
    const playerCards = [newDeck.pop()!, newDeck.pop()!];
    const dealerCards = [newDeck.pop()!, newDeck.pop()!];

    setDeck(newDeck);
    setPlayerHand(playerCards);
    setDealerHand(dealerCards);
    setGameState('playing');
    setMessage('');
    setResult(null);
  };

  const handleDeal = () => {
    const amount = Number(wager);
    if (!wager || amount <= 0 || amount > balance) {
      setMessage('Invalid wager amount');
      return;
    }

    setWagerAmount(amount);
    dealInitialHands();
  };

  const finishGame = (outcome: FinishOutcome) => {
    setGameState('result');

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealerHand);

    let newBalance = balance;
    let resultText: string;
    let variant: ResultVariant;

    if (outcome === 'bust') {
      resultText = `Bust! You lose. ${dealerValue}`;
      variant = 'loss';
      newBalance = balance - wagerAmount;
    } else if (outcome === 'win') {
      resultText = `You win! ${playerValue} vs ${dealerValue}. +$${wagerAmount * 2}`;
      variant = 'win';
      newBalance = balance + wagerAmount;
    } else if (outcome === 'loss') {
      resultText = `Dealer wins. ${dealerValue} vs ${playerValue}. -$${wagerAmount}`;
      variant = 'loss';
      newBalance = balance - wagerAmount;
    } else {
      resultText = `Push! ${playerValue} vs ${dealerValue}.`;
      variant = 'push';
    }

    setBalance(newBalance);
    setResult({ text: resultText, variant });
  };

  const finalizeSplitHands = (hand1: Card[], hand2: Card[]) => {
    const { dealer, deck: newDeck } = drawDealerTo17(dealerHand, deck);
    setDealerHand(dealer);
    setDeck(newDeck);

    const dealerValue = calculateHandValue(dealer);
    const hand1Outcome = splitHandOutcome(calculateHandValue(hand1), dealerValue, wagerAmount);
    const hand2Outcome = splitHandOutcome(calculateHandValue(hand2), dealerValue, wagerAmount);
    const totalWin = hand1Outcome.payout + hand2Outcome.payout;

    setGameState('result');
    setBalance(balance - wagerAmount * 2 + totalWin);

    const variant: ResultVariant =
      totalWin > wagerAmount * 2 ? 'win' : totalWin === wagerAmount * 2 ? 'push' : 'loss';
    setResult({
      text: `Hand 1: ${hand1Outcome.label} | Hand 2: ${hand2Outcome.label}`,
      variant,
    });
  };

  const dealerPlay = () => {
    const { dealer, deck: newDeck } = drawDealerTo17(dealerHand, deck);
    setDealerHand(dealer);
    setDeck(newDeck);

    const playerValue = calculateHandValue(playerHand);
    const dealerValue = calculateHandValue(dealer);
    finishGame(outcomeVsDealer(playerValue, dealerValue));
  };

  const hit = () => {
    if (deck.length === 0) return;

    const splitHand = activeSplitHand();
    const currentHand = splitHand?.cards ?? playerHand;
    const setCurrentHand = splitHand?.setCards ?? setPlayerHand;

    const newDeck = [...deck];
    const newCard = newDeck.pop()!;
    const newHand = [...currentHand, newCard];

    setCurrentHand(newHand);
    setDeck(newDeck);

    if (calculateHandValue(newHand) <= 21) return;

    if (gameState === 'split1') {
      setGameState('split2');
      return;
    }
    if (gameState === 'split2') {
      finalizeSplitHands(split1Hand, newHand);
      return;
    }
    finishGame('bust');
  };

  const stand = () => {
    if (gameState === 'split1') {
      setGameState('split2');
      return;
    }
    if (gameState === 'split2') {
      finalizeSplitHands(split1Hand, split2Hand);
      return;
    }
    dealerPlay();
  };

  const handleSplit = () => {
    if (!canSplit(playerHand)) return;

    setSplit1Hand([playerHand[0]]);
    setSplit2Hand([playerHand[1]]);
    setGameState('split1');
    setMessage('Playing first split hand');
  };

  const nextHand = () => {
    setGameState('betting');
    setPlayerHand([]);
    setDealerHand([]);
    setSplit1Hand([]);
    setSplit2Hand([]);
    setWager('');
    setMessage('');
    setResult(null);
  };

  const renderCard = (card: Card) => {
    const suitClass = RED_SUITS.has(card.suit) ? styles.cardRed : styles.cardBlack;
    return (
      <div className={`${styles.card} ${suitClass}`}>
        <div>{card.rank}</div>
        <div>{card.suit}</div>
      </div>
    );
  };

  const renderHand = (
    label: string,
    cards: Card[],
    meta: string,
    options?: { center?: boolean; large?: boolean }
  ) => (
    <div className={options?.large ? styles.sectionLarge : styles.section}>
      <div className={styles.handLabel}>{label}</div>
      <div className={`${styles.cardRow}${options?.center ? ` ${styles.cardRowCenter}` : ''}`}>
        {cards.map((card, i) => (
          <div key={i}>{renderCard(card)}</div>
        ))}
      </div>
      <div className={styles.handMeta}>{meta}</div>
    </div>
  );

  const handsInPlay = isSplitPhase
    ? gameState === 'split1'
      ? [{ label: 'Split Hand 1', cards: split1Hand }]
      : [
          { label: 'Split Hand 1', cards: split1Hand },
          { label: 'Split Hand 2', cards: split2Hand },
        ]
    : [{ label: 'Your Hand', cards: playerHand }];

  const activeHandCards =
    gameState === 'split1' ? split1Hand : gameState === 'split2' ? split2Hand : playerHand;

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Blackjack</h1>

        <div className={styles.balance}>Balance: ${balance}</div>

        {gameState === 'betting' && (
          <div className={styles.bettingPanel}>
            <div className={styles.bettingLabel}>Enter wager amount</div>
            <div className={styles.bettingRow}>
              <input
                type="number"
                value={wager}
                onChange={(e) => setWager(e.target.value)}
                placeholder="Wager amount"
                className={styles.input}
              />
              <button type="button" onClick={handleDeal} className={`${styles.button} ${styles.buttonWide}`}>
                Deal
              </button>
            </div>
            {message ? <div className={styles.errorMessage}>{message}</div> : null}
          </div>
        )}

        {gameState !== 'betting' && gameState !== 'result' && (
          <>
            {renderHand('Dealer', dealerHand, `Showing: ${calculateHandValue([dealerHand[0]])}`, {
              large: true,
            })}

            {isSplitPhase &&
              handsInPlay.map(({ label, cards }) =>
                renderHand(label, cards, `Total: ${calculateHandValue(cards)}`)
              )}

            {!isSplitPhase &&
              renderHand('Your Hand', playerHand, `Total: ${calculateHandValue(playerHand)}`)}

            {isSplitPhase &&
              renderHand('Your Hand', activeHandCards, `Total: ${calculateHandValue(activeHandCards)}`)}

            <div className={styles.actions}>
              <button type="button" onClick={hit} className={styles.button}>
                Hit
              </button>
              <button type="button" onClick={stand} className={styles.button}>
                Stand
              </button>
              {gameState === 'playing' && canSplit(playerHand) ? (
                <button type="button" onClick={handleSplit} className={styles.button}>
                  Split
                </button>
              ) : null}
            </div>

            <div className={styles.wagerInfo}>Wagered: ${wagerAmount}</div>
          </>
        )}

        {gameState === 'result' && (
          <div className={styles.resultPanel}>
            {renderHand('Dealer', dealerHand, `Total: ${calculateHandValue(dealerHand)}`, {
              center: true,
              large: true,
            })}

            {split1Hand.length > 0 ? (
              <>
                {renderHand('Split Hand 1', split1Hand, `Total: ${calculateHandValue(split1Hand)}`, {
                  center: true,
                })}
                {renderHand('Split Hand 2', split2Hand, `Total: ${calculateHandValue(split2Hand)}`, {
                  center: true,
                })}
              </>
            ) : (
              renderHand('Your Hand', playerHand, `Total: ${calculateHandValue(playerHand)}`, { center: true })
            )}

            {result ? (
              <div className={`${styles.resultText} ${RESULT_CLASS[result.variant]}`}>{result.text}</div>
            ) : null}

            <button type="button" onClick={nextHand} className={`${styles.button} ${styles.buttonWide}`}>
              Next Hand
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlackjackGame;
