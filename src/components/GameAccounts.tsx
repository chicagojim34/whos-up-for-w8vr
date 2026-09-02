import React, { useState } from 'react';
import { Check, ExternalLink, X } from 'lucide-react';
import cx from 'classnames';
import { GAMES, JOIN_LABEL, MODE_LABEL } from '../lib/games';
import { GameMark, GameModeChip, PlatformList } from './GameBadge';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';

/**
 * The handle directory.
 *
 * These services have no public OAuth for third parties, so there is no real
 * "sign in with Words with Friends". Saving the username you already use is
 * the thing that actually helps: your circles can see it and add you.
 */
export const GameAccounts: React.FC = () => {
  const { user, linkGameAccount, unlinkGameAccount } = useApp();
  const toast = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const linkable = GAMES.filter(g => g.handleLabel !== null);
  const linkedCount = linkable.filter(g => user.gameHandles[g.id]).length;

  const save = (gameId: string, name: string) => {
    const value = (drafts[gameId] ?? '').trim();
    if (!value) return;
    linkGameAccount(gameId, value);
    setDrafts(prev => ({ ...prev, [gameId]: '' }));
    toast.show(`${name} username saved — your circles can see it now`);
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-text-medium max-w-prose">
        {linkedCount} of {linkable.length} saved. These are usernames your circles can read so
        they can add you in the game — not a connected login. None of these services let another
        app sign in on your behalf.
      </p>

      <ul className="flex flex-col gap-2 list-none">
        {linkable.map(game => {
          const linked = user.gameHandles[game.id];
          const draft = drafts[game.id] ?? '';

          return (
            <li key={game.id} className="p-4 bg-surface-low rounded-2xl flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <GameMark game={game} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-headline font-bold text-sm text-text-dark">
                      {game.name}
                    </span>
                    <GameModeChip label={MODE_LABEL[game.mode]} />
                    {linked && (
                      <span className="badge bg-secondary-container text-on-secondary-container text-[9px] py-0 px-2 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Check size={10} aria-hidden="true" /> Saved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-medium mt-0.5">{game.blurb}</p>
                  <PlatformList game={game} className="mt-1.5" />
                </div>
                <a
                  href={game.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-text-light hover:text-primary transition-colors shrink-0"
                  aria-label={`Open ${game.name}`}
                >
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              </div>

              {linked ? (
                <div className="flex items-center justify-between gap-3 bg-surface-lowest rounded-xl px-3 py-2">
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold text-text-light uppercase tracking-wider">
                      {game.handleLabel}
                    </span>
                    <span className="block font-mono text-sm text-text-dark truncate">
                      {linked}
                    </span>
                  </span>
                  <button
                    onClick={() => {
                      unlinkGameAccount(game.id);
                      toast.show(`${game.name} username removed`, 'info');
                    }}
                    className="btn btn-ghost text-xs font-bold shrink-0 flex items-center gap-1"
                  >
                    <X size={13} aria-hidden="true" /> Remove
                  </button>
                </div>
              ) : (
                <form
                  className="flex gap-2"
                  onSubmit={e => {
                    e.preventDefault();
                    save(game.id, game.name);
                  }}
                >
                  <label htmlFor={`handle-${game.id}`} className="sr-only-text">
                    {game.handleLabel} for {game.name}
                  </label>
                  <input
                    id={`handle-${game.id}`}
                    type="text"
                    value={draft}
                    onChange={e => setDrafts(prev => ({ ...prev, [game.id]: e.target.value }))}
                    placeholder={game.handleLabel ?? ''}
                    className="input-field text-sm py-2.5 flex-1"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className={cx('btn text-xs px-4 shrink-0', draft.trim() ? 'btn-primary' : 'bg-surface-high text-text-light')}
                  >
                    Save
                  </button>
                </form>
              )}

              <p className="text-[11px] text-text-light">
                {game.handleHint ?? JOIN_LABEL[game.joinBy]}
                {game.caveat && <span className="block mt-0.5 italic">{game.caveat}</span>}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
