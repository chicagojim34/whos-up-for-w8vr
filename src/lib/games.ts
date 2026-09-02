import type { CircleItem } from '../types';

/**
 * Online games a circle can actually play together.
 *
 * A note on "linking accounts": none of these services offer public OAuth or a
 * friend API to third parties — you cannot log a user into Words with Friends
 * or read their NYT friend list from outside. What does work, and what this
 * app does, is a handle directory: you save your username per game, the people
 * in your circles can see it, and a tap opens the game.
 *
 * The URLs are ordinary https links on purpose. On iOS and Android a universal
 * link opens the installed app and falls back to the web version otherwise,
 * which is more reliable than guessing at custom `scheme://` URLs that break
 * silently when the app is not installed.
 */

export type GamePlatform = 'iOS' | 'Android' | 'Web';

/** How a session runs, which is what decides whether it needs a start time. */
export type GameMode =
  /** One puzzle a day, everyone plays on their own and compares. */
  | 'daily'
  /** Turn-based over hours or days. No need to be online together. */
  | 'async'
  /** Everyone plays at once. This is the one that needs a time on the calendar. */
  | 'live';

/** How people get into a game with each other. */
export type JoinMethod =
  /** Add each other by username. */
  | 'handle'
  /** The host reads out a room code. */
  | 'roomCode'
  /** The host shares a one-off table or party link. */
  | 'link'
  /** No accounts involved — it runs inside a chat thread. */
  | 'share';

export interface Game {
  id: string;
  name: string;
  publisher: string;
  /** Why it works for a group of friends, in one line. */
  blurb: string;
  mode: GameMode;
  platforms: GamePlatform[];
  /** Human-readable player count. */
  players: string;
  url: string;
  joinBy: JoinMethod;
  /** What the service calls your identity. `null` when handles do not apply. */
  handleLabel: string | null;
  handleHint?: string;
  /** Anything a host should know before picking it. */
  caveat?: string;
  accent: string;
}

export const GAMES: Game[] = [
  {
    id: 'nyt',
    name: 'NYT Games',
    publisher: 'The New York Times',
    blurb: 'Wordle, Connections, Strands and the Mini. One puzzle a day, everyone compares scores.',
    mode: 'daily',
    platforms: ['iOS', 'Android', 'Web'],
    players: 'Any number, solo play',
    url: 'https://www.nytimes.com/crosswords',
    joinBy: 'handle',
    handleLabel: 'NYT name',
    handleHint: 'The name on your NYT account — it is what shows on the Mini leaderboard.',
    caveat: 'The Mini has a real friends leaderboard. For Wordle and Connections you share your result grid.',
    accent: '#1a1a1a',
  },
  {
    id: 'wwf',
    name: 'Words with Friends 2',
    publisher: 'Zynga',
    blurb: 'The classic. Play a word whenever you get a minute — games run for days.',
    mode: 'async',
    platforms: ['iOS', 'Android'],
    players: '2 per game',
    url: 'https://www.wordswithfriends.com/',
    joinBy: 'handle',
    handleLabel: 'Words username',
    handleHint: 'Your in-game username, not your email.',
    accent: '#d5372b',
  },
  {
    id: 'chesscom',
    name: 'Chess.com',
    publisher: 'Chess.com',
    blurb: 'Daily (correspondence) chess gives you 24 hours a move. Clubs keep a circle ladder.',
    mode: 'async',
    platforms: ['iOS', 'Android', 'Web'],
    players: '2 per game',
    url: 'https://www.chess.com/play/online',
    joinBy: 'handle',
    handleLabel: 'Chess.com username',
    accent: '#7fa650',
  },
  {
    id: 'lichess',
    name: 'Lichess',
    publisher: 'Lichess',
    blurb: 'Same idea as Chess.com, free and ad-free. Good if someone objects to a paywall.',
    mode: 'async',
    platforms: ['iOS', 'Android', 'Web'],
    players: '2 per game',
    url: 'https://lichess.org',
    joinBy: 'handle',
    handleLabel: 'Lichess username',
    accent: '#4a4a4a',
  },
  {
    id: 'bga',
    name: 'Board Game Arena',
    publisher: 'BGA',
    blurb: 'Hundreds of real board games — Carcassonne, 7 Wonders, Yahtzee. Turn-based or live.',
    mode: 'async',
    platforms: ['iOS', 'Android', 'Web'],
    players: '2–8 depending on the game',
    url: 'https://boardgamearena.com',
    joinBy: 'handle',
    handleLabel: 'BGA username',
    caveat: 'Some games need one player with a premium account to host.',
    accent: '#1f6fb2',
  },
  {
    id: 'jackbox',
    name: 'Jackbox Party Pack',
    publisher: 'Jackbox Games',
    blurb: 'One person shares a screen, everyone else plays on their phone with a room code.',
    mode: 'live',
    platforms: ['iOS', 'Android', 'Web'],
    players: '3–8',
    url: 'https://jackbox.tv',
    joinBy: 'roomCode',
    handleLabel: null,
    caveat: 'One person has to own the pack and share their screen. Works well on a video call.',
    accent: '#e6266b',
  },
  {
    id: 'discord',
    name: 'Discord Activities',
    publisher: 'Discord',
    blurb: 'Chess in the Park, Poker Night and Gartic Phone, launched straight inside a voice call.',
    mode: 'live',
    platforms: ['iOS', 'Android', 'Web'],
    players: '2–10',
    url: 'https://discord.com',
    joinBy: 'handle',
    handleLabel: 'Discord username',
    accent: '#5865f2',
  },
  {
    id: 'geoguessr',
    name: 'GeoGuessr',
    publisher: 'GeoGuessr',
    blurb: 'Dropped somewhere on Street View, guess where. Party mode runs off a single link.',
    mode: 'live',
    platforms: ['iOS', 'Android', 'Web'],
    players: '2–10',
    url: 'https://www.geoguessr.com',
    joinBy: 'link',
    handleLabel: null,
    caveat: 'The host needs a paid plan to start a party.',
    accent: '#4a9b5e',
  },
  {
    id: 'gamepigeon',
    name: 'GamePigeon',
    publisher: 'Vitalii Zlotskii',
    blurb: '8 Ball, Cup Pong and Anagrams, played inside an iMessage thread. No accounts at all.',
    mode: 'async',
    platforms: ['iOS'],
    players: '2 per game',
    url: 'https://apps.apple.com/app/gamepigeon/id1152211602',
    joinBy: 'share',
    handleLabel: null,
    caveat: 'iPhone only. Anyone on Android in the circle is left out.',
    accent: '#34c759',
  },
  {
    id: 'duolingo',
    name: 'Duolingo',
    publisher: 'Duolingo',
    blurb: 'Friend quests and weekly leagues turn a language streak into a circle competition.',
    mode: 'daily',
    platforms: ['iOS', 'Android', 'Web'],
    players: 'Any number',
    url: 'https://www.duolingo.com',
    joinBy: 'handle',
    handleLabel: 'Duolingo username',
    accent: '#58cc02',
  },
  {
    id: 'pokemongo',
    name: 'Pokémon GO',
    publisher: 'Niantic',
    blurb: 'Friend codes, gift swaps and remote raids. The one that gets people outdoors.',
    mode: 'async',
    platforms: ['iOS', 'Android'],
    players: 'Any number',
    url: 'https://pokemongolive.com',
    joinBy: 'handle',
    handleLabel: 'Trainer code',
    handleHint: 'The 12-digit code from your profile screen.',
    accent: '#f4a121',
  },
  {
    id: 'marvelsnap',
    name: 'Marvel Snap',
    publisher: 'Second Dinner',
    blurb: 'Card duels that finish in three minutes. Good for a quick round between other things.',
    mode: 'live',
    platforms: ['iOS', 'Android', 'Web'],
    players: '2 per game',
    url: 'https://www.marvelsnap.com',
    joinBy: 'handle',
    handleLabel: 'Snap nickname',
    accent: '#e62429',
  },
];

