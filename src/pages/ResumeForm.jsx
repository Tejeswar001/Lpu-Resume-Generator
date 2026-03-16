import { useMemo, useState } from 'react';

const sectionTitleClass =
  'mt-[10px] border-b border-gray-400 pb-[2px] text-[16px] font-bold uppercase leading-[1.05] tracking-[-0.2px] text-[#2c2d92]';

const createSkillSection = () => ({
  title: '',
  items: '',
});

const createInternship = () => ({
  role: '',
  company: '',
  start: '',
  end: '',
  highlights: [''],
});

const createProject = () => ({
  title: '',
  tech: '',
  link: '',
  date: '',
  highlights: [''],
});

const createCertification = () => ({
  name: '',
  issuer: '',
  date: '',
  link: '',
});

const createEducation = () => ({
  school: '',
  location: '',
  duration: '',
  program: '',
});

const toString = (value) => (value == null ? '' : String(value));

const normalizeBullets = (value) => {
  if (Array.isArray(value)) {
    const cleaned = value.map((line) => toString(line).trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : [''];
  }
  const text = toString(value);
  const cleaned = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return cleaned.length > 0 ? cleaned : [''];
};

const readSectionBlocks = (text, sectionName) => {
  const pattern = new RegExp(
    `##\\s*${sectionName}\\s*([\\s\\S]*?)(?=\\n##\\s*[A-Z ]+|$)`,
    'i'
  );
  const match = text.match(pattern);
  if (!match) return '';
  return match[1].trim();
};

const parseListItems = (sectionText) => {
  if (!sectionText) return [];
  return sectionText
    .split(/\n\s*---\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
};

const pickField = (chunk, key) => {
  const regex = new RegExp(`^${key}:\\s*(.*)$`, 'im');
  const match = chunk.match(regex);
  return match ? match[1].trim() : '';
};

const pickMultilineField = (chunk, key) => {
  const regex = new RegExp(`^${key}:\\s*([\\s\\S]*?)(?=\\n[a-z_]+:|$)`, 'im');
  const match = chunk.match(regex);
  return match ? match[1].trim() : '';
};

const parseTextImport = (rawText) => {
  const text = rawText.trim();

  const fencedJson = text.match(/```json\s*([\s\S]*?)```/i);
  const jsonCandidate = fencedJson ? fencedJson[1].trim() : text;

  try {
    const parsed = JSON.parse(jsonCandidate);
    return {
      personal: {
        name: toString(parsed?.personal?.name),
        linkedin: toString(parsed?.personal?.linkedin),
        email: toString(parsed?.personal?.email),
        github: toString(parsed?.personal?.github),
        phone: toString(parsed?.personal?.phone),
      },
      skills: (parsed?.skills || []).map((entry) => ({
        title: toString(entry?.title),
        items: Array.isArray(entry?.items) ? entry.items.map((v) => toString(v)).join(', ') : toString(entry?.items),
      })),
      internships: (parsed?.internships || []).map((entry) => ({
        role: toString(entry?.role),
        company: toString(entry?.company),
        start: toString(entry?.start),
        end: toString(entry?.end),
        highlights: normalizeBullets(entry?.highlights),
      })),
      projects: (parsed?.projects || []).map((entry) => ({
        title: toString(entry?.title),
        tech: toString(entry?.tech),
        link: toString(entry?.link),
        date: toString(entry?.date),
        highlights: normalizeBullets(entry?.highlights),
      })),
      certifications: (parsed?.certifications || []).map((entry) => ({
        name: toString(entry?.name),
        issuer: toString(entry?.issuer),
        date: toString(entry?.date),
        link: toString(entry?.link),
      })),
      education: (parsed?.education || []).map((entry) => ({
        school: toString(entry?.school),
        location: toString(entry?.location),
        duration: toString(entry?.duration),
        program: toString(entry?.program),
      })),
    };
  } catch {
    const personalBlock = readSectionBlocks(text, 'PERSONAL');
    const skillsBlock = readSectionBlocks(text, 'SKILLS');
    const internshipsBlock = readSectionBlocks(text, 'INTERNSHIPS');
    const projectsBlock = readSectionBlocks(text, 'PROJECTS');
    const certsBlock = readSectionBlocks(text, 'CERTIFICATIONS');
    const eduBlock = readSectionBlocks(text, 'EDUCATION');

    const skills = skillsBlock
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, ...rest] = line.split(':');
        return {
          title: toString(title).trim(),
          items: rest.join(':').trim(),
        };
      })
      .filter((entry) => entry.title || entry.items);

    const internships = parseListItems(internshipsBlock).map((chunk) => ({
      role: pickField(chunk, 'role'),
      company: pickField(chunk, 'company'),
      start: pickField(chunk, 'start'),
      end: pickField(chunk, 'end'),
      highlights: normalizeBullets(
        pickMultilineField(chunk, 'highlights')
          .split('\n')
          .map((line) => line.replace(/^[-*]\s*/, '').trim())
          .filter(Boolean)
      ),
    }));

    const projects = parseListItems(projectsBlock).map((chunk) => ({
      title: pickField(chunk, 'title'),
      tech: pickField(chunk, 'tech'),
      link: pickField(chunk, 'link'),
      date: pickField(chunk, 'date'),
      highlights: normalizeBullets(
        pickMultilineField(chunk, 'highlights')
          .split('\n')
          .map((line) => line.replace(/^[-*]\s*/, '').trim())
          .filter(Boolean)
      ),
    }));

    const certifications = parseListItems(certsBlock).map((chunk) => ({
      name: pickField(chunk, 'name'),
      issuer: pickField(chunk, 'issuer'),
      date: pickField(chunk, 'date'),
      link: pickField(chunk, 'link'),
    }));

    const education = parseListItems(eduBlock).map((chunk) => ({
      school: pickField(chunk, 'school'),
      location: pickField(chunk, 'location'),
      duration: pickField(chunk, 'duration'),
      program: pickField(chunk, 'program'),
    }));

    return {
      personal: {
        name: pickField(personalBlock, 'name'),
        linkedin: pickField(personalBlock, 'linkedin'),
        email: pickField(personalBlock, 'email'),
        github: pickField(personalBlock, 'github'),
        phone: pickField(personalBlock, 'phone'),
      },
      skills,
      internships,
      projects,
      certifications,
      education,
    };
  }
};

