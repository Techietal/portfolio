import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Profile = CollectionEntry<'profile'>['data'];
export type Project = CollectionEntry<'projects'>;
export type Experience = CollectionEntry<'experience'>;
export type Publication = CollectionEntry<'publications'>;

export interface HighlightPart {
  text: string;
  hl: boolean;
}

export const SITE = {
  name: 'Silaparasetti Lohith',
  locale: 'en_IN',
} as const;

/**
 * Load the single profile entry's data.
 * Throws a clear error if `src/content/profile/profile.yaml` is missing.
 */
export async function getProfile(): Promise<Profile> {
  const entry = await getEntry('profile', 'profile');
  if (!entry) {
    throw new Error(
      'Profile entry not found: expected src/content/profile/profile.yaml (collection "profile", id "profile").',
    );
  }
  return entry.data;
}

/** Sort entries ascending by their frontmatter `order` field. */
function byOrderAsc(a: { data: { order: number } }, b: { data: { order: number } }): number {
  return a.data.order - b.data.order;
}

/** All projects, sorted ascending by `order`. */
export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection('projects');
  return entries.sort(byOrderAsc);
}

/** All experience entries, sorted ascending by `order`. */
export async function getExperience(): Promise<Experience[]> {
  const entries = await getCollection('experience');
  return entries.sort(byOrderAsc);
}

/** All publications, sorted ascending by `order`. */
export async function getPublications(): Promise<Publication[]> {
  const entries = await getCollection('publications');
  return entries.sort(byOrderAsc);
}

/**
 * Split highlight syntax into plain and highlighted parts.
 * "Agents that [ship.]" ->
 *   [{ text: 'Agents that ', hl: false }, { text: 'ship.', hl: true }]
 */
export function parseHighlight(text: string): HighlightPart[] {
  const parts: HighlightPart[] = [];
  const pattern = /\[([^\]]+)\]/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), hl: false });
    }
    parts.push({ text: match[1], hl: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), hl: false });
  }

  return parts;
}