export const GAMES_BY_ID: Record<string, Game> = Object.fromEntries(
  GAMES.map(g => [g.id, g])
);

export function findGame(id: string | undefined): Game | undefined {
  return id ? GAMES_BY_ID[id] : undefined;
}

/** Only live games need everyone in the same place on the clock. */
export function needsStartTime(game: Game): boolean {
  return game.mode === 'live';
}

export const MODE_LABEL: Record<GameMode, string> = {
  daily: 'One a day',
  async: 'Play any time',
  live: 'Everyone at once',
};

export const JOIN_LABEL: Record<JoinMethod, string> = {
  handle: 'Add each other by username',
  roomCode: 'Join with a room code',
  link: 'Join with a party link',
  share: 'Runs inside your chat thread',
};

export interface GameRecommendation {
  game: Game;
  /** Circle members (excluding you) who have saved a handle for this game. */
  playerNames: string[];
  /** True when you have saved a handle too. */
  youPlay: boolean;
  reason: string;
}

/**
 * What this circle should play.
 *
 * Ranked by how many members already have a handle saved, then by how little
 * coordination the game needs — a circle that struggles to pick a restaurant
 * is not going to get eight people online at once, so async and daily games
 * outrank live ones.
 */
export function recommendForCircle(
  circle: CircleItem,
  myHandles: Record<string, string>,
  meId: string,
  limit = 4
): GameRecommendation[] {
  const modeRank: Record<GameMode, number> = { daily: 0, async: 1, live: 2 };

  const scored = GAMES.map(game => {
    const playerNames = circle.memberList
      .filter(m => m.id !== meId && m.gameHandles?.[game.id])
      .map(m => m.name);
    const youPlay = Boolean(myHandles[game.id]);
    const total = playerNames.length + (youPlay ? 1 : 0);

    let reason: string;
    if (playerNames.length >= 2) {
      reason = `${playerNames.length} people here already play`;
    } else if (playerNames.length === 1) {
      reason = `${playerNames[0]} plays this`;
    } else if (game.mode === 'daily') {
      reason = 'One puzzle a day — nobody has to be free at the same time';
    } else if (game.mode === 'async') {
      reason = 'Turn-based, so nobody has to be free at the same time';
    } else {
      reason = 'Worth putting on the calendar';
    }

    return { game, playerNames, youPlay, reason, total };
  });

  return scored
    .sort(
      (a, b) =>
        b.total - a.total ||
        modeRank[a.game.mode] - modeRank[b.game.mode] ||
        a.game.name.localeCompare(b.game.name)
    )
    .slice(0, limit)
    .map(({ game, playerNames, youPlay, reason }) => ({ game, playerNames, youPlay, reason }));
}

/** Everyone in a circle with a saved handle for a given game. */
export function playersInCircle(
  circle: CircleItem,
  gameId: string,
  meId: string
): { id: string; name: string; handle: string }[] {
  return circle.memberList
    .filter(m => m.id !== meId && m.gameHandles?.[gameId])
    .map(m => ({ id: m.id, name: m.name, handle: m.gameHandles![gameId] }));
}
