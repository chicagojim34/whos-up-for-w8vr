import type { CircleItem } from '../types';

/**
 * The link that brings someone into a circle. Shared circles carry their
 * invite code, which is what lets a non-member open and join a private one.
 */
export function circleInviteUrl(circle: Pick<CircleItem, 'id' | 'inviteCode'>, origin = window.location.origin): string {
  const base = `${origin}/circle/${circle.id}`;
  return circle.inviteCode ? `${base}?invite=${encodeURIComponent(circle.inviteCode)}` : base;
}
