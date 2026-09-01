import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Share2, Phone, Users, Check, UserPlus, ChevronRight, Lock, Globe } from 'lucide-react';
import cx from 'classnames';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { GlassModal } from '../components/GlassModal';
import { ShareSheet } from '../components/ShareSheet';
import { AvatarGroup } from '../components/AvatarGroup';
import { Avatar } from '../components/Avatar';
import type { CircleItem } from '../types';

const CATEGORY_TAGS = [
  { value: 'FRIENDS', label: 'Friends & social' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'FITNESS', label: 'Fitness & sports' },
  { value: 'CAMPUS', label: 'Campus & college' },
  { value: 'CULTURE', label: 'Culture & arts' },
  { value: 'WORK', label: 'Professional & work' },
];

export default function Circles() {
  const navigate = useNavigate();
  const { circles, contacts, joinCircle, createCircle, inviteContact } = useApp();
  const toast = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryTag, setCategoryTag] = useState('FRIENDS');
  const [isPrivate, setIsPrivate] = useState(true);
  const [inviteIds, setInviteIds] = useState<string[]>([]);

  const [shareTarget, setShareTarget] = useState<CircleItem | null>(null);
  const [contactsOpen, setContactsOpen] = useState(false);

  const joined = circles.filter(c => c.isJoined);
  const discoverable = circles.filter(c => !c.isJoined);
  const featured = joined[0];
  const matchedContacts = contacts.filter(c => c.isOnW8VR).length;

  const toggleInvite = (id: string) =>
    setInviteIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const handleCreate = () => {
    if (!name.trim()) return;
    const circle = createCircle({
      name,
      description,
      categoryTag,
      isPrivate,
      inviteIds,
    });
    setCreateOpen(false);
    setName('');
    setDescription('');
    setInviteIds([]);
    toast.show(
      inviteIds.length > 0
        ? `${circle.name} created — ${inviteIds.length} invited`
        : `${circle.name} created`
    );
    navigate(`/circle/${circle.id}`);
  };

  const memberCount = (c: CircleItem) => c.memberList.length + c.extraMembers;

  return (
    <div className="flex flex-col pb-28 px-6 bg-surface animate-fade-in max-w-4xl mx-auto w-full">
      <header className="mt-4 mb-6">
        <h1 className="font-headline font-black text-3xl text-text-dark">My circles</h1>
        <p className="text-text-medium text-sm mt-1">
          Private friend groups, sports rosters and community squads.
        </p>
      </header>

      {/* Joined circles */}
      <section className="grid grid-cols-1 @2xl:grid-cols-12 gap-4">
        <h2 className="sr-only-text">Circles you are in</h2>

        {featured && (
          <article className="@2xl:col-span-12 card p-6 relative overflow-hidden">
            <span
              className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-15 pointer-events-none"
              style={{
                background: `conic-gradient(from 0deg, ${featured.color} 0%, ${featured.color} 72%, var(--color-secondary) 72%, var(--color-secondary) 100%)`,
              }}
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <span className="badge bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                  Most active
                </span>
                <span className="flex items-center gap-2">
                  <AvatarGroup
                    names={featured.memberList.map(m => m.name)}
                    size={28}
                    max={3}
                    label={`${memberCount(featured)} members`}
                  />
                  <span className="text-xs font-bold text-text-medium">
                    {memberCount(featured)} members
                  </span>
                </span>
              </div>

              <h3 className="font-headline font-black text-2xl text-text-dark mt-1">
                <button
                  onClick={() => navigate(`/circle/${featured.id}`)}
                  className="text-left hover:text-primary transition-colors"
                >
                  {featured.name}
                </button>
              </h3>
              <p className="text-sm text-text-medium">{featured.description}</p>

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => navigate(`/circle/${featured.id}`)}
                  className="btn btn-primary flex-1 min-w-40 py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  Open circle <ChevronRight size={15} aria-hidden="true" />
                </button>
                <button
                  onClick={() => setShareTarget(featured)}
                  className="btn btn-secondary py-2.5 px-4 text-xs flex items-center gap-2"
                >
                  <Share2 size={15} aria-hidden="true" /> Invite
                </button>
              </div>
            </div>
          </article>
        )}

        {joined.slice(1).map(circle => (
          <article
            key={circle.id}
            className="@2xl:col-span-4 card p-5 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-3">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-headline font-bold text-sm shrink-0"
                  style={{ background: circle.color }}
                  aria-hidden="true"
                >
                  {circle.name[0]}
                </span>
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">
                  {circle.categoryTag}
                </span>
              </div>
              <h3 className="font-headline font-bold text-base text-text-dark">
                <button
                  onClick={() => navigate(`/circle/${circle.id}`)}
                  className="text-left hover:text-primary transition-colors"
                >
                  {circle.name}
                </button>
              </h3>
              <p className="text-xs text-text-medium mt-0.5 line-clamp-2">{circle.description}</p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-text-light">
                {memberCount(circle)} members
              </span>
              <button
                onClick={() => setShareTarget(circle)}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <Share2 size={12} aria-hidden="true" /> Invite
              </button>
            </div>
          </article>
        ))}
      </section>

      <button
        onClick={() => setCreateOpen(true)}
        className="btn btn-primary w-full mt-6 py-4 flex items-center justify-center gap-2 text-base rounded-2xl"
      >
        <Plus size={20} aria-hidden="true" /> Create a new circle
      </button>

      {/* Contact sync */}
      <section className="mt-10 rounded-3xl primary-gradient text-white p-8 relative overflow-hidden shadow-xl">
        <span className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none" aria-hidden="true">
          <Phone size={180} />
        </span>
        <div className="relative z-10 max-w-[85%]">
          <span className="badge bg-white/20 text-white text-[10px] uppercase font-bold tracking-widest mb-3">
            Contact sync
          </span>
          <h2 className="font-headline font-extrabold text-2xl text-white">Find your people</h2>
          <p className="text-sm mt-2 text-white/90 leading-relaxed mb-6">
            Match your address book against W8VR. We compare hashes, never upload your contacts.
          </p>
          <button
            onClick={() => setContactsOpen(true)}
            className="btn bg-surface-lowest text-primary-container px-8 py-3 rounded-full text-sm"
          >
            Find friends
          </button>
        </div>
      </section>

      {/* Discover */}
      <section className="mt-12">
        <div className="flex justify-between items-center gap-3 mb-4">
          <h2 className="font-headline font-bold text-2xl text-text-dark">Discover communities</h2>
          <span className="text-xs font-bold text-text-light uppercase tracking-wider">
            {discoverable.length} suggestions
          </span>
        </div>

        <ul className="grid grid-cols-1 @2xl:grid-cols-3 gap-4 list-none">
          {discoverable.map(circle => (
            <li key={circle.id}>
              <article className="card p-4 flex items-center gap-4 h-full">
                <span
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-headline font-black text-lg shrink-0"
                  style={{ background: circle.color }}
                  aria-hidden="true"
                >
                  {circle.name[0]}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 text-[10px] font-bold text-text-medium mb-0.5">
                    <span className="bg-surface-high px-1.5 py-0.5 rounded uppercase">
                      {circle.categoryTag}
                    </span>
                    <span className="flex items-center gap-1 text-secondary">
                      <Users size={11} aria-hidden="true" /> {memberCount(circle)}
                    </span>
                  </span>
                  <span className="block font-bold text-sm text-text-dark leading-tight truncate">
                    <button
                      onClick={() => navigate(`/circle/${circle.id}`)}
                      className="hover:text-primary transition-colors text-left"
                    >
                      {circle.name}
                    </button>
                  </span>
                  <span className="block text-xs text-text-light truncate mt-0.5">
                    {circle.description}
                  </span>
                </span>
                <button
                  onClick={() => {
                    joinCircle(circle.id);
                    toast.show(`You joined ${circle.name}`);
                  }}
                  className="w-9 h-9 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center hover:bg-primary hover:text-white transition-all shrink-0 shadow-sm"
                  aria-label={`Join ${circle.name}`}
                >
                  <Plus size={18} aria-hidden="true" />
                </button>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* Create circle */}
      <GlassModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a circle"
        subtitle="Group people once, then invite the whole circle in a tap"
        maxWidth="lg"
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            handleCreate();
          }}
        >
          <div>
            <label htmlFor="circle-name" className="text-xs font-bold text-text-medium mb-1.5 block">
              Circle name
            </label>
            <input
              id="circle-name"
              type="text"
              required
              placeholder="e.g. Weekend Runners, Book Club"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field font-bold text-base"
            />
          </div>

          <div>
            <label htmlFor="circle-desc" className="text-xs font-bold text-text-medium mb-1.5 block">
              What is it for?
            </label>
            <textarea
              id="circle-desc"
              rows={2}
              placeholder="Sunday long runs and a coffee after."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-field text-sm"
            />
          </div>

          <div>
            <label htmlFor="circle-tag" className="text-xs font-bold text-text-medium mb-1.5 block">
              Category
            </label>
            <select
              id="circle-tag"
              value={categoryTag}
              onChange={e => setCategoryTag(e.target.value)}
              className="input-field text-sm"
            >
              {CATEGORY_TAGS.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="border-0 p-0 m-0">
            <legend className="text-xs font-bold text-text-medium mb-1.5">Who can join</legend>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                aria-pressed={isPrivate}
                className={cx('flex-1 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors', {
                  'bg-primary text-white': isPrivate,
                  'bg-surface-low text-text-medium hover:bg-surface-high': !isPrivate,
                })}
              >
                <Lock size={14} aria-hidden="true" /> Invite only
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                aria-pressed={!isPrivate}
                className={cx('flex-1 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors', {
                  'bg-primary text-white': !isPrivate,
                  'bg-surface-low text-text-medium hover:bg-surface-high': isPrivate,
                })}
              >
                <Globe size={14} aria-hidden="true" /> Anyone can join
              </button>
            </div>
          </fieldset>

          <fieldset className="border-0 p-0 m-0">
            <legend className="text-xs font-bold text-text-medium mb-1.5">
              Invite people {inviteIds.length > 0 && `(${inviteIds.length} selected)`}
            </legend>
            <ul className="flex flex-wrap gap-2 list-none">
              {contacts.map(contact => {
                const selected = inviteIds.includes(contact.id);
                return (
                  <li key={contact.id}>
                    <button
                      type="button"
                      onClick={() => toggleInvite(contact.id)}
                      aria-pressed={selected}
                      className={cx(
                        'flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-bold transition-colors',
                        selected
                          ? 'bg-primary-fixed text-primary-container'
                          : 'bg-surface-low text-text-medium hover:bg-surface-high'
                      )}
                    >
                      <Avatar name={contact.name} size={24} ringColor="transparent" />
                      {contact.name}
                      {selected && <Check size={13} aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <button type="submit" disabled={!name.trim()} className="btn btn-primary w-full py-3.5 mt-2">
            Create circle
          </button>
        </form>
      </GlassModal>

      <ShareSheet
        isOpen={shareTarget !== null}
        onClose={() => setShareTarget(null)}
        title={`Invite to ${shareTarget?.name ?? 'circle'}`}
        subtitle="Scan the code or send the link"
        url={`${window.location.origin}/circle/${shareTarget?.id ?? ''}`}
        shareText={`Join ${shareTarget?.name ?? 'my circle'} on W8VR`}
      />

      {/* Contact sync */}
      <GlassModal
        isOpen={contactsOpen}
        onClose={() => setContactsOpen(false)}
        title="Matched contacts"
        subtitle={`${matchedContacts} of your ${contacts.length} contacts are already on W8VR`}
      >
        <ul className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto list-none pr-1">
          {contacts.map(contact => (
            <li
              key={contact.id}
              className="flex items-center justify-between gap-3 p-3 bg-surface-low rounded-2xl"
            >
              <span className="flex items-center gap-3 min-w-0">
                <Avatar name={contact.name} size={40} />
                <span className="min-w-0">
                  <span className="font-bold text-sm text-text-dark flex items-center gap-1.5 flex-wrap">
                    {contact.name}
                    {contact.isOnW8VR && (
                      <span className="badge bg-primary-fixed text-primary-container text-[9px] py-0 px-1.5 font-bold">
                        ON W8VR
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-text-light">{contact.phone}</span>
                </span>
              </span>

              {contact.isInvited ? (
                <span className="text-xs font-bold text-secondary flex items-center gap-1 shrink-0">
                  <Check size={14} aria-hidden="true" /> Invited
                </span>
              ) : (
                <button
                  onClick={() => {
                    inviteContact(contact.id);
                    toast.show(`Invite sent to ${contact.name}`);
                  }}
                  className="btn btn-outline text-xs py-1.5 px-3 rounded-full shrink-0 flex items-center gap-1"
                >
                  <UserPlus size={13} aria-hidden="true" />
                  {contact.isOnW8VR ? 'Add' : 'Invite'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </GlassModal>
    </div>
  );
}
