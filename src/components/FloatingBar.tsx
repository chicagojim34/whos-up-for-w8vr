import React from 'react';
import { createPortal } from 'react-dom';
import cx from 'classnames';

interface FloatingBarProps {
  children: React.ReactNode;
  /** Leave room for the bottom nav on mobile and tablet. */
  aboveNav?: boolean;
  className?: string;
}

/**
 * Portalled to the body on purpose.
 *
 * The content column is a container-query container (`@container`), and
 * `container-type` makes an element the containing block for `position: fixed`
 * descendants. A bar rendered inside the column would therefore pin to the
 * column's box — which grows with the page — instead of the viewport, and
 * would drift off-screen as you scroll.
 */
export const FloatingBar: React.FC<FloatingBarProps> = ({
  children,
  aboveNav = false,
  className,
}) =>
  createPortal(
    <div className={cx('floating-bar', { 'above-nav': aboveNav }, className)}>
      <div className="floating-bar-inner flex flex-col gap-3">{children}</div>
    </div>,
    document.body
  );