function EditorSection({ title, hint, count, action, children }) {
  return (
    <section className="card border border-base-300 bg-base-200/60 shadow-sm">
      <div className="card-body gap-4 p-4">
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
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

function ResumeForm() {
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

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

  const applyImportedData = (data) => {
    setPersonal({
      name: data?.personal?.name || '',
      linkedin: data?.personal?.linkedin || '',
      email: data?.personal?.email || '',
      github: data?.personal?.github || '',
      phone: data?.personal?.phone || '',
    });

    setSkills(data?.skills?.length ? data.skills : [createSkillSection()]);
    setInternships(data?.internships?.length ? data.internships : [createInternship()]);
    setProjects(data?.projects?.length ? data.projects : [createProject()]);
    setCertifications(data?.certifications?.length ? data.certifications : [createCertification()]);
    setEducation(data?.education?.length ? data.education : [createEducation()]);
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

  const splitCsv = (value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .join(', ');

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

  return (
    <div className="min-h-screen bg-base-200 pt-24">
      <div className="mx-auto grid max-w-[1880px] grid-cols-1 gap-5 px-4 pb-5 xl:grid-cols-[minmax(560px,720px)_minmax(760px,1fr)]">
        <div className="space-y-5 rounded-[28px] border border-base-300 bg-base-100 p-5 shadow-lg xl:h-[calc(100vh-7.5rem)] xl:overflow-y-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <span className="badge badge-outline badge-primary mb-3">Simple Builder</span>
              <h2 className="text-3xl font-bold text-primary">Resume Form</h2>
              <p className="mt-2 text-sm leading-6 text-base-content/70">
                Clean editing on the left, full A4 preview on the right, and enough room to work without feeling cramped.
              </p>
            </div>
            <div className="stats stats-horizontal border border-base-300 bg-base-200 shadow-sm">
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
            <input type="checkbox" defaultChecked />
            <div className="collapse-title pr-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-base-content/70">
                    Import Existing Resume Data
                  </p>
                  <p className="mt-1 text-sm text-base-content/60">
                    Paste LLM output or structured text and auto-fill everything.
                  </p>
                </div>
                <a href="/resume-import-example.txt" target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">
                  Open Example
                </a>
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

        <div className="rounded-[28px] border border-base-300 bg-base-100 p-4 shadow-lg xl:sticky xl:top-24 xl:h-[calc(100vh-7.5rem)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] opacity-70">A4 Preview</p>
              <p className="mt-1 text-sm text-base-content/60">The preview uses the full panel so you can inspect spacing more easily.</p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold opacity-70">
              Zoom
              <input
                type="range"
                min="70"
                max="120"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="range range-xs w-28"
              />
              <span className="w-8 text-right">{zoom}%</span>
            </label>
          </div>

          <div className="mockup-window h-[calc(100%-4rem)] border border-base-300 bg-base-300">
            <div className="flex h-full overflow-auto bg-base-200/70 p-4">
              <div className="mx-auto origin-top" style={{ transform: `scale(${zoom / 100})`, width: '210mm' }}>
                <div className="h-[297mm] w-[210mm] bg-white px-[10mm] pb-[10mm] pt-[6.2mm] text-left text-black shadow-lg" style={{ fontFamily: 'Liberation Sans, Arial, sans-serif' }}>
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
      </div>
    </div>
  );
}

export default ResumeForm;
