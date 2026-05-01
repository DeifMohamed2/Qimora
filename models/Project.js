/* ============================================================
   Project / Case Study — Mongoose model
   ============================================================ */

const mongoose = require('mongoose');

const subProjectSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    icon: { type: String, default: 'layers' },
    desc: { type: String, default: '' },
    fullDesc: { type: String, default: '' },
    features: [{ type: String }]
  },
  { _id: false }
);

const fullFeatureSchema = new mongoose.Schema(
  {
    icon: { type: String, default: 'star' },
    title: { type: String, default: '' },
    desc: { type: String, default: '' }
  },
  { _id: false }
);

const resultItemSchema = new mongoose.Schema(
  {
    value: { type: String, default: '' },
    label: { type: String, default: '' },
    desc: { type: String, default: '' }
  },
  { _id: false }
);

const statItemSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    value: { type: String, default: '' }
  },
  { _id: false }
);

const screenshotSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, default: '' }
  },
  { _id: false }
);

const testimonialSchema = new mongoose.Schema(
  {
    quote: { type: String, default: '' },
    name: { type: String, default: '' },
    role: { type: String, default: '' },
    avatar: { type: String, default: '' }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug']
    },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: '' },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    extraImages: [{ type: String }],
    color: { type: String, default: '#3B5BFF' },
    icon: { type: String, default: 'layers' },

    industry: { type: String, default: '' },
    duration: { type: String, default: '' },
    teamSize: { type: String, default: '' },
    platforms: { type: String, default: '' },
    cardYear: { type: String, default: String(new Date().getFullYear()) },

    technologies: [{ type: String }],

    hasWebsite: { type: Boolean, default: false },
    websiteUrl: { type: String, default: '' },
    hasMobileApp: { type: Boolean, default: false },
    appStoreUrl: { type: String, default: '' },
    playStoreUrl: { type: String, default: '' },
    hasAI: { type: Boolean, default: false },

    isEcosystem: { type: Boolean, default: false },

    /** Section 02 copy when ecosystem layout + modules are shown */
    ecosystemSectionLabel: { type: String, default: '' },
    ecosystemTitle: { type: String, default: '' },
    ecosystemSubtitle: { type: String, default: '' },

    overview: { type: String, default: '' },
    challenge: { type: String, default: '' },
    techRationale: { type: String, default: '' },

    features: [{ type: String }],
    fullFeatures: [fullFeatureSchema],
    subProjects: [subProjectSchema],

    stats: [statItemSchema],
    results: [resultItemSchema],
    mobileScreenshots: [screenshotSchema],
    testimonial: {
      type: testimonialSchema,
      default: () => ({})
    },

    isPublished: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

projectSchema.index({ order: 1, title: 1 });
projectSchema.index({ isPublished: 1, order: 1 });

module.exports = mongoose.model('Project', projectSchema);
