/**
 * Global technology brand icons.
 *
 * Sources:
 * - Devicon colored SVGs (transparent bg, correct brand colors for dev tools)
 *   https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/{dir}/{file}.svg
 * - Simple Icons (monochrome transparent, brand hex colour in CSS var)
 *   https://cdn.jsdelivr.net/npm/simple-icons@11.15.0/icons/{slug}.svg
 *
 * Rule: NEVER use a devicon variant that embeds a filled background circle/rect
 * (e.g. nextjs-original → black circle, nodejs-original → gradient hexagon).
 * Use *-plain or a Simple Icons slug for those.
 *
 * Keys are normalized (lowercase, single spaces). Aliases cover admin checklist
 * labels in lib/technologyOptions.js.
 */

const DV = 'https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons';
const SI = 'https://cdn.jsdelivr.net/npm/simple-icons@11.15.0/icons';

/**
 * Each entry:
 *   { url, color, invert? }
 *   url   – full CDN URL to the SVG
 *   color – CSS color shown as the icon's foreground tint (dark-mode safe)
 *   invert – when true, icon paths are lightened for dark backgrounds
 */
const MAP = {
  /* ── JavaScript / TypeScript ── */
  react: { url: `${DV}/react/react-original.svg`, color: '#61DAFB' },
  'react native': { url: `${DV}/react/react-original.svg`, color: '#61DAFB' },
  reactnative: { url: `${DV}/react/react-original.svg`, color: '#61DAFB' },
  typescript: { url: `${DV}/typescript/typescript-original.svg`, color: '#3178C6' },
  javascript: { url: `${DV}/javascript/javascript-original.svg`, color: '#F7DF1E' },

  /* ── Node / JS runtimes ── */
  'node.js': { url: `${DV}/nodejs/nodejs-original.svg`, color: '#5FA04E' },
  nodejs: { url: `${DV}/nodejs/nodejs-original.svg`, color: '#5FA04E' },
  express: { url: `${DV}/express/express-original.svg`, color: '#444444' },
  expressjs: { url: `${DV}/express/express-original.svg`, color: '#444444' },
  nestjs: { url: `${DV}/nestjs/nestjs-plain.svg`, color: '#E0234E' },
  fastify: { url: `${DV}/fastify/fastify-plain.svg`, color: '#000000', invert: true },
  electron: { url: `${DV}/electron/electron-original.svg`, color: '#47848F' },

  /* ── Next / Nuxt / Remix / meta-frameworks ── */
  'next.js': { url: `${DV}/nextjs/nextjs-plain.svg`, color: '#FFFFFF', invert: true },
  nextjs: { url: `${DV}/nextjs/nextjs-plain.svg`, color: '#FFFFFF', invert: true },
  nuxt: { url: `${DV}/nuxtjs/nuxtjs-plain.svg`, color: '#00DC82' },
  nuxtjs: { url: `${DV}/nuxtjs/nuxtjs-plain.svg`, color: '#00DC82' },
  remix: { url: `${SI}/remix.svg`, color: '#FFFFFF', invert: true },
  astro: { url: `${DV}/astro/astro-plain.svg`, color: '#FF5D01' },
  svelte: { url: `${DV}/svelte/svelte-plain.svg`, color: '#FF3E00' },
  sveltekit: { url: `${DV}/svelte/svelte-plain.svg`, color: '#FF3E00' },
  solidjs: { url: `${DV}/solidjs/solidjs-plain.svg`, color: '#446B9E' },

  /* ── Vue / CSS ── */
  vue: { url: `${DV}/vuejs/vuejs-plain.svg`, color: '#42B883' },
  vuejs: { url: `${DV}/vuejs/vuejs-plain.svg`, color: '#42B883' },
  'vue.js': { url: `${DV}/vuejs/vuejs-plain.svg`, color: '#42B883' },
  tailwindcss: { url: `${DV}/tailwindcss/tailwindcss-original.svg`, color: '#38BDF8' },
  tailwind: { url: `${DV}/tailwindcss/tailwindcss-original.svg`, color: '#38BDF8' },
  'tailwind css': { url: `${DV}/tailwindcss/tailwindcss-original.svg`, color: '#38BDF8' },
  bootstrap: { url: `${DV}/bootstrap/bootstrap-plain.svg`, color: '#7952B3' },
  sass: { url: `${DV}/sass/sass-original.svg`, color: '#CC6699' },
  redux: { url: `${DV}/redux/redux-original.svg`, color: '#764ABC' },
  zustand: { url: `${DV}/redux/redux-original.svg`, color: '#764ABC' },
  webpack: { url: `${DV}/webpack/webpack-plain.svg`, color: '#8DD6F9' },
  vite: { url: `${DV}/vite/vite-plain.svg`, color: '#646CFF' },

  /* ── Angular ── */
  angular: { url: `${DV}/angular/angular-original.svg`, color: '#DD0031' },

  /* ── Python ── */
  python: { url: `${DV}/python/python-plain.svg`, color: '#3776AB' },
  django: { url: `${DV}/django/django-plain.svg`, color: '#092E20' },
  flask: { url: `${DV}/flask/flask-original.svg`, color: '#000000', invert: true },
  fastapi: { url: `${DV}/fastapi/fastapi-original.svg`, color: '#009688' },

  /* ── JVM / Android ── */
  java: { url: `${DV}/java/java-plain.svg`, color: '#ED8B00' },
  kotlin: { url: `${DV}/kotlin/kotlin-plain.svg`, color: '#7F52FF' },
  spring: { url: `${DV}/spring/spring-plain.svg`, color: '#5FB832' },
  'spring boot': { url: `${DV}/spring/spring-plain.svg`, color: '#5FB832' },
  springboot: { url: `${DV}/spring/spring-plain.svg`, color: '#5FB832' },

  /* ── Ruby / PHP ── */
  ruby: { url: `${DV}/ruby/ruby-plain.svg`, color: '#CC342D' },
  'ruby on rails': { url: `${DV}/rails/rails-original-wordmark.svg`, color: '#D30001' },
  rubyonrails: { url: `${DV}/rails/rails-original-wordmark.svg`, color: '#D30001' },
  rails: { url: `${DV}/rails/rails-original-wordmark.svg`, color: '#D30001' },
  laravel: { url: `${DV}/laravel/laravel-plain.svg`, color: '#FF2D20' },
  php: { url: `${DV}/php/php-plain.svg`, color: '#777BB4' },

  /* ── Go / Rust / C / .NET ── */
  go: { url: `${DV}/go/go-original.svg`, color: '#00ADD8' },
  gin: { url: `${SI}/gin.svg`, color: '#FFFFFF', invert: true },
  rust: { url: `${DV}/rust/rust-plain.svg`, color: '#DEA584' },
  'c#': { url: `${DV}/csharp/csharp-plain.svg`, color: '#239120' },
  csharp: { url: `${DV}/csharp/csharp-plain.svg`, color: '#239120' },
  '.net': { url: `${DV}/dot-net/dot-net-plain.svg`, color: '#1384C8' },
  'asp.net core': { url: `${DV}/dotnetcore/dotnetcore-plain.svg`, color: '#623697' },
  aspnetcore: { url: `${DV}/dotnetcore/dotnetcore-plain.svg`, color: '#623697' },

  /* ── Apple ── */
  swift: { url: `${DV}/swift/swift-plain.svg`, color: '#F05138' },
  swiftui: { url: `${DV}/swift/swift-plain.svg`, color: '#F05138' },
  dart: { url: `${DV}/dart/dart-plain.svg`, color: '#0175C2' },

  /* ── Databases ── */
  mongodb: { url: `${DV}/mongodb/mongodb-plain.svg`, color: '#47A248' },
  mongo: { url: `${DV}/mongodb/mongodb-plain.svg`, color: '#47A248' },
  postgresql: { url: `${DV}/postgresql/postgresql-plain.svg`, color: '#4169E1' },
  postgres: { url: `${DV}/postgresql/postgresql-plain.svg`, color: '#4169E1' },
  redis: { url: `${DV}/redis/redis-plain.svg`, color: '#DC382D' },
  mysql: { url: `${DV}/mysql/mysql-original.svg`, color: '#4479A1' },
  mariadb: { url: `${DV}/mariadb/mariadb-plain.svg`, color: '#003545' },
  sqlite: { url: `${DV}/sqlite/sqlite-plain.svg`, color: '#003B57' },
  dynamodb: { url: `${DV}/dynamodb/dynamodb-original.svg`, color: '#4053D6' },
  elasticsearch: { url: `${DV}/elasticsearch/elasticsearch-plain.svg`, color: '#00BFB3' },
  elastic: { url: `${DV}/elasticsearch/elasticsearch-plain.svg`, color: '#00BFB3' },
  cosmosdb: { url: `${DV}/cosmosdb/cosmosdb-plain.svg`, color: '#59B3D8' },
  'cosmos db': { url: `${DV}/cosmosdb/cosmosdb-plain.svg`, color: '#59B3D8' },
  rabbitmq: { url: `${DV}/rabbitmq/rabbitmq-original.svg`, color: '#FF6600' },
  typeorm: { url: `${DV}/sequelize/sequelize-original.svg`, color: '#3B4B72' },

  /* ── Search / messaging ── */
  'apache kafka': { url: `${DV}/apachekafka/apachekafka-original.svg`, color: '#231F20' },
  apachekafka: { url: `${DV}/apachekafka/apachekafka-original.svg`, color: '#231F20' },

  /* ── Cloud / DevOps ── */
  docker: { url: `${DV}/docker/docker-plain.svg`, color: '#2496ED' },
  kubernetes: { url: `${DV}/kubernetes/kubernetes-plain.svg`, color: '#326CE5' },
  aws: { url: `${DV}/amazonwebservices/amazonwebservices-plain-wordmark.svg`, color: '#FF9900' },
  amazon: { url: `${DV}/amazonwebservices/amazonwebservices-plain-wordmark.svg`, color: '#FF9900' },
  'amazon web services': { url: `${DV}/amazonwebservices/amazonwebservices-plain-wordmark.svg`, color: '#FF9900' },
  azure: { url: `${DV}/azure/azure-original.svg`, color: '#0089D6' },
  gcp: { url: `${DV}/googlecloud/googlecloud-original.svg`, color: '#4285F4' },
  'google cloud': { url: `${DV}/googlecloud/googlecloud-original.svg`, color: '#4285F4' },
  googlecloud: { url: `${DV}/googlecloud/googlecloud-original.svg`, color: '#4285F4' },
  digitalocean: { url: `${DV}/digitalocean/digitalocean-plain.svg`, color: '#0080FF' },
  heroku: { url: `${DV}/heroku/heroku-plain.svg`, color: '#430098' },
  terraform: { url: `${DV}/terraform/terraform-plain.svg`, color: '#7B42BC' },
  ansible: { url: `${DV}/ansible/ansible-plain.svg`, color: '#1A1918', invert: true },
  nginx: { url: `${DV}/nginx/nginx-original.svg`, color: '#009639' },
  jenkins: { url: `${DV}/jenkins/jenkins-line.svg`, color: '#D24939' },
  circleci: { url: `${DV}/circleci/circleci-plain.svg`, color: '#343434' },
  'github actions': { url: `${DV}/githubactions/githubactions-plain.svg`, color: '#2088FF' },
  githubactions: { url: `${DV}/githubactions/githubactions-plain.svg`, color: '#2088FF' },
  gitlab: { url: `${DV}/gitlab/gitlab-plain.svg`, color: '#FC6D26' },
  'gitlab ci': { url: `${DV}/gitlab/gitlab-plain.svg`, color: '#FC6D26' },
  git: { url: `${DV}/git/git-plain.svg`, color: '#F05032' },
  bash: { url: `${DV}/bash/bash-plain.svg`, color: '#4EAA25' },

  /* ── Mobile ── */
  flutter: { url: `${DV}/flutter/flutter-plain.svg`, color: '#02569B' },

  /* ── Backend / BaaS ── */
  firebase: { url: `${DV}/firebase/firebase-plain.svg`, color: '#FFCA28' },
  'firebase firestore': { url: `${DV}/firebase/firebase-plain.svg`, color: '#FFCA28' },
  supabase: { url: `${DV}/supabase/supabase-original.svg`, color: '#3ECF8E' },

  /* ── Realtime / sockets ── */
  'socket.io': { url: `${SI}/socketdotio.svg`, color: '#FFFFFF', invert: true },
  socketio: { url: `${SI}/socketdotio.svg`, color: '#FFFFFF', invert: true },
  websocket: { url: `${SI}/pusher.svg`, color: '#300D72' },

  /* ── APIs / specs ── */
  graphql: { url: `${SI}/graphql.svg`, color: '#E10098' },
  grpc: { url: `${DV}/grpc/grpc-plain.svg`, color: '#244C5A' },
  openapi: { url: `${DV}/openapi/openapi-plain.svg`, color: '#91D400' },
  'rest api': { url: `${DV}/openapi/openapi-plain.svg`, color: '#91D400' },
  rest: { url: `${DV}/openapi/openapi-plain.svg`, color: '#91D400' },
  restful: { url: `${DV}/openapi/openapi-plain.svg`, color: '#91D400' },
  jwt: { url: `${SI}/jsonwebtokens.svg`, color: '#000000', invert: true },
  oauth: { url: `${DV}/oauth/oauth-plain.svg`, color: '#444444' },

  /* ── Maps / comms ── */
  webrtc: { url: `${SI}/webrtc.svg`, color: '#FFFFFF', invert: true },
  'google maps api': { url: `${SI}/googlemaps.svg`, color: '#4285F4' },
  googlemaps: { url: `${SI}/googlemaps.svg`, color: '#4285F4' },

  /* ── UI libs ── */
  'material ui': { url: `${DV}/materialui/materialui-plain.svg`, color: '#007FFF' },
  materialui: { url: `${DV}/materialui/materialui-plain.svg`, color: '#007FFF' },
  jquery: { url: `${DV}/jquery/jquery-plain.svg`, color: '#0769AD' },

  /* ── Markup ── */
  'html/css': { url: `${DV}/html5/html5-plain.svg`, color: '#E34F26' },
  'html css': { url: `${DV}/html5/html5-plain.svg`, color: '#E34F26' },

  /* ── Payments / AI / misc ── */
  stripe: { url: `${SI}/stripe.svg`, color: '#635BFF' },
  'openai api': { url: `${SI}/openai.svg`, color: '#FFFFFF', invert: true },
  openai: { url: `${SI}/openai.svg`, color: '#FFFFFF', invert: true },

  /* ── Healthcare / integration (no single brand icon) ── */
  'hl7 fhir': { url: `${SI}/openapiinitiative.svg`, color: '#6BA539' },

  /* ── Architecture (proxy icon) ── */
  microservices: { url: `${SI}/cncf.svg`, color: '#0086FF' },

  /* ── Caught by lookup fallbacks ── */
  webstorm: { url: `${DV}/webstorm/webstorm-plain.svg`, color: '#2762B7' }
};

