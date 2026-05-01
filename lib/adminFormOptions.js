/* ============================================================
   Admin project form — category & Lucide icon option lists
   ============================================================ */

/** Portfolio / case study categories (matches seeded + common additions) */
exports.PROJECT_CATEGORIES = [
  'Enterprise Ecosystem',
  'Education Technology',
  'Mobile Application',
  'Healthcare Solution',
  'SaaS / B2B',
  'FinTech',
  'Logistics & Transportation',
  'AI / ML Platform',
  'DevTools & Infrastructure',
  'E-commerce',
  'Cybersecurity',
  'Creative / Media'
];

/**
 * Lucide icon slugs — curated for case study & portfolio use.
 * @type {Array<{ value: string, label: string }>}
 */
exports.LUCIDE_ICON_OPTIONS = [
  { value: 'layers', label: 'Layers (default)' },
  { value: 'layout-grid', label: 'Layout grid' },
  { value: 'layout-dashboard', label: 'Dashboard' },
  { value: 'building-2', label: 'Building / enterprise' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'factory', label: 'Factory' },
  { value: 'graduation-cap', label: 'Education' },
  { value: 'book-open', label: 'Book / learning' },
  { value: 'truck', label: 'Logistics / truck' },
  { value: 'package', label: 'Package' },
  { value: 'stethoscope', label: 'Healthcare' },
  { value: 'heart-pulse', label: 'Heart / health' },
  { value: 'cpu', label: 'CPU / compute' },
  { value: 'brain', label: 'Brain / AI' },
  { value: 'sparkles', label: 'Sparkles / AI' },
  { value: 'bot', label: 'Bot / automation' },
  { value: 'code-2', label: 'Code' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'database', label: 'Database' },
  { value: 'server', label: 'Server' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'globe', label: 'Globe / web' },
  { value: 'smartphone', label: 'Smartphone' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'shield-check', label: 'Shield / security' },
  { value: 'lock', label: 'Lock' },
  { value: 'credit-card', label: 'Payments' },
  { value: 'line-chart', label: 'Line chart' },
  { value: 'bar-chart-3', label: 'Bar chart' },
  { value: 'activity', label: 'Activity' },
  { value: 'users', label: 'Users' },
  { value: 'rocket', label: 'Rocket / launch' },
  { value: 'zap', label: 'Zap / energy' },
  { value: 'video', label: 'Video' },
  { value: 'settings', label: 'Settings' },
  { value: 'wrench', label: 'Wrench / tools' },
  { value: 'workflow', label: 'Workflow' }
];

/** Case study duration presets (shown as select; unknown saved values get an extra option). */
exports.DURATION_OPTIONS = [
  '2 weeks',
  '1 month',
  '2 months',
  '3 months',
  '4 months',
  '5 months',
  '6 months',
  '7 months',
  '8 months',
  '9 months',
  '10 months',
  '11 months',
  '12 months',
  '12+ months',
  '18 months',
  '24 months',
  'Ongoing / retainer'
];

/** Team size presets for the case study metadata block. */
exports.TEAM_SIZE_OPTIONS = [
  'Solo / freelancer',
  '2 developers',
  '3 developers',
  '4 developers',
  '5 developers',
  '6–8 developers',
  '9–12 developers',
  '12+ developers',
  'Cross-functional squad (design + eng)',
  'Squad + product & QA'
];
