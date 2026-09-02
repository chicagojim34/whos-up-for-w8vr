import { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Crown, 
  UserCheck, 
  Search, 
  UserPlus, 
  History,
  Sparkles
} from 'lucide-react';
import cx from 'classnames';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { useToast } from '../hooks/useToast';
import { Avatar } from './Avatar';
import type { UserRole } from '../types';

export function AdminRoleManager() {
  const { user, rolesMap, roleAssignments, assignRole, getRoleForUser } = useAuth();
  const { circles, contacts, events } = useApp();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | UserRole>('all');
  const [customUserId, setCustomUserId] = useState('');
  const [customUserName, setCustomUserName] = useState('');
  const [customUserRole, setCustomUserRole] = useState<UserRole>('admin');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Aggregate all unique users across circles, contacts, and event attendee rosters
  const allKnownUsers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email?: string }>();

    // Self
    map.set(user.id, { id: user.id, name: user.name, email: user.email });

    // Contacts
    for (const c of contacts) {
      map.set(c.id, { id: c.id, name: c.name, email: `${c.name.toLowerCase().replace(/\s+/g, '.')}@w8vr.app` });
    }

    // Circles
    for (const circle of circles) {
      for (const m of circle.memberList) {
        if (!map.has(m.id)) {
          map.set(m.id, { id: m.id, name: m.name, email: `${m.name.toLowerCase().replace(/\s+/g, '.')}@w8vr.app` });
        }
      }
    }

    // Event attendees
    for (const e of events) {
      for (const a of e.attendees) {
        if (!map.has(a.id)) {
          map.set(a.id, { id: a.id, name: a.name });
        }
      }
    }

    return Array.from(map.values());
  }, [user, contacts, circles, events]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allKnownUsers.filter(u => {
      const currentRole = getRoleForUser(u.id);
      const matchesRole = filterRole === 'all' || currentRole === filterRole;
      const matchesQuery = !q || u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [allKnownUsers, searchQuery, filterRole, getRoleForUser]);

  const handleRoleChange = async (targetId: string, targetName: string, nextRole: UserRole) => {
    try {
      await assignRole(targetId, targetName, nextRole);
      toast.show(
        `Role for "${targetName}" updated to ${nextRole.toUpperCase()}!`,
        nextRole === 'admin' ? 'info' : 'info'
      );
    } catch {
      toast.show('Failed to update user role', 'warning');
    }
  };

  const handleAddCustomUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUserId.trim() || !customUserName.trim()) {
      toast.show('Please enter both User ID / Email and Name', 'warning');
      return;
    }

    await assignRole(customUserId.trim(), customUserName.trim(), customUserRole);
    toast.show(`Granted ${customUserRole.toUpperCase()} role to ${customUserName}!`);
    setCustomUserId('');
    setCustomUserName('');
    setIsAddingCustom(false);
  };

  const adminCount = Object.values(rolesMap).filter(r => r === 'admin').length + (rolesMap[user.id] === 'admin' ? 0 : 1);
  const modCount = Object.values(rolesMap).filter(r => r === 'moderator').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-gradient-to-br from-primary-fixed/40 to-surface-low rounded-2xl border border-primary/20 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-2xs shrink-0">
            <Crown size={20} />
          </span>
          <div>
            <p className="text-[11px] font-bold text-text-medium uppercase tracking-wider">Total Admins</p>
            <p className="font-headline font-black text-2xl text-text-dark">{adminCount}</p>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-secondary-container/40 to-surface-low rounded-2xl border border-secondary/20 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center shadow-2xs shrink-0">
            <ShieldCheck size={20} />
          </span>
          <div>
            <p className="text-[11px] font-bold text-text-medium uppercase tracking-wider">Moderators</p>
            <p className="font-headline font-black text-2xl text-text-dark">{modCount}</p>
          </div>
        </div>

        <div className="p-4 bg-surface-low rounded-2xl border border-gray-200 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-surface-highest text-text-dark flex items-center justify-center shrink-0">
            <UserCheck size={20} />
          </span>
          <div>
            <p className="text-[11px] font-bold text-text-medium uppercase tracking-wider">Known Members</p>
            <p className="font-headline font-black text-2xl text-text-dark">{allKnownUsers.length}</p>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light pointer-events-none" size={16} />
          <input
            type="text"
            placeholder="Search users by name, ID, or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field pl-10 py-2.5 text-xs bg-surface-lowest rounded-xl w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-surface-low p-1 rounded-xl gap-1" role="group" aria-label="Filter by role">
            {(['all', 'admin', 'moderator', 'user'] as const).map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setFilterRole(role)}
                className={cx(
                  'px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer',
                  filterRole === role
                    ? 'bg-surface-lowest text-primary shadow-2xs'
                    : 'text-text-medium hover:text-text-dark'
                )}
              >
                {role === 'all' ? 'All' : role}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsAddingCustom(prev => !prev)}
            className="btn btn-primary text-xs py-2 px-3 flex items-center gap-1.5 shrink-0 shadow-2xs font-headline font-bold"
          >
            <UserPlus size={14} />
            <span>Assign Role</span>
          </button>
        </div>
      </div>

      {/* Quick Add Custom User / Firebase UID Role Drawer */}
      {isAddingCustom && (
        <form
          onSubmit={handleAddCustomUser}
          className="p-4 bg-gradient-to-br from-primary-fixed/30 to-surface-low border border-primary/20 rounded-2xl flex flex-col gap-3 animate-slide-up"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-headline font-bold text-text-dark flex items-center gap-1.5">
              <Sparkles size={14} className="text-primary" /> Assign Role by User ID / Email
            </span>
            <button
              type="button"
              onClick={() => setIsAddingCustom(false)}
              className="text-[11px] font-bold text-text-light hover:text-text-dark"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-text-dark block mb-1">User ID / Email / UID</label>
              <input
                type="text"
                required
                placeholder="e.g. u12, alex@gmail.com, or UID"
                value={customUserId}
                onChange={e => setCustomUserId(e.target.value)}
                className="input-field py-2 text-xs bg-surface-lowest rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-text-dark block mb-1">User Display Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Rivers"
                value={customUserName}
                onChange={e => setCustomUserName(e.target.value)}
                className="input-field py-2 text-xs bg-surface-lowest rounded-xl"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-text-dark block mb-1">Target Role</label>
              <select
                value={customUserRole}
                onChange={e => setCustomUserRole(e.target.value as UserRole)}
                className="input-field py-2 text-xs bg-surface-lowest rounded-xl font-bold cursor-pointer"
              >
                <option value="admin">👑 Admin (Full Control)</option>
                <option value="moderator">🛡️ Moderator (Content & Events)</option>
                <option value="user">👤 Member (Standard)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" className="btn btn-primary text-xs py-1.5 px-4 font-bold">
              Grant Role
            </button>
          </div>
        </form>
      )}

      {/* Users Role Directory Table */}
      <div className="bg-surface-lowest rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
        <div className="p-3 bg-surface-low text-xs font-bold text-text-medium flex items-center justify-between">
          <span>Member / User</span>
          <span>Assigned Role &amp; Permissions</span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-text-medium text-xs">
            No users found matching "{searchQuery}"
          </div>
        ) : (
          filteredUsers.map(u => {
            const currentRole = getRoleForUser(u.id);
            const isSelf = u.id === user.id;

            return (
              <div
                key={u.id}
                className="p-3.5 flex items-center justify-between gap-4 hover:bg-surface-low/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={u.name} size={36} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-headline font-bold text-xs text-text-dark truncate">{u.name}</span>
                      {isSelf && (
                        <span className="badge bg-primary-fixed text-primary-container text-[9px] font-bold uppercase">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-text-light truncate font-mono">
                      {u.email || `ID: ${u.id}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={currentRole}
                    onChange={e => handleRoleChange(u.id, u.name, e.target.value as UserRole)}
                    className={cx(
                      'text-xs font-bold py-1.5 px-3 rounded-xl border transition-all cursor-pointer appearance-none text-center',
                      currentRole === 'admin' && 'bg-primary-fixed/60 text-primary-container border-primary/30',
                      currentRole === 'moderator' && 'bg-secondary-container text-on-secondary-container border-secondary/30',
                      currentRole === 'user' && 'bg-surface-low text-text-medium border-gray-200'
                    )}
                    aria-label={`Change role for ${u.name}`}
                  >
                    <option value="admin">👑 Admin</option>
                    <option value="moderator">🛡️ Moderator</option>
                    <option value="user">👤 Member</option>
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Role Audit Trail */}
      {roleAssignments.length > 0 && (
        <div className="mt-2">
          <h3 className="text-xs font-headline font-bold text-text-dark flex items-center gap-1.5 mb-2">
            <History size={14} className="text-primary" /> Role Assignment History
          </h3>
          <div className="bg-surface-low rounded-2xl p-3 divide-y divide-gray-200/60 text-xs">
            {roleAssignments.slice(0, 5).map((a, i) => (
              <div key={i} className="py-2 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2 min-w-0 truncate">
                  <span
                    className={cx(
                      'badge text-[10px] font-bold uppercase shrink-0',
                      a.role === 'admin' ? 'bg-primary text-white' : 'bg-secondary text-white'
                    )}
                  >
                    {a.role}
                  </span>
                  <span className="font-bold text-text-dark truncate">{a.userName}</span>
                  <span className="text-text-light text-[11px] truncate">
                    granted by {a.assignedBy}
                  </span>
                </div>
                <span className="text-[10px] text-text-light shrink-0">
                  {new Date(a.assignedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
