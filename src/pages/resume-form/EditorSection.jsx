function EditorSection({ title, hint, count, action, children, defaultOpen = false }) {
  return (
    <section className="collapse collapse-arrow border border-base-300 bg-base-200/60 shadow-sm">
      <input type="checkbox" defaultChecked={defaultOpen} />
      <div className="collapse-title pb-3 pr-16">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-base-content/70">
                {title}
              </h3>
              {typeof count === 'number' ? (
                <span className="badge badge-outline badge-primary">{count}</span>
              ) : null}
            </div>
            {hint ? <p className="mt-1 text-sm text-base-content/60">{hint}</p> : null}
          </div>
          {action ? (
            <div
              className="relative z-10 mr-2 shrink-0"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {action}
            </div>
          ) : null}
        </div>
      </div>
      <div className="collapse-content pt-0">{children}</div>
    </section>
  );
}

export default EditorSection;
