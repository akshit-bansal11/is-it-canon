"use client";

interface BackdropProps {
  label: string;
  onClose: () => void;
}

/** A button, not a div: dismissing the overlay stays reachable from the keyboard. */
export default function Backdrop({ label, onClose }: BackdropProps) {
  return (
    <button
      aria-label={label}
      className="anim-fade absolute inset-0 bg-[var(--tone-veil)]"
      onClick={onClose}
      type="button"
    />
  );
}
