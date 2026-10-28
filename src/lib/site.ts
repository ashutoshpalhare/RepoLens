/** Static site / author metadata. */

export const SITE = {
  name: "RepoLens",
  tagline: "Read any public GitHub repository like an IDE — from your browser.",
  repoOwner: "ashutoshpalhare",
  repoName: "RepoLens",
  description:
    "A fully client-side GitHub repository explorer: file tree, syntax-highlighted code, instant insights and architecture notes. No backend, no sign-in, nothing leaves your browser.",
  license: "MIT",
};

export const REPO_URL = `https://github.com/${SITE.repoOwner}/${SITE.repoName}`;
export const ISSUES_URL = `${REPO_URL}/issues`;
export const CONTRIB_URL = `${REPO_URL}/blob/main/CONTRIBUTING.md`;

export type Social = {
  id: string;
  label: string;
  href: string;
  icon: "github" | "linkedin" | "portfolio" | "x" | "mail";
};

export const AUTHOR = {
  name: "Ashutosh Palhare",
  role: "Full-stack developer · Cybersecurity enthusiast",
  bio: "Frontend-first full-stack developer who builds fast, accessible web products and ships them with AI as an engineering multiplier.",
  socials: [
    {
      id: "github",
      label: "GitHub — @ashutoshpalhare",
      href: "https://github.com/ashutoshpalhare",
      icon: "github",
    },
    {
      id: "linkedin",
      label: "LinkedIn — Ashutosh Palhare",
      href: "https://in.linkedin.com/in/ashutoshpalhare",
      icon: "linkedin",
    },
    {
      id: "portfolio",
      label: "Portfolio — ashutoshpalhare.github.io",
      href: "https://ashutoshpalhare.github.io/",
      icon: "portfolio",
    },
    {
      id: "x",
      label: "X — @AshutoshPalhare",
      href: "https://x.com/AshutoshPalhare",
      icon: "x",
    },
  ] as Social[],
};

export const EXAMPLE_REPOS = [
  { owner: "ashutoshpalhare", repo: "RepoLens", label: "RepoLens" },
  { owner: "vercel", repo: "next.js", label: "vercel/next.js" },
  { owner: "facebook", repo: "react", label: "facebook/react" },
  { owner: "tanstack", repo: "query", label: "tanstack/query" },
];
