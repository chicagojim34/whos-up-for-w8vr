import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, ExternalLink, Copy, ChevronRight } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { GlassModal } from './GlassModal';
import { GameMark, GameModeChip, PlatformList } from './GameBadge';
import { Avatar } from './Avatar';
import { JOIN_LABEL, MODE_LABEL, playersInCircle, recommendForCircle, type Game } from '../lib/games';
import { ME, type CircleItem } from '../types';

/**
 * "Play together" for a circle.
 *
 * Ranked by how many people here already have a handle saved, then by how
 * little coordination the game needs — a circle that struggles to pick a
 * restaurant will not get eight people online at once, so daily and
 * turn-based games come first.
 */
export const CirclePlaySection: React.FC<{ circle: CircleItem }> = ({ circle }) => {
  const { user } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [openGame, setOpenGame] = useState<Game | null>(null);

  const recommendations = useMemo(
    () => recommendForCircle(circle, user.gameHandles, ME),
    [circle, user.gameHandles]
  );

  const roster = openGame ? playersInCircle(circle, openGame.id, ME) : [];

  const copyHandle = async (handle: string, name: string) => {
    try {
      await navigator.clipboard.writeText(handle);
      toast.show(`${name}'s username copied`);
    } catch {
      toast.show('Could not copy — select the username and copy it manually', 'warning');
    }
  };

  return (
    <section className="mb-10">
      <h2 className="font-headline font-bold text-xl text-text-dark flex items-center gap-2 mb-1">
        <Gamepad2 size={19} className="text-primary" aria-hidden="true" /> Play together
      </h2>
      <p className="text-xs text-text-medium mb-4 max-w-prose">
        Games this circle can play without getting everyone in one room.{' '}
        <Link to="/settings" className="text-primary font-semibold hover:underline">
          Save your usernames
        </Link>{' '}
        so they can add you.
      </p>

      <ul className="grid grid-cols-1 @xl:grid-cols-2 gap-3 list-none">
        {recommendations.map(({ game, playerNames, youPlay, reason }) => (
          <li key={game.id}>
            <button
              onClick={() => setOpenGame(game)}
              className="card w-full p-4 flex items-start gap-3 text-left h-full group"
            >
              <GameMark game={game} size={44} />
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <span className="font-headline font-bold text-sm text-text-dark group-hover:text-primary transition-colors">
                    {game.name}
                  </span>
                  <GameModeChip label={MODE_LABEL[game.mode]} />
                </span>
                <span className="block text-xs text-text-medium mt-1 line-clamp-2">
                  {game.blurb}
                </span>
                <span className="flex items-center gap-2 mt-2 flex-wrap">
                  {playerNames.length > 0 && (
                    <span className="flex items-center gap-1">
                      {playerNames.slice(0, 3).map(n => (
                        <Avatar key={n} name={n} size={20} ringColor="transparent" />
                      ))}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-secondary">
                    {reason}
                    {youPlay && playerNames.length > 0 && ' · you too'}
                  </span>
                </span>
              </span>
              <ChevronRight
                size={16}
                className="text-text-light shrink-0 mt-1 group-hover:text-primary transition-colors"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>

      <GlassModal
        isOpen={openGame !== null}
        onClose={() => setOpenGame(null)}
        title={openGame?.name ?? ''}
        subtitle={openGame ? `${openGame.publisher} · ${openGame.players}` : undefined}
      >
        {openGame && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <GameMark game={openGame} size={48} />
              <div className="min-w-0">
                <GameModeChip label={MODE_LABEL[openGame.mode]} />
                <PlatformList game={openGame} className="mt-1.5" />
              </div>
            </div>

            <p className="text-sm text-text-medium leading-relaxed">{openGame.blurb}</p>

            <p className="text-xs text-text-medium p-3 bg-surface-low rounded-xl">
              <span className="font-bold text-text-dark">{JOIN_LABEL[openGame.joinBy]}.</span>
              {openGame.caveat && <span className="block mt-1">{openGame.caveat}</span>}
            </p>

            {openGame.handleLabel && (
              <div>
                <h3 className="text-xs font-bold text-text-medium mb-2">
                  Who plays this in {circle.name}
                </h3>
                {roster.length === 0 ? (
                  <p className="text-xs text-text-light p-3 bg-surface-low rounded-xl">
                    Nobody here has saved a {openGame.handleLabel} yet. Be the first and they will
                    see it.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2 list-none max-h-48 overflow-y-auto">
                    {roster.map(person => (
                      <li
                        key={person.id}
                        className="flex items-center gap-3 p-2 bg-surface-low rounded-xl"
                      >
                        <Avatar name={person.name} size={30} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold text-xs text-text-dark truncate">
                            {person.name}
                          </span>
                          <span className="block font-mono text-[11px] text-text-medium truncate">
                            {person.handle}
                          </span>
                        </span>
                        <button
                          onClick={() => copyHandle(person.handle, person.name)}
                          className="btn btn-ghost text-[11px] font-bold shrink-0 flex items-center gap-1"
                        >
                          <Copy size={12} aria-hidden="true" /> Copy
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!user.gameHandles[openGame.id] && (
                  <Link
                    to="/settings"
                    className="block text-xs text-primary font-semibold hover:underline mt-2"
                  >
                    Add your {openGame.handleLabel} →
                  </Link>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <a
                href={openGame.url}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-primary flex-1 py-3 flex items-center justify-center gap-2"
              >
                <ExternalLink size={15} aria-hidden="true" /> Open {openGame.name}
              </a>
              <button
                onClick={() => {
                  setOpenGame(null);
                  navigate('/post');
                }}
                className="btn btn-secondary py-3 px-4"
              >
                Set up a session
              </button>
            </div>

            <p className="text-[11px] text-text-light text-center">
              Opens the app if you have it installed, the website if not.
            </p>
          </div>
        )}
      </GlassModal>
    </section>
  );
};
