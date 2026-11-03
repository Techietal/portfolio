/**
 * JSON-LD builders (PLAN.md §6.3).
 *
 * Pure functions: every value comes from the profile / content collections or
 * the site URL — nothing here invents a fact. Callers pass `currentCompany`
 * explicitly (it is a judgement call, not a profile field).
 */

import type { CollectionEntry } from 'astro:content';
import { getProfile } from './site';

type Profile = Awaited<ReturnType<typeof getProfile>>;

const CONTEXT = 'https://schema.org';

interface IdReference {
  '@id': string;
}

interface OrganizationReference {
  '@type': 'Organization';
  name: string;
}

export interface PostalAddressJsonLd {
  '@type': 'PostalAddress';
  addressLocality?: string;
  addressRegion?: string;
  addressCountry?: string;
}

export interface EducationalOccupationalCredentialJsonLd {
  '@type': 'EducationalOccupationalCredential';
  name: string;
  url: string;
  recognizedBy: OrganizationReference;
}

export interface PersonJsonLd {
  '@context': typeof CONTEXT;
  '@type': 'Person';
  '@id': string;
  name: string;
  alternateName?: string;
  url: string;
  image: string;
  jobTitle: string;
  worksFor?: OrganizationReference;
  alumniOf?: { '@type': 'CollegeOrUniversity'; name: string };
  address?: PostalAddressJsonLd;
  email?: string;
  award?: string[];
  hasCredential?: EducationalOccupationalCredentialJsonLd[];
  knowsAbout?: string[];
  sameAs?: string[];
}

export interface WebSiteJsonLd {
  '@context': typeof CONTEXT;
  '@type': 'WebSite';
  name: string;
  url: string;
  author: IdReference;
}

export interface ScholarlyArticleJsonLd {
  '@context': typeof CONTEXT;
  '@type': 'ScholarlyArticle';
  headline: string;
  datePublished: string;
  publisher: OrganizationReference;
  isPartOf: { '@type': 'Periodical'; name: string };
  url: string;
  author: IdReference;
}

export interface ProjectJsonLd {
  '@context': typeof CONTEXT;
  '@type': 'SoftwareSourceCode' | 'CreativeWork';
  '@id': string;
  name: string;
  description: string;
  url: string;
  author: IdReference;
  codeRepository?: string;
  keywords?: string[];
}

export interface BreadcrumbJsonLd {
  '@context': typeof CONTEXT;
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }>;
}

/** The Person node's stable id, shared by every referencing object. */
function personId(site: URL): string {
  return new URL('/#person', site).href;
}

/** Site root URL as a string (canonical home page). */
function siteRoot(site: URL): string {
  return new URL('/', site).href;
}

/**
 * Curated `knowsAbout` list: the first two items of every skill group,
 * capped at 10 — derived from the profile, never hand-typed here.
 */
function curatedSkills(profile: Profile): string[] {
  const knowsAbout: string[] = [];
  for (const group of profile.skills) {
    for (const item of group.items.slice(0, 2)) {
      if (knowsAbout.length < 10) {
        knowsAbout.push(item);
      }
    }
  }
  return knowsAbout;
}

/** "Noida, Uttar Pradesh, India" → PostalAddress parts. */
function postalAddress(location: string): PostalAddressJsonLd {
  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const address: PostalAddressJsonLd = { '@type': 'PostalAddress' };
  if (parts[0]) address.addressLocality = parts[0];
  if (parts[1]) address.addressRegion = parts[1];
  if (parts.length > 2) {
    const country = parts[parts.length - 1];
    if (country) address.addressCountry = country;
  }
  return address;
}

export function personJsonLd(
  profile: Profile,
  site: URL,
  imageUrl: string,
  options: { currentCompany?: string; sameAs?: string[] } = {},
): PersonJsonLd {
  const person: PersonJsonLd = {
    '@context': CONTEXT,
    '@type': 'Person',
    '@id': personId(site),
    name: profile.name,
    url: siteRoot(site),
    image: imageUrl,
    jobTitle: profile.role,
  };

  if (profile.alternateName) person.alternateName = profile.alternateName;

  if (options.currentCompany) {
    person.worksFor = { '@type': 'Organization', name: options.currentCompany };
  }

  const school = profile.education[0];
  if (school) {
    person.alumniOf = { '@type': 'CollegeOrUniversity', name: school.institution };
  }

  if (profile.location) person.address = postalAddress(profile.location);

  if (profile.contact?.email) person.email = `mailto:${profile.contact.email}`;

  const awards = profile.achievements.map((achievement) => achievement.title);
  if (awards.length > 0) person.award = awards;

  const credentials = profile.certifications.map((certification) => ({
    '@type': 'EducationalOccupationalCredential' as const,
    name: certification.name,
    url: certification.url,
    recognizedBy: { '@type': 'Organization' as const, name: certification.issuer },
  }));
  if (credentials.length > 0) person.hasCredential = credentials;

  const knowsAbout = curatedSkills(profile);
  if (knowsAbout.length > 0) person.knowsAbout = knowsAbout;

  const sameAs = [
    ...(profile.contact?.links ?? []).map((link) => link.url),
    ...(options.sameAs ?? []),
  ];
  if (sameAs.length > 0) person.sameAs = sameAs;

  return person;
}

export function websiteJsonLd(profile: Profile, site: URL): WebSiteJsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    name: profile.name,
    url: siteRoot(site),
    author: { '@id': personId(site) },
  };
}

export function articleJsonLd(
  pub: CollectionEntry<'publications'>,
  site: URL,
): ScholarlyArticleJsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'ScholarlyArticle',
    headline: pub.data.title,
    datePublished: String(pub.data.year),
    publisher: { '@type': 'Organization', name: pub.data.publisher },
    isPartOf: { '@type': 'Periodical', name: pub.data.venue },
    url: pub.data.url,
    author: { '@id': personId(site) },
  };
}

export function projectJsonLd(
  project: CollectionEntry<'projects'>,
  site: URL,
): ProjectJsonLd {
  const pageUrl = new URL(`/projects/${project.id}`, site).href;
  const repoLink = project.data.links.find((link) =>
    /github\.com|gitlab\.com/i.test(link.url),
  );

  const entry: ProjectJsonLd = {
    '@context': CONTEXT,
    // SoftwareSourceCode when there is a repo, CreativeWork otherwise (§6.3).
    '@type': repoLink ? 'SoftwareSourceCode' : 'CreativeWork',
    '@id': pageUrl,
    name: project.data.title,
    description: project.data.tagline,
    url: pageUrl,
    author: { '@id': personId(site) },
  };

  if (repoLink) entry.codeRepository = repoLink.url;

  if (project.data.tech.length > 0) entry.keywords = [...project.data.tech];

  return entry;
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
  site: URL,
): BreadcrumbJsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.path, site).href,
    })),
  };
}
