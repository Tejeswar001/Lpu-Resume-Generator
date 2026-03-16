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

export const parseTextImport = (rawText) => {
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
        items: Array.isArray(entry?.items)
          ? entry.items.map((v) => toString(v)).join(', ')
          : toString(entry?.items),
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
