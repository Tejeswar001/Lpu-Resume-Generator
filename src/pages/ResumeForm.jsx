import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
    .split(/\r?\n\s*---\s*\r?\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
};

const pickField = (chunk, key) => {
  const regex = new RegExp(`^${key}:\\s*(.*)$`, 'im');
  const match = chunk.match(regex);
  return match ? match[1].trim() : '';
};

const pickFirstField = (chunk, keys) => {
  for (const key of keys) {
    const value = pickField(chunk, key);
    if (value) return value;
  }
  return '';
};

const pickMultilineFieldByKeys = (chunk, keys, stopKeys) => {
  const lines = chunk.replace(/\r/g, '').split('\n');
  const keySet = new Set(keys.map((key) => key.toLowerCase()));
  const stopSet = new Set(stopKeys.map((key) => key.toLowerCase()));

  let capture = false;
  let buffer = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!capture) {
      const startMatch = trimmed.match(/^([a-z_][a-z0-9_ ]*):\s*(.*)$/i);
      if (!startMatch) continue;

      const key = startMatch[1].trim().toLowerCase();
      if (!keySet.has(key)) continue;

      capture = true;
      const inline = startMatch[2]?.trim();
      if (inline) buffer.push(inline);
      continue;
    }

    const nextFieldMatch = trimmed.match(/^([a-z_][a-z0-9_ ]*):\s*(.*)$/i);
    if (nextFieldMatch) {
      const nextKey = nextFieldMatch[1].trim().toLowerCase();
      if (stopSet.has(nextKey)) break;
    }

    buffer.push(trimmed);
  }

  return buffer.join('\n').trim();
};

