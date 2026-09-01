import { useState } from 'react';
import { 
  Plus, 
  Share2, 
  QrCode, 
  Phone, 
  Users, 
  Check, 
  Lock, 
  Globe, 
  Sparkles, 
  UserPlus, 
  Send 
} from 'lucide-react';
import cx from 'classnames';
import { useApp, type CircleItem } from '../context/AppContext';
import { GlassModal } from '../components/GlassModal';
import { AvatarGroup } from '../components/AvatarGroup';

export default function Circles() {
  const { circles, contacts, joinCircle, createCircle, inviteContact } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDesc, setNewCircleDesc] = useState('');
  const [newCircleCategory, setNewCircleCategory] = useState('FRIENDS');

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeCircleForShare, setActiveCircleForShare] = useState<CircleItem | null>(null);

  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);

  const myJoinedCircles = circles.filter(c => c.isJoined);
  const discoverCircles = circles.filter(c => !c.isJoined);

  const handleCreateCircle = () => {
    if (!newCircleName.trim()) return;
    createCircle(newCircleName, newCircleDesc, newCircleCategory);
    setNewCircleName('');
    setNewCircleDesc('');
    setIsCreateModalOpen(false);
  };

  const openShare = (circle: CircleItem) => {
    setActiveCircleForShare(circle);
    setIsShareModalOpen(true);
  };

  return (
    <div className="flex-col pb-28 px-6 bg-surface animate-fade-in max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mt-4 mb-6">
        <h1 className="font-headline font-black text-3xl text-text-dark">My Circles</h1>
        <p className="text-text-medium text-sm mt-1">
          Manage your private friend groups, sports rosters, and community squads.
        </p>
      </div>

      {/* Bento Grid: My Circles */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Featured Circle Card */}
        {myJoinedCircles.length > 0 && (
          <div className="md:col-span-12 card p-6 relative overflow-hidden bg-surface-lowest shadow-md border border-white/80">
            <div
              className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-15 pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, var(--primary) 0%, var(--primary) 75%, #416656 75%, #416656 100%)',
              }}
            />

            <div className="relative z-10 flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="badge bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                  {myJoinedCircles[0].active ? 'Active Circle' : 'Circle'}
                </span>
                <div className="flex items-center gap-2">
                  <AvatarGroup names={['Felix', 'Aneka', 'Jocelyn', 'Sarah']} size={28} max={3} />
                  <span className="text-xs font-bold text-text-medium">
                    {myJoinedCircles[0].members} members
                  </span>
                </div>
              </div>

              <h2 className="font-headline font-black text-2xl text-text-dark mt-1">
                {myJoinedCircles[0].name}
              </h2>
              <p className="text-sm text-text-medium">{myJoinedCircles[0].description}</p>

              <div className="flex gap-2 mt-4 pt-2 border-t border-gray-100/80">
                <button
                  onClick={() => openShare(myJoinedCircles[0])}
                  className="btn btn-secondary flex-1 py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  <Share2 size={15} /> Invite Members
                </button>
                <button
                  onClick={() => openShare(myJoinedCircles[0])}
                  className="btn btn-ghost bg-surface-high p-2.5 rounded-xl text-text-dark"
                  title="Show QR Code"
                >
                  <QrCode size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Other Joined Circles Mini Cards */}
        {myJoinedCircles.slice(1).map(circle => (
          <div
            key={circle.id}
            className="md:col-span-4 card p-5 flex flex-col justify-between bg-surface-lowest shadow-sm hover:shadow-md transition-shadow"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-headline font-bold text-sm shadow-sm"
                  style={{ background: circle.color || 'var(--primary)' }}
                >
                  {circle.name[0]}
                </div>
                <span className="text-[10px] font-bold text-text-light uppercase tracking-wider">
                  {circle.categoryTag}
                </span>
              </div>
              <h3 className="font-headline font-bold text-base text-text-dark">{circle.name}</h3>
              <p className="text-xs text-text-medium mt-0.5 line-clamp-1">{circle.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-text-light">{circle.members} Members</span>
              <button
                onClick={() => openShare(circle)}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Share2 size={12} /> Invite
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create New Circle Button */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="btn btn-primary w-full mt-6 py-4 flex items-center justify-center gap-2 text-base shadow-lg shadow-primary/25 rounded-2xl"
      >
        <Plus size={20} /> Create New Circle
      </button>

      {/* Contact Sync / Find Friends Banner */}
      <div className="mt-10 rounded-3xl primary-gradient text-white p-8 relative overflow-hidden shadow-xl shadow-primary/20">
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <Phone size={180} />
        </div>
        <div className="relative z-10 max-w-[85%]">
          <span className="badge bg-white/20 text-white text-[10px] uppercase font-bold tracking-widest mb-3">
            Contact Sync
          </span>
          <h2 className="font-headline font-extrabold text-2xl text-white">Find your people</h2>
          <p className="text-sm mt-2 text-white/90 leading-relaxed mb-6">
            Sync your mobile address book to instantly match with friends already using W8VR or invite them to circles.
          </p>
          <button
            onClick={() => setIsContactsModalOpen(true)}
            className="bg-white text-primary font-headline font-bold px-8 py-3 rounded-full text-sm hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer border-none"
          >
            Find Friends
          </button>
        </div>
      </div>

      {/* Discover Public Circles */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline font-bold text-2xl text-text-dark">Discover Communities</h2>
          <span className="text-xs font-bold text-text-light uppercase tracking-wider">
            {discoverCircles.length} SUGGESTIONS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {discoverCircles.map(group => (
            <div
              key={group.id}
              className="card p-4 flex items-center gap-4 bg-surface-lowest shadow-sm hover:bg-surface-low transition-colors"
            >
              <img
                src={group.img || 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=200&h=200'}
                alt={group.name}
                className="w-16 h-16 rounded-2xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] font-bold text-text-medium mb-0.5">
                  <span className="bg-surface-high px-1.5 py-0.5 rounded uppercase">{group.categoryTag}</span>
                  <span className="flex items-center gap-1 text-secondary font-bold">
                    <Users size={11} /> {group.members}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-text-dark leading-tight truncate">{group.name}</h3>
                <p className="text-xs text-text-light truncate mt-0.5">{group.description}</p>
              </div>
              <button
                onClick={() => joinCircle(group.id)}
                className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shrink-0 cursor-pointer shadow-sm"
                title="Join Circle"
              >
                <Plus size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Create Circle Modal */}
      <GlassModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create a New Circle"
        subtitle="Group your friends or colleagues for effortless event coordination"
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-text-medium mb-1.5 block">CIRCLE NAME *</label>
            <input
              type="text"
              placeholder="e.g., Weekend Runners, Co-workers, Book Club"
              value={newCircleName}
              onChange={e => setNewCircleName(e.target.value)}
              className="input-field font-bold text-base"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-medium mb-1.5 block">DESCRIPTION</label>
            <textarea
              rows={2}
              placeholder="What is this circle all about?"
              value={newCircleDesc}
              onChange={e => setNewCircleDesc(e.target.value)}
              className="input-field text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-medium mb-1.5 block">CATEGORY TAG</label>
            <select
              value={newCircleCategory}
              onChange={e => setNewCircleCategory(e.target.value)}
              className="input-field text-sm"
            >
              <option value="FRIENDS">Friends & Social</option>
              <option value="FAMILY">Family</option>
              <option value="FITNESS">Fitness & Sports</option>
              <option value="CAMPUS">Campus & College</option>
              <option value="CULTURE">Culture & Arts</option>
              <option value="WORK">Professional & Work</option>
            </select>
          </div>

          <button
            onClick={handleCreateCircle}
            disabled={!newCircleName.trim()}
            className="btn btn-primary w-full py-3.5 mt-2 disabled:opacity-50"
          >
            Create Circle
          </button>
        </div>
      </GlassModal>

      {/* Share / QR Modal */}
      <GlassModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`Invite to ${activeCircleForShare?.name || 'Circle'}`}
        subtitle="Scan QR or copy private invitation link"
      >
        <div className="flex flex-col gap-4 text-center items-center">
          <div className="w-48 h-48 bg-surface-low rounded-2xl flex items-center justify-center p-4 border border-gray-100 shadow-sm">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                window.location.origin + '/circles?join=' + (activeCircleForShare?.id || 'c1')
              )}`}
              alt="Circle QR Code"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="p-3 bg-surface-low rounded-xl text-xs font-mono text-text-medium break-all w-full">
            {window.location.origin}/join/{activeCircleForShare?.id || 'c1'}
          </div>

          <button
            onClick={() => {
              navigator.clipboard?.writeText(`${window.location.origin}/join/${activeCircleForShare?.id || 'c1'}`);
              alert('Invite link copied!');
              setIsShareModalOpen(false);
            }}
            className="btn btn-primary w-full py-3"
          >
            Copy Invite URL
          </button>
        </div>
      </GlassModal>

      {/* Contact Sync Modal */}
      <GlassModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
        title="Matched Contacts on W8VR"
        subtitle="5 friends found in your address book"
      >
        <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
          {contacts.map(contact => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-3 bg-surface-low rounded-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 shrink-0">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(contact.avatar)}`}
                    alt={contact.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-sm text-text-dark flex items-center gap-1.5">
                    {contact.name}
                    {contact.isOnW8VR && (
                      <span className="badge bg-primary-fixed text-primary text-[9px] py-0 px-1.5 font-bold">
                        ON W8VR
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-light">{contact.phone}</div>
                </div>
              </div>

              <div>
                {contact.isInvited ? (
                  <span className="text-xs font-bold text-green-700 flex items-center gap-1">
                    <Check size={14} /> Invited
                  </span>
                ) : (
                  <button
                    onClick={() => inviteContact(contact.id)}
                    className="btn btn-outline text-xs py-1.5 px-3 rounded-full"
                  >
                    <UserPlus size={13} className="mr-1 inline" /> Invite
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassModal>
    </div>
  );
}
