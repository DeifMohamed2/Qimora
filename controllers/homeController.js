/* ============================================================
   Home Controller
   ============================================================ */

const Project = require('../models/Project');
const { resolveTechStack } = require('../lib/techStackIcons');
const { projectToClient } = require('../lib/projectView');
const { accentGlow, accentDim } = require('../lib/colorUtils');

// @desc    Render landing page
// @route   GET /
exports.getHomePage = async (req, res, next) => {
  try {
    const docs = await Project.find({ isPublished: true }).sort({ order: 1, title: 1 }).lean();

    const portfolioProjects = docs.map((p, i) => {
      const accent = p.color || '#3B5BFF';
      return {
        id: p.slug,
        index: String(i + 1).padStart(2, '0'),
        title: p.title,
        category: p.category,
        year: p.cardYear || String(new Date().getFullYear()),
        description: p.description,
        image: p.image,
        accent,
        glow: accentGlow(accent),
        dim: accentDim(accent),
        metrics: (p.stats || []).map((s) => ({ v: s.value, l: s.label })),
        tags: (p.technologies || []).slice(0, 6),
        flip: i % 2 === 1
      };
    });

    res.render('index', {
      title: 'Qimora — Build Once. Scale Fast.',
      layout: 'layout',
      portfolioProjects
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Render case study page
// @route   GET /case-study/:id
exports.getCaseStudy = async (req, res, next) => {
  try {
    const slug = req.params.id;
    const doc = await Project.findOne({ slug, isPublished: true }).lean();

    if (!doc) {
      return res.status(404).render('404', {
        title: 'Project Not Found',
        layout: 'layout'
      });
    }

    const project = projectToClient(doc);

    res.render('case-study', {
      title: `${project.title} — Qimora Case Study`,
      layout: 'layout',
      project,
      techStack: resolveTechStack(project.technologies || [])
    });
  } catch (err) {
    next(err);
  }
};
