import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** A labelled external/internal link ({label, url}). */
const linkSchema = z.object({
  label: z.string(),
  url: z.url(),
});

const profile = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/profile' }),
  schema: z.object({
    name: z.string(),
    alternateName: z.string(),
    shortName: z.string(),
    initials: z.string(),
    role: z.string(),
    location: z.string(),
    /** Shown in the nav pill; may be an empty string to hide it. */
    availability: z.string(),

    seo: z.object({
      title: z.string(),
      description: z.string().max(170),
      keywords: z.array(z.string()),
    }),

    hero: z.object({
      eyebrow: z.string(),
      /** Words wrapped in [square brackets] get the highlighter. */
      headlineLines: z.array(z.string()),
      intro: z.string(),
      /** Anchor / relative hrefs, not absolute URLs. */
      primaryCta: z.object({ label: z.string(), href: z.string() }),
      secondaryCta: z.object({ label: z.string(), href: z.string() }),
      sticker: z.string(),
      posterTopLeft: z.string(),
      posterTopRight: z.string(),
      posterBottom: z.string(),
      note: z.string(),
    }),

    ticker: z.array(z.string()),

    about: z.object({
      heading: z.string(),
      paragraphs: z.array(z.string()),
    }),

    stats: z.array(
      z.object({
        value: z.string(),
        label: z.string(),
      }),
    ),

    contact: z.object({
      heading: z.string(),
      blurb: z.string(),
      email: z.string(),
      phone: z.string(),
      /** tel:-style number, not an absolute URL. */
      phoneHref: z.string(),
      links: z.array(linkSchema),
    }),

    education: z.array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        start: z.string(),
        end: z.string(),
        location: z.string(),
        detail: z.string(),
      }),
    ),

    skills: z.array(
      z.object({
        group: z.string(),
        items: z.array(z.string()),
      }),
    ),

    achievements: z.array(
      z.object({
        title: z.string(),
        detail: z.string(),
      }),
    ),

    certifications: z.array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        url: z.url(),
      }),
    ),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: z.object({
    company: z.string(),
    role: z.string(),
    start: z.string(),
    end: z.string(),
    location: z.string().optional(),
    order: z.number(),
    tags: z.array(z.string()),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string().max(120),
    order: z.number(),
    year: z.number().optional(),
    tech: z.array(z.string()),
    links: z.array(linkSchema),
    highlights: z.array(z.string()),
    color: z.enum(['mint', 'hot', 'blue', 'acid']),
    featured: z.boolean(),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    venue: z.string(),
    publisher: z.string(),
    year: z.number(),
    badge: z.string(),
    url: z.url(),
    order: z.number(),
  }),
});

export const collections = { experience, projects, publications, profile };
