/* ==========================================================================
   Lucide SVG Icon Pack for Control Tower (1.5px stroke, semantic tokens)
   ========================================================================== */

export const Icons = {
  dashboard: (size = 18, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1"/>
      <rect width="7" height="5" x="14" y="3" rx="1"/>
      <rect width="7" height="9" x="14" y="12" rx="1"/>
      <rect width="7" height="5" x="3" y="16" rx="1"/>
    </svg>
  `,

  sources: (size = 18, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
      <path d="M6 6h10"/>
      <path d="M6 10h10"/>
      <path d="M6 14h6"/>
    </svg>
  `,

  prompts: (size = 18, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="m5 10 4 4-4 4"/>
      <path d="M12 18h7"/>
      <rect width="20" height="18" x="2" y="3" rx="2"/>
    </svg>
  `,

  skills: (size = 18, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v4"/>
      <path d="m4.93 4.93 2.83 2.83"/>
      <path d="M2 12h4"/>
      <path d="m4.93 19.07 2.83-2.83"/>
      <path d="M12 18v4"/>
      <path d="m16.24 16.24 2.83 2.83"/>
      <path d="M18 12h4"/>
      <path d="m16.24 7.76 2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  `,

  workflows: (size = 18, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <rect width="6" height="6" x="3" y="3" rx="1"/>
      <rect width="6" height="6" x="15" y="3" rx="1"/>
      <rect width="6" height="6" x="9" y="15" rx="1"/>
      <path d="M6 9v3a3 3 0 0 0 3 3h3"/>
      <path d="M18 9v3a3 3 0 0 1-3 3"/>
    </svg>
  `,

  mcp: (size = 18, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <rect width="18" height="14" x="3" y="5" rx="2"/>
      <path d="M8 21h8"/>
      <path d="M12 19v2"/>
      <path d="M7 11h2"/>
      <path d="M11 11h6"/>
    </svg>
  `,

  rules: (size = 18, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  `,

  gitops: (size = 18, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18" cy="18" r="3"/>
      <circle cx="6" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <path d="M18 15V9a3 3 0 0 0-3-3H9"/>
      <path d="M6 9v6"/>
    </svg>
  `,

  search: (size = 18, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.3-4.3"/>
    </svg>
  `,

  terminal: (size = 18, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="m4 8 4 4-4 4"/>
      <path d="M12 16h8"/>
      <rect width="20" height="18" x="2" y="3" rx="2"/>
    </svg>
  `,

  refresh: (size = 16, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  `,

  plus: (size = 16, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12h14"/>
      <path d="M12 5v14"/>
    </svg>
  `,

  more: (size = 18, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="1"/>
      <circle cx="19" cy="12" r="1"/>
      <circle cx="5" cy="12" r="1"/>
    </svg>
  `,

  server: (size = 16, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <rect width="20" height="8" x="2" y="2" rx="2"/>
      <rect width="20" height="8" x="2" y="14" rx="2"/>
      <line x1="6" x2="6.01" y1="6" y2="6"/>
      <line x1="6" x2="6.01" y1="18" y2="18"/>
    </svg>
  `,

  cpu: (size = 16, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <rect width="16" height="16" x="4" y="4" rx="2"/>
      <rect width="6" height="6" x="9" y="9" rx="1"/>
      <path d="M9 1v3"/>
      <path d="M15 1v3"/>
      <path d="M9 20v3"/>
      <path d="M15 20v3"/>
      <path d="M20 9h3"/>
      <path d="M20 14h3"/>
      <path d="M1 9h3"/>
      <path d="M1 14h3"/>
    </svg>
  `,

  sparkles: (size = 16, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
    </svg>
  `,

  chevronRight: (size = 14, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  `,

  check: (size = 16, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  `,

  copy: (size = 14, className = '') => `
    <svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  `
};
