'use client';

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay modal-overlay--visible"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <button className="modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 className="modal__title">{title}</h2>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
