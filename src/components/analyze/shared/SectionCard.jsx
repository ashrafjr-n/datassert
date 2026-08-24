function SectionCard({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-xl border border-line bg-paper p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-[13px] font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export default SectionCard;
