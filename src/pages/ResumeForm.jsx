import { useMemo, useRef, useState } from 'react';
import EditorSection from './resume-form/EditorSection';
import ResumePreview from './resume-form/ResumePreview';
import { parseTextImport } from './resume-form/parsers';
import {
  createCertification,
  createEducation,
  createInternship,
  createProject,
  createSkillSection,
} from './resume-form/constants';
import {
  buildFileNameBase,
  downloadWordFromHtml,
  getExactPreviewHtml,
  openPdfPrintWindow,
} from './resume-form/exportUtils';

function ResumeForm() {
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [exportError, setExportError] = useState('');

  const [zoom, setZoom] = useState(90);

  const [personal, setPersonal] = useState({
    name: '',
    linkedin: '',
    email: '',
    github: '',
    phone: '',
  });

  const [skills, setSkills] = useState([createSkillSection()]);
  const [internships, setInternships] = useState([createInternship()]);
  const [projects, setProjects] = useState([createProject()]);
  const [certifications, setCertifications] = useState([createCertification()]);
  const [education, setEducation] = useState([createEducation()]);
  const resumePreviewRef = useRef(null);

  const applyImportedData = (data) => {
    const asText = (value) => (value == null ? '' : String(value));
    const asBulletList = (value) => {
      if (Array.isArray(value)) {
        const lines = value.map((line) => asText(line).trim()).filter(Boolean);
        return lines.length ? lines : [''];
      }
      const single = asText(value).trim();
      return single ? [single] : [''];
    };

    setPersonal({
      name: asText(data?.personal?.name),
      linkedin: asText(data?.personal?.linkedin),
      email: asText(data?.personal?.email),
      github: asText(data?.personal?.github),
      phone: asText(data?.personal?.phone),
    });

    const safeSkills = Array.isArray(data?.skills)
      ? data.skills.map((entry) => ({
          title: asText(entry?.title),
          items: asText(entry?.items),
        }))
      : [];

    const safeInternships = Array.isArray(data?.internships)
      ? data.internships.map((entry) => ({
          role: asText(entry?.role),
          company: asText(entry?.company),
          start: asText(entry?.start),
          end: asText(entry?.end),
          highlights: asBulletList(entry?.highlights),
        }))
      : [];

    const safeProjects = Array.isArray(data?.projects)
      ? data.projects.map((entry) => ({
          title: asText(entry?.title),
          tech: asText(entry?.tech),
          link: asText(entry?.link),
          date: asText(entry?.date),
          highlights: asBulletList(entry?.highlights),
        }))
      : [];

    const safeCertifications = Array.isArray(data?.certifications)
      ? data.certifications.map((entry) => ({
          name: asText(entry?.name),
          issuer: asText(entry?.issuer),
          date: asText(entry?.date),
          link: asText(entry?.link),
        }))
      : [];

    const safeEducation = Array.isArray(data?.education)
      ? data.education.map((entry) => ({
          school: asText(entry?.school),
          location: asText(entry?.location),
          duration: asText(entry?.duration),
          program: asText(entry?.program),
        }))
      : [];

    setSkills(safeSkills.length ? safeSkills : [createSkillSection()]);
    setInternships(safeInternships.length ? safeInternships : [createInternship()]);
    setProjects(safeProjects.length ? safeProjects : [createProject()]);
    setCertifications(safeCertifications.length ? safeCertifications : [createCertification()]);
    setEducation(safeEducation.length ? safeEducation : [createEducation()]);
  };

  const onImportFromText = () => {
    try {
      const parsed = parseTextImport(importText);
      applyImportedData(parsed);
      setImportError('');
    } catch {
      setImportError('Could not parse text. Use the example format or valid JSON.');
    }
  };

  const onImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setImportText(text);
  };

  const updateListItem = (setter, index, key, value) => {
    setter((prev) => prev.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = (setter, factory) => setter((prev) => [...prev, factory()]);

  const removeItem = (setter, index) => {
    setter((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const updateBullet = (setter, entryIndex, bulletIndex, value) => {
    setter((prev) =>
      prev.map((entry, i) => {
        if (i !== entryIndex) return entry;
        return {
          ...entry,
          highlights: entry.highlights.map((line, j) => (j === bulletIndex ? value : line)),
        };
      })
    );
  };

  const addBullet = (setter, entryIndex) => {
    setter((prev) =>
      prev.map((entry, i) =>
        i === entryIndex ? { ...entry, highlights: [...entry.highlights, ''] } : entry
      )
    );
  };

  const removeBullet = (setter, entryIndex, bulletIndex) => {
    setter((prev) =>
      prev.map((entry, i) => {
        if (i !== entryIndex) return entry;
        if (entry.highlights.length === 1) return entry;
        return {
          ...entry,
          highlights: entry.highlights.filter((_, j) => j !== bulletIndex),
        };
      })
    );
  };

  const nonEmptyBullets = (lines) => lines.map((line) => line.trim()).filter(Boolean);

  const visibleSkills = useMemo(
    () => skills.filter((entry) => entry.title.trim() || entry.items.trim()),
    [skills]
  );

  const visibleInternships = useMemo(
    () =>
      internships.filter(
        (entry) =>
          entry.role.trim() ||
          entry.company.trim() ||
          entry.start.trim() ||
          entry.end.trim() ||
          nonEmptyBullets(entry.highlights).length > 0
      ),
    [internships]
  );

  const visibleProjects = useMemo(
    () =>
      projects.filter(
        (entry) =>
          entry.title.trim() ||
          entry.tech.trim() ||
          entry.link.trim() ||
          entry.date.trim() ||
          nonEmptyBullets(entry.highlights).length > 0
      ),
    [projects]
  );

  const visibleCertifications = useMemo(
    () =>
      certifications.filter(
        (entry) => entry.name.trim() || entry.issuer.trim() || entry.date.trim() || entry.link.trim()
      ),
    [certifications]
  );

  const visibleEducation = useMemo(
    () =>
      education.filter(
        (entry) =>
          entry.school.trim() ||
          entry.location.trim() ||
          entry.duration.trim() ||
          entry.program.trim()
      ),
    [education]
  );

  const filledCount =
    visibleSkills.length +
    visibleInternships.length +
    visibleProjects.length +
    visibleCertifications.length +
    visibleEducation.length;

  const fileNameBase = buildFileNameBase(personal.name);

  const downloadPdf = () => {
    try {
      setExportError('');
      const html = getExactPreviewHtml(resumePreviewRef);
      if (!html) {
        setExportError('Exact export failed. Preview is not ready.');
        return;
      }

      if (!openPdfPrintWindow(html)) {
        setExportError('Popup blocked. Allow popups for PDF export.');
      }
    } catch {
      setExportError('PDF export failed. Please try again.');
    }
  };

  const downloadWord = () => {
    try {
      setExportError('');
      const html = getExactPreviewHtml(resumePreviewRef);
      if (!html) {
        setExportError('Exact export failed. Preview is not ready.');
        return;
      }

      downloadWordFromHtml(html, fileNameBase || 'resume');
    } catch {
      setExportError('Word export failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-base-200 pt-28 sm:pt-24">
      <div className="mx-auto grid max-w-[1880px] grid-cols-1 gap-4 px-3 pb-5 sm:gap-5 sm:px-4 xl:grid-cols-[minmax(560px,720px)_minmax(760px,1fr)]">
        <div className="space-y-5 rounded-[28px] border border-base-300 bg-base-100 p-5 shadow-lg xl:h-[calc(100vh-7.5rem)] xl:overflow-y-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <span className="badge badge-outline badge-primary mb-3">Simple Builder</span>
              <h2 className="text-3xl font-bold text-primary">Resume Form</h2>
            </div>
            <div className="stats stats-vertical w-full border border-base-300 bg-base-200 shadow-sm sm:w-auto sm:stats-horizontal">
              <div className="stat px-5 py-3">
                <div className="stat-title text-xs">Filled Sections</div>
                <div className="stat-value text-2xl text-primary">{filledCount}</div>
              </div>
              <div className="stat px-5 py-3">
                <div className="stat-title text-xs">Preview</div>
                <div className="stat-value text-2xl text-secondary">A4</div>
              </div>
            </div>
          </div>

          <div className="collapse-arrow collapse border border-base-300 bg-base-200/70 shadow-sm">
            <input type="checkbox" />
            <div className="collapse-title pr-12 sm:pr-20">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-base-content/70">
                    Import Existing Resume Data
                  </p>
                  <p className="mt-1 text-sm text-base-content/60">
                    Paste LLM output or structured text and auto-fill everything.
                  </p>
                </div>
              </div>
            </div>
            <div className="collapse-content space-y-3">
              <textarea
                className="textarea textarea-bordered w-full bg-base-100"
                rows={7}
                placeholder="Paste JSON or example-format text here"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <input type="file" accept=".txt,.md,.json" className="file-input file-input-bordered file-input-sm bg-base-100" onChange={onImportFile} />
                <button type="button" className="btn btn-sm btn-primary" onClick={onImportFromText}>
                  Import and Autofill
                </button>
              </div>
              {importError && <p className="text-xs text-error">{importError}</p>}
            </div>
          </div>

          <form className="space-y-5">
            <EditorSection
              title="Header"
              hint="Your name and contact details shown at the top of the resume."
              count={Object.values(personal).filter(Boolean).length}
            >
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  className="input input-bordered md:col-span-2"
                  placeholder="Full Name"
                  value={personal.name}
                  onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                />
                <input
                  className="input input-bordered"
                  placeholder="LinkedIn URL"
                  value={personal.linkedin}
                  onChange={(e) => setPersonal({ ...personal, linkedin: e.target.value })}
                />
                <input
                  className="input input-bordered"
                  placeholder="Email"
                  value={personal.email}
                  onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                />
                <input
                  className="input input-bordered"
                  placeholder="GitHub URL"
                  value={personal.github}
                  onChange={(e) => setPersonal({ ...personal, github: e.target.value })}
                />
                <input
                  className="input input-bordered"
                  placeholder="Mobile"
                  value={personal.phone}
                  onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                />
              </div>
            </EditorSection>

            <EditorSection
              title="Skills"
              hint="Group tools and technologies into labeled sections."
              count={visibleSkills.length}
              action={
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => addItem(setSkills, createSkillSection)}
                >
                  Add Skill Section
                </button>
              }
            >
              {skills.map((entry, index) => (
                <div key={`skill-${index}`} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="badge badge-outline">Section {index + 1}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => removeItem(setSkills, index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-2">
                    <input
                      className="input input-bordered w-full"
                      placeholder="Label (Languages, Cloud, etc.)"
                      value={entry.title}
                      onChange={(e) => updateListItem(setSkills, index, 'title', e.target.value)}
                    />
                    <textarea
                      className="textarea textarea-bordered w-full"
                      rows={2}
                      placeholder="Comma separated items"
                      value={entry.items}
                      onChange={(e) => updateListItem(setSkills, index, 'items', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </EditorSection>

            <EditorSection
              title="Internships"
              hint="Role, company, dates, and bullet points."
              count={visibleInternships.length}
              action={
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => addItem(setInternships, createInternship)}
                >
                  Add Internship
                </button>
              }
            >
              {internships.map((entry, index) => (
                <div key={`intern-${index}`} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="badge badge-outline">Internship {index + 1}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => removeItem(setInternships, index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <input
                      className="input input-bordered"
                      placeholder="Role"
                      value={entry.role}
                      onChange={(e) => updateListItem(setInternships, index, 'role', e.target.value)}
                    />
                    <input
                      className="input input-bordered"
                      placeholder="Company"
                      value={entry.company}
                      onChange={(e) => updateListItem(setInternships, index, 'company', e.target.value)}
                    />
                    <input
                      className="input input-bordered"
                      placeholder="Start"
                      value={entry.start}
                      onChange={(e) => updateListItem(setInternships, index, 'start', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <input
                        className="input input-bordered w-full"
                        placeholder="End"
                        value={entry.end}
                        onChange={(e) => updateListItem(setInternships, index, 'end', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">Highlights</p>
                    {entry.highlights.map((line, bulletIndex) => (
                      <div key={`intern-${index}-bullet-${bulletIndex}`} className="flex gap-2">
                        <input
                          className="input input-bordered w-full"
                          placeholder="Bullet point"
                          value={line}
                          onChange={(e) => updateBullet(setInternships, index, bulletIndex, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => removeBullet(setInternships, index, bulletIndex)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => addBullet(setInternships, index)}
                    >
                      Add Bullet
                    </button>
                  </div>
                </div>
              ))}
            </EditorSection>

            <EditorSection
              title="Projects"
              hint="Title, stack, link, date, and result-focused bullets."
              count={visibleProjects.length}
              action={
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => addItem(setProjects, createProject)}
                >
                  Add Project
                </button>
              }
            >
              {projects.map((entry, index) => (
                <div key={`project-${index}`} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="badge badge-outline">Project {index + 1}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => removeItem(setProjects, index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <input
                      className="input input-bordered"
                      placeholder="Project Title"
                      value={entry.title}
                      onChange={(e) => updateListItem(setProjects, index, 'title', e.target.value)}
                    />
                    <input
                      className="input input-bordered"
                      placeholder="Date (e.g., Dec 25)"
                      value={entry.date}
                      onChange={(e) => updateListItem(setProjects, index, 'date', e.target.value)}
                    />
                    <input
                      className="input input-bordered md:col-span-2"
                      placeholder="Tech Stack"
                      value={entry.tech}
                      onChange={(e) => updateListItem(setProjects, index, 'tech', e.target.value)}
                    />
                    <div className="md:col-span-2 flex gap-2">
                      <input
                        className="input input-bordered w-full"
                        placeholder="Project Link"
                        value={entry.link}
                        onChange={(e) => updateListItem(setProjects, index, 'link', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">Highlights</p>
                    {entry.highlights.map((line, bulletIndex) => (
                      <div key={`project-${index}-bullet-${bulletIndex}`} className="flex gap-2">
                        <input
                          className="input input-bordered w-full"
                          placeholder="Bullet point"
                          value={line}
                          onChange={(e) => updateBullet(setProjects, index, bulletIndex, e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => removeBullet(setProjects, index, bulletIndex)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => addBullet(setProjects, index)}
                    >
                      Add Bullet
                    </button>
                  </div>
                </div>
              ))}
            </EditorSection>

            <EditorSection
              title="Certificates"
              hint="Compact card layout for certifications and links."
              count={visibleCertifications.length}
              action={
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => addItem(setCertifications, createCertification)}
                >
                  Add Certificate
                </button>
              }
            >
              {certifications.map((entry, index) => (
                <div key={`cert-${index}`} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="badge badge-outline">Certificate {index + 1}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => removeItem(setCertifications, index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <input
                      className="input input-bordered"
                      placeholder="Certificate Name"
                      value={entry.name}
                      onChange={(e) => updateListItem(setCertifications, index, 'name', e.target.value)}
                    />
                    <input
                      className="input input-bordered"
                      placeholder="Issuer"
                      value={entry.issuer}
                      onChange={(e) => updateListItem(setCertifications, index, 'issuer', e.target.value)}
                    />
                    <input
                      className="input input-bordered"
                      placeholder="Date"
                      value={entry.date}
                      onChange={(e) => updateListItem(setCertifications, index, 'date', e.target.value)}
                    />
                    <input
                      className="input input-bordered w-full"
                      placeholder="Link"
                      value={entry.link}
                      onChange={(e) => updateListItem(setCertifications, index, 'link', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </EditorSection>

            <EditorSection
              title="Education"
              hint="Institution, location, duration, and program details."
              count={visibleEducation.length}
              action={
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => addItem(setEducation, createEducation)}
                >
                  Add Education
                </button>
              }
            >
              {education.map((entry, index) => (
                <div key={`edu-${index}`} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="badge badge-outline">Education {index + 1}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => removeItem(setEducation, index)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <input
                      className="input input-bordered"
                      placeholder="School / University"
                      value={entry.school}
                      onChange={(e) => updateListItem(setEducation, index, 'school', e.target.value)}
                    />
                    <input
                      className="input input-bordered"
                      placeholder="Location"
                      value={entry.location}
                      onChange={(e) => updateListItem(setEducation, index, 'location', e.target.value)}
                    />
                    <input
                      className="input input-bordered"
                      placeholder="Duration"
                      value={entry.duration}
                      onChange={(e) => updateListItem(setEducation, index, 'duration', e.target.value)}
                    />
                    <input
                      className="input input-bordered w-full"
                      placeholder="Program / Score"
                      value={entry.program}
                      onChange={(e) => updateListItem(setEducation, index, 'program', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </EditorSection>
          </form>
        </div>

        <ResumePreview
          personal={personal}
          visibleSkills={visibleSkills}
          visibleInternships={visibleInternships}
          visibleProjects={visibleProjects}
          visibleCertifications={visibleCertifications}
          visibleEducation={visibleEducation}
          zoom={zoom}
          setZoom={setZoom}
          exportError={exportError}
          onDownloadWord={downloadWord}
          onDownloadPdf={downloadPdf}
          resumePreviewRef={resumePreviewRef}
        />
      </div>
    </div>
  );
}

export default ResumeForm;