/* ── Helpers ── */

function normKey(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, ' ');
}

function abbrFrom(name) {
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '??';
}

function lookup(name) {
  const k = normKey(name);
  const candidates = [
    k,
    k.replace(/\./g, ''),
    k.replace(/\s+api$/i, '').trim(),
    k.replace(/#/g, 'sharp').replace(/\s+/g, ''),
    k.replace(/\//g, ' ').replace(/\s+/g, ' ').trim(),
    k.replace(/\s+/g, '')
  ];
  for (const key of candidates) {
    if (key && MAP[key]) return MAP[key];
  }
  return null;
}

/**
 * Resolve one technology name into display metadata.
 * @param {string} name
 * @returns {{ name: string, url: string|null, color: string|null, abbr: string, invert: boolean }}
 */
function resolveTechStackItem(name) {
  const label = String(name).trim();
  const meta = lookup(label);
  if (!meta) return { name: label, url: null, color: null, invert: false, abbr: abbrFrom(label) };
  return { name: label, url: meta.url, color: meta.color, invert: !!meta.invert, abbr: abbrFrom(label) };
}

/**
 * Resolve an array of technology names.
 * @param {string[]} technologies
 */
function resolveTechStack(technologies) {
  if (!Array.isArray(technologies)) return [];
  return technologies.map(resolveTechStackItem);
}

module.exports = { resolveTechStack, resolveTechStackItem };
