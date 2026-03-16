import { sectionTitleClass } from './constants';

function ResumePreview({
  zoom,
  setZoom,
  onDownloadWord,
  onDownloadPdf,
  exportError,
  resumePreviewRef,
  personal,
  visibleSkills,
  visibleInternships,
  visibleProjects,
  visibleCertifications,
  visibleEducation,
}) {
  const splitCsv = (value) =>
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .join(', ');

  const nonEmptyBullets = (lines) =>
    (Array.isArray(lines) ? lines : [])
      .map((line) => String(line || '').trim())
      .filter(Boolean);

  return (
    <div className="rounded-[28px] border border-base-300 bg-base-100 p-4 shadow-lg xl:sticky xl:top-24 xl:h-[calc(100vh-7.5rem)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] opacity-70">A4 Preview</p>
          <p className="mt-1 text-sm text-base-content/60">The preview uses the full panel so you can inspect spacing more easily.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" className="btn btn-sm btn-outline" onClick={onDownloadWord}>
            Download Word
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={onDownloadPdf}>
            Download PDF
          </button>
          <label className="ml-2 flex items-center gap-2 text-xs font-semibold opacity-70">
            Zoom
            <input
              type="range"
              min="30"
              max="120"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="range range-xs w-28"
            />
            <span className="w-8 text-right">{zoom}%</span>
          </label>
        </div>
      </div>
      {exportError ? <p className="mb-2 text-xs text-error">{exportError}</p> : null}

      <div className="mockup-window h-[calc(100%-4rem)] border border-base-300 bg-base-300">
        <div className="flex h-full overflow-auto bg-base-200/70 p-4">
          <div className="mx-auto origin-top" style={{ transform: `scale(${zoom / 100})`, width: '210mm' }}>
            <div data-export-root="resume" ref={resumePreviewRef} className="h-[297mm] w-[210mm] bg-white px-[10mm] pb-[10mm] pt-[6.2mm] text-left text-black shadow-lg" style={{ fontFamily: 'Liberation Sans, Arial, sans-serif' }}>
              <h1 className="mb-[2px] text-[26.7px] font-bold leading-[1.117] tracking-[-0.15px] text-[#2c2d92]">{personal.name || 'Your Name'}</h1>

              <div className="mt-0 space-y-[1px] text-[14px] leading-[1.12]">
                <div className="flex items-start justify-between gap-4">
                  <p className="max-w-[58%] break-all"><span className="text-black">LinkedIn: </span><span className="text-blue-700">{personal.linkedin || '-'}</span></p>
                  <p className="max-w-[42%] break-all text-right"><span className="text-black">Email: </span><span className="text-blue-700">{personal.email || '-'}</span></p>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <p className="max-w-[58%] break-all"><span className="text-black">GitHub: </span><span className="text-blue-700">{personal.github || '-'}</span></p>
                  <p className="max-w-[42%] text-right"><span className="text-black">Mobile: </span>{personal.phone || '-'}</p>
                </div>
              </div>

              {visibleSkills.length > 0 && (
                <section>
                  <h2 className={sectionTitleClass}>Skills</h2>
                  <div className="mt-[4px] space-y-[1px] text-[14px] leading-[1.18]">
                    {visibleSkills.map((entry, index) => (
                      <div key={`preview-skill-${index}`} className="grid grid-cols-[165px_1fr] gap-x-2">
                        <p className="font-bold text-[#2c2d92]">{entry.title || 'General'}:</p>
                        <p>{splitCsv(entry.items)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {visibleInternships.length > 0 && (
                <section>
                  <h2 className={sectionTitleClass}>Internship</h2>
                  <div className="mt-[4px] space-y-[6px] text-[14px] leading-[1.18]">
                    {visibleInternships.map((entry, index) => {
                      const bullets = nonEmptyBullets(entry.highlights);
                      return (
                        <div key={`preview-intern-${index}`}>
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-bold text-[#2c2d92]">
                              {entry.company || 'Company'}{entry.role ? ` - ${entry.role}` : ''}
                            </p>
                            <p className="whitespace-nowrap text-[14px]">{[entry.start, entry.end].filter(Boolean).join(' - ')}</p>
                          </div>
                          {bullets.length > 0 && (
                            <ul className="mt-[1px] list-disc pl-5">
                              {bullets.map((line, lineIndex) => (
                                <li key={`preview-intern-${index}-b-${lineIndex}`}>{line}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {visibleProjects.length > 0 && (
                <section>
                  <h2 className={sectionTitleClass}>Projects</h2>
                  <div className="mt-[4px] space-y-[6px] text-[14px] leading-[1.18]">
                    {visibleProjects.map((entry, index) => {
                      const bullets = nonEmptyBullets(entry.highlights);
                      return (
                        <div key={`preview-project-${index}`}>
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-bold text-[#2c2d92]">
                              {entry.title || 'Project'}
                              {entry.tech ? <span className="font-normal text-black"> | {entry.tech} | </span> : null}
                              {entry.link ? (
                                <a href={entry.link} target="_blank" rel="noreferrer" className="font-normal text-blue-700">
                                  GitHub
                                </a>
                              ) : null}
                            </p>
                            <p className="whitespace-nowrap text-[14px]">{entry.date || ''}</p>
                          </div>
                          {bullets.length > 0 && (
                            <ul className="mt-[1px] list-disc pl-5">
                              {bullets.map((line, lineIndex) => (
                                <li key={`preview-project-${index}-b-${lineIndex}`}>{line}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {visibleCertifications.length > 0 && (
                <section>
                  <h2 className={sectionTitleClass}>Certificates</h2>
                  <div className="mt-[4px] space-y-[1px] text-[14px] leading-[1.18]">
                    {visibleCertifications.map((entry, index) => (
                      <div key={`preview-cert-${index}`} className="flex items-start justify-between gap-3">
                        <p>
                          {entry.name || 'Certificate'}
                          {entry.issuer ? ` | ${entry.issuer}` : ''}
                          {entry.link ? (
                            <>
                              {' '}|{' '}
                              <a href={entry.link} target="_blank" rel="noreferrer" className="text-blue-700">
                                Link
                              </a>
                            </>
                          ) : null}
                        </p>
                        <p className="whitespace-nowrap text-[14px]">{entry.date || ''}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {visibleEducation.length > 0 && (
                <section>
                  <h2 className={sectionTitleClass}>Education</h2>
                  <div className="mt-[4px] space-y-[4px] text-[14px] leading-[1.18]">
                    {visibleEducation.map((entry, index) => (
                      <div key={`preview-edu-${index}`}>
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-[#2c2d92]">{entry.school || 'School / University'}</p>
                          <p className="whitespace-nowrap text-[14px]">{entry.location || ''}</p>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <p>{entry.program || ''}</p>
                          <p className="whitespace-nowrap text-[14px]">{entry.duration || ''}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumePreview;