const parseHighlights = (chunk, stopKeys) => {
  const raw = pickMultilineFieldByKeys(
    chunk,
    ['highlights', 'bullets', 'bullet_points', 'responsibilities', 'points'],
    stopKeys
  );
  if (!raw) return [''];

  const normalized = raw.replace(/\r/g, '').trim();
  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^(?:[-*•]\s+|\d+[.)]\s+)/, '').trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  const [single] = lines;
  if (!single) return [''];
  if (single.includes(';')) {
    const splitBySemi = single
      .split(';')
      .map((line) => line.trim())
      .filter(Boolean);
    if (splitBySemi.length > 1) return splitBySemi;
  }
  if (single.includes(' | ')) {
    const splitByPipe = single
      .split(' | ')
      .map((line) => line.trim())
      .filter(Boolean);
    if (splitByPipe.length > 1) return splitByPipe;
  }

  return [single];
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
      role: pickFirstField(chunk, ['role', 'position']),
      company: pickFirstField(chunk, ['company', 'organization']),
      start: pickFirstField(chunk, ['start', 'start_date']),
      end: pickFirstField(chunk, ['end', 'end_date']),
      highlights: normalizeBullets(
        parseHighlights(chunk, [
          'role',
          'position',
          'company',
          'organization',
          'start',
          'start_date',
          'end',
          'end_date',
          'duration',
          'location',
          'highlights',
          'bullets',
          'bullet_points',
          'responsibilities',
          'points',
        ])
      ),
    }));

    const projects = parseListItems(projectsBlock).map((chunk) => ({
      title: pickFirstField(chunk, ['title', 'name']),
      tech: pickFirstField(chunk, ['tech', 'stack', 'technologies']),
      link: pickFirstField(chunk, ['link', 'url', 'github']),
      date: pickFirstField(chunk, ['date', 'duration']),
      highlights: normalizeBullets(
        parseHighlights(chunk, [
          'title',
          'name',
          'tech',
          'stack',
          'technologies',
          'link',
          'url',
          'github',
          'date',
          'duration',
          'highlights',
          'bullets',
          'bullet_points',
          'responsibilities',
          'points',
        ])
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
          {action ? <div className="mr-2 shrink-0">{action}</div> : null}
        </div>
      </div>
      <div className="collapse-content pt-0">
        {children}
      </div>
    </section>
  );
}

function ResumeForm() {
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
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

  const fileNameBase = (personal.name || 'resume')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const capturePreviewImage = async () => {
    if (!resumePreviewRef.current) return null;
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const captureNode = async (node) => {
      const canvas = await html2canvas(node, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        allowTaint: false,
        logging: false,
      });
      return canvas.toDataURL('image/png');
    };

    try {
      return await captureNode(resumePreviewRef.current);
    } catch {
      const cloneHost = document.createElement('div');
      cloneHost.style.position = 'fixed';
      cloneHost.style.left = '-10000px';
      cloneHost.style.top = '0';
      cloneHost.style.background = '#fff';
      cloneHost.style.margin = '0';
      cloneHost.style.padding = '0';

      const cloned = resumePreviewRef.current.cloneNode(true);
      if (cloned instanceof HTMLElement) {
        cloned.style.width = '210mm';
        cloned.style.height = '297mm';
        cloned.style.maxWidth = '210mm';
        cloned.style.minWidth = '210mm';
        cloned.style.margin = '0';
        cloned.style.boxShadow = 'none';
      }
      cloneHost.appendChild(cloned);
      document.body.appendChild(cloneHost);

      try {
        return await captureNode(cloned);
      } finally {
        document.body.removeChild(cloneHost);
      }
    }
  };

  const getExactPreviewHtml = () => {
    if (!resumePreviewRef.current) return '';

    const clonedPage = resumePreviewRef.current.cloneNode(true);
    const styles = Array.from(document.querySelectorAll('style,link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${styles}
          <style>
            @page { size: A4; margin: 0; }
            html, body { margin: 0; padding: 0; background: #ffffff; }
            body { display: flex; justify-content: center; }
            .print-wrap { width: 210mm; margin: 0; }
            .print-wrap > * { margin: 0 !important; box-shadow: none !important; }
          </style>
        </head>
        <body>
          <div class="print-wrap">${clonedPage.outerHTML}</div>
        </body>
      </html>
    `;
  };

  const printHtmlThroughIframe = (html) =>
    new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const cleanup = () => {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 300);
      };

      iframe.onload = () => {
        try {
          const win = iframe.contentWindow;
          if (!win) throw new Error('Print frame unavailable');
          win.focus();
          win.print();
          cleanup();
          resolve();
        } catch (error) {
          cleanup();
          reject(error);
        }
      };

      const doc = iframe.contentDocument;
      if (!doc) {
        cleanup();
        reject(new Error('Print document unavailable'));
        return;
      }
      doc.open();
      doc.write(html);
      doc.close();
    });

  const downloadPdf = async () => {
    setExportError('');
    setIsExporting(true);
    try {
      const imageData = await capturePreviewImage();
      if (!imageData) throw new Error('Preview not ready');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      pdf.addImage(imageData, 'PNG', 0, 0, width, height, undefined, 'FAST');
      pdf.save(`${fileNameBase || 'resume'}.pdf`);
    } catch {
      try {
        const html = getExactPreviewHtml();
        if (!html) throw new Error('Preview not ready');
        await printHtmlThroughIframe(html);
      } catch {
        setExportError('Exact export failed. Keep preview visible and try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const downloadWord = async () => {
    setExportError('');
    setIsExporting(true);
    try {
      const imageData = await capturePreviewImage();
      if (!imageData) throw new Error('Preview not ready');

      const content = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              @page { size: A4; margin: 0; }
              html, body { margin: 0; padding: 0; background: #ffffff; }
              .page { width: 794px; margin: 0 auto; }
              img { width: 100%; display: block; }
            </style>
          </head>
          <body>
            <div class="page">
              <img src="${imageData}" alt="Resume" />
            </div>
          </body>
        </html>
      `;

      const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileNameBase || 'resume'}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      try {
        const html = getExactPreviewHtml();
        if (!html) throw new Error('Preview not ready');
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileNameBase || 'resume'}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch {
        setExportError('Exact export failed. Keep preview visible and try again.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 pt-24">
      <div className="mx-auto grid max-w-[1880px] grid-cols-1 gap-5 px-4 pb-5 xl:grid-cols-[minmax(560px,720px)_minmax(760px,1fr)]">
        <div className="space-y-5 rounded-[28px] border border-base-300 bg-base-100 p-5 shadow-lg xl:h-[calc(100vh-7.5rem)] xl:overflow-y-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <span className="badge badge-outline badge-primary mb-3">Simple Builder</span>
              <h2 className="text-3xl font-bold text-primary">Resume Form</h2>
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
            <input type="checkbox" />
            <div className="collapse-title pr-20">
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

        <div className="rounded-[28px] border border-base-300 bg-base-100 p-4 shadow-lg xl:sticky xl:top-24 xl:h-[calc(100vh-7.5rem)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] opacity-70">A4 Preview</p>
              <p className="mt-1 text-sm text-base-content/60">The preview uses the full panel so you can inspect spacing more easily.</p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button type="button" className="btn btn-sm btn-outline" onClick={downloadWord} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Download Word'}
              </button>
              <button type="button" className="btn btn-sm btn-primary" onClick={downloadPdf} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Download PDF'}
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
      </div>
    </div>
  );
}

export default ResumeForm;
