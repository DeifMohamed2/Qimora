/* ============================================================
   Default portfolio + case study seed data (from legacy static)
   ============================================================ */

module.exports = [
  {
    slug: 'enterprise-suite',
    title: 'Enterprise Management Suite',
    category: 'Enterprise Ecosystem',
    description:
      'Complete business management platform with integrated modules for HR, finance, inventory, and operations.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1600&h=900&fit=crop',
    color: '#FF9F43',
    icon: 'building-2',
    isEcosystem: true,
    industry: 'Manufacturing & Retail',
    duration: '8 months',
    teamSize: '4 developers',
    platforms: 'Web, Mobile, Desktop',
    cardYear: '2024',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS'],
    hasWebsite: true,
    websiteUrl: 'https://qimora.app',
    hasMobileApp: false,
    appStoreUrl: '',
    playStoreUrl: '',
    hasAI: false,
    overview:
      'A comprehensive enterprise resource planning (ERP) system designed to unify and streamline all business operations under one powerful platform. The client, a mid-sized manufacturing company with retail operations, needed a solution that could replace multiple disconnected legacy systems while providing real-time visibility across their entire operation.',
    challenge:
      'The client was struggling with fragmented data across 5+ legacy systems, manual processes consuming hundreds of hours monthly, lack of real-time visibility into operations, and inconsistent reporting that delayed critical business decisions. They needed a unified solution that could scale with their growth.',
    techRationale:
      'React for a responsive admin experience, Node.js for a unified API layer, PostgreSQL for relational integrity across modules, Redis for session and cache, Docker + AWS for resilient deployment.',
    subProjects: [
      {
        name: 'HR & Attendance System',
        icon: 'users',
        desc: 'Employee management, attendance tracking, payroll integration',
        fullDesc:
          'Complete human resources management with biometric attendance integration, leave management, performance tracking, and automated payroll calculations.',
        features: [
          'Biometric clock-in/out integration',
          'Automated leave calculations',
          'Performance review workflows',
          'Payroll report generation'
        ]
      },
      {
        name: 'Financial Dashboard',
        icon: 'bar-chart-3',
        desc: 'Real-time analytics, reporting, budget management',
        fullDesc:
          'Comprehensive financial management with real-time cash flow monitoring, expense tracking, invoice management, and multi-currency support.',
        features: [
          'Real-time P&L statements',
          'Automated invoice generation',
          'Budget vs actual tracking',
          'Tax compliance reports'
        ]
      },
      {
        name: 'Inventory Control',
        icon: 'package',
        desc: 'Stock management, supplier portal, automated ordering',
        fullDesc:
          'Smart inventory management with barcode scanning, automatic reorder points, supplier management, and warehouse optimization.',
        features: [
          'Barcode/QR scanning',
          'Auto-reorder triggers',
          'Supplier performance tracking',
          'Multi-warehouse support'
        ]
      },
      {
        name: 'Operations Hub',
        icon: 'settings',
        desc: 'Workflow automation, task management, communications',
        fullDesc:
          'Central operations control with customizable workflows, task assignment, team communications, and productivity analytics.',
        features: [
          'Custom workflow builder',
          'Task automation rules',
          'Team collaboration tools',
          'KPI dashboards'
        ]
      }
    ],
    stats: [
      { label: 'Modules', value: '4' },
      { label: 'Users', value: '500+' },
      { label: 'Uptime', value: '99.9%' }
    ],
    results: [
      { value: '60%', label: 'Time Saved', desc: 'Reduction in manual data entry and administrative tasks' },
      { value: '35%', label: 'Cost Reduction', desc: 'Lower operational costs through automation and efficiency' },
      { value: '100%', label: 'Data Accuracy', desc: 'Eliminated discrepancies with unified data source' },
      { value: '3x', label: 'Faster Reporting', desc: 'Real-time reports replacing weekly manual compilation' }
    ],
    testimonial: {
      quote:
        'Qimora transformed our entire operation. What used to take our team days now happens automatically. The visibility we have into our business is incredible.',
      name: 'Mohammed Al-Rashid',
      role: 'Operations Director',
      avatar: 'MA'
    },
    isPublished: true,
    order: 0
  },
  {
    slug: 'elearning',
    title: 'E-Learning Platform',
    category: 'Education Technology',
    description:
      'Comprehensive learning management system with live classes, assessments, certifications, and student analytics.',
    image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=1600&h=900&fit=crop',
    color: '#3B5BFF',
    icon: 'graduation-cap',
    isEcosystem: false,
    industry: 'Education',
    duration: '5 months',
    teamSize: '3 developers',
    platforms: 'Web, iOS, Android',
    technologies: ['Next.js', 'Node.js', 'MongoDB', 'WebRTC', 'Flutter', 'Firebase'],
    hasWebsite: true,
    websiteUrl: 'https://qimora.app',
    hasMobileApp: true,
    appStoreUrl: '#',
    playStoreUrl: '#',
    hasAI: true,
    overview:
      'A full-featured learning management system built for a growing educational institution looking to expand their reach beyond physical classrooms. The platform needed to support thousands of concurrent users while maintaining a seamless experience for both instructors and students.',
    challenge:
      "The institution was limited to in-person classes, losing potential students who couldn't attend physically. They needed a platform that could handle live video classes, recorded content, interactive assessments, and provide detailed analytics on student progress—all while being mobile-friendly for students on the go.",
    techRationale:
      'Next.js for SEO and fast web delivery, WebRTC for live classes, Flutter for native mobile parity, MongoDB for flexible course content, Firebase for push and auth.',
    features: ['Live Video Classes', 'Interactive Quizzes', 'Progress Tracking', 'Certificate Generation'],
    fullFeatures: [
      {
        icon: 'video',
        title: 'Live Video Classes',
        desc: 'HD video streaming with real-time chat, screen sharing, virtual whiteboard, and recording capabilities for later viewing.'
      },
      {
        icon: 'file-question',
        title: 'Interactive Assessments',
        desc: 'Multiple question types including multiple choice, essay, code exercises, and timed exams with automatic grading.'
      },
      {
        icon: 'trending-up',
        title: 'Progress Analytics',
        desc: 'Detailed dashboards showing student engagement, completion rates, quiz scores, and learning path recommendations.'
      },
      {
        icon: 'award',
        title: 'Certificate System',
        desc: 'Automated certificate generation upon course completion with verification system and LinkedIn integration.'
      },
      {
        icon: 'message-circle',
        title: 'Discussion Forums',
        desc: 'Course-specific forums with Q&A features, instructor responses, and peer learning communities.'
      },
      {
        icon: 'smartphone',
        title: 'Mobile Learning',
        desc: 'Native iOS and Android apps with offline content download, push notifications, and seamless sync.'
      }
    ],
    mobileScreenshots: [
      { url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=390&h=844&fit=crop', caption: 'Home Feed' },
      { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=390&h=844&fit=crop', caption: 'Course Player' },
      { url: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=390&h=844&fit=crop', caption: 'Live Class' },
      { url: 'https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=390&h=844&fit=crop', caption: 'Progress Tracker' },
      { url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=390&h=844&fit=crop', caption: 'Certificate' }
    ],
    stats: [
      { label: 'Students', value: '2K+' },
      { label: 'Courses', value: '50+' },
      { label: 'Completion', value: '94%' }
    ],
    results: [
      { value: '300%', label: 'Student Growth', desc: 'Increased enrollment by reaching students beyond geographic limits' },
      { value: '94%', label: 'Completion Rate', desc: 'Industry-leading course completion through engagement features' },
      { value: '4.8★', label: 'User Rating', desc: 'Highly rated by both students and instructors for ease of use' },
      { value: '50+', label: 'Active Courses', desc: 'From 12 in-person courses to 50+ online offerings' }
    ],
    testimonial: {
      quote:
        'The platform exceeded all our expectations. Our students love the mobile app, and our instructors find it incredibly easy to manage their courses. The analytics help us continuously improve.',
      name: 'Dr. Sarah Mitchell',
      role: 'Academic Director',
      avatar: 'SM'
    },
    isPublished: true,
    order: 1
  },
  {
    slug: 'logistics',
    title: 'Logistics & Delivery App',
    category: 'Mobile Application',
    description: 'Cross-platform mobile app for fleet management, real-time tracking, and delivery optimization.',
    image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1600&h=900&fit=crop',
    color: '#FF9F43',
    icon: 'truck',
    isEcosystem: false,
    industry: 'Logistics & Transportation',
    duration: '4 months',
    teamSize: '3 developers',
    platforms: 'iOS, Android, Web Dashboard',
    technologies: ['Flutter', 'Node.js', 'MongoDB', 'Google Maps API', 'Firebase', 'Socket.io'],
    hasWebsite: true,
    websiteUrl: 'https://qimora.app',
    hasMobileApp: true,
    appStoreUrl: '#',
    playStoreUrl: '#',
    hasAI: true,
    overview:
      'A comprehensive logistics solution built for a fast-growing delivery company. The system includes a driver mobile app, customer tracking interface, and an admin dashboard for fleet management—all working together in real-time to ensure efficient deliveries.',
    challenge:
      'The client was managing deliveries through phone calls and spreadsheets, leading to missed deliveries, unhappy customers, and no visibility into driver locations. They needed a solution that could scale from 50 to 500+ drivers while maintaining real-time tracking accuracy.',
    techRationale:
      'Flutter for one codebase on iOS/Android, Socket.io for live location, Maps APIs for routing, Firebase for reliability at the edge.',
    features: ['Real-time GPS Tracking', 'Route Optimization', 'Driver Management', 'Customer Notifications'],
    fullFeatures: [
      {
        icon: 'map-pin',
        title: 'Real-time GPS Tracking',
        desc: 'Live location tracking with 5-second updates, geofencing alerts, and historical route playback.'
      },
      {
        icon: 'route',
        title: 'Smart Route Optimization',
        desc: 'AI-powered route planning considering traffic, delivery windows, and vehicle capacity.'
      },
      {
        icon: 'users',
        title: 'Driver Management',
        desc: 'Complete driver profiles, performance metrics, shift scheduling, and in-app communication.'
      },
      {
        icon: 'bell',
        title: 'Customer Notifications',
        desc: 'Automated SMS/push notifications for delivery status, ETA updates, and delivery confirmation.'
      },
      {
        icon: 'clipboard-check',
        title: 'Proof of Delivery',
        desc: 'Photo capture, digital signatures, and timestamp verification for every delivery.'
      },
      {
        icon: 'bar-chart-2',
        title: 'Analytics Dashboard',
        desc: 'Fleet performance metrics, delivery success rates, and operational insights.'
      }
    ],
    mobileScreenshots: [
      { url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=390&h=844&fit=crop', caption: 'Driver Dashboard' },
      { url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=390&h=844&fit=crop', caption: 'Live GPS Map' },
      { url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=390&h=844&fit=crop', caption: 'Delivery List' },
      { url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=390&h=844&fit=crop', caption: 'Route Optimizer' },
      { url: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=390&h=844&fit=crop', caption: 'Proof of Delivery' }
    ],
    stats: [
      { label: 'Deliveries', value: '10K+' },
      { label: 'Drivers', value: '200+' },
      { label: 'Rating', value: '4.8★' }
    ],
    results: [
      { value: '40%', label: 'Faster Deliveries', desc: 'Route optimization reduced average delivery time significantly' },
      { value: '95%', label: 'On-time Rate', desc: 'Up from 72% with the previous manual system' },
      { value: '25%', label: 'Fuel Savings', desc: 'Optimized routes reduced total distance traveled' },
      { value: '60%', label: 'Fewer Complaints', desc: 'Real-time tracking reduced customer inquiries dramatically' }
    ],
    testimonial: {
      quote:
        'This app changed everything for us. Our drivers love it, customers can track their packages, and I can see my entire fleet from one dashboard. Worth every penny.',
      name: 'James Rodriguez',
      role: 'CEO, FastTrack Logistics',
      avatar: 'JR'
    },
    isPublished: true,
    order: 2
  },
  {
    slug: 'healthcare',
    title: 'Healthcare Management System',
    category: 'Healthcare Solution',
    description:
      'Integrated clinic management with patient records, appointment scheduling, billing, and telemedicine.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=1600&h=900&fit=crop',
    color: '#3B5BFF',
    icon: 'stethoscope',
    isEcosystem: true,
    ecosystemSectionLabel: 'Integrated Systems',
    ecosystemTitle: 'A Complete Ecosystem',
    ecosystemSubtitle: 'A suite of tightly integrated modules working as one unified platform.',
    industry: 'Healthcare',
    duration: '7 months',
    teamSize: '4 developers',
    platforms: 'Web, iOS, Android',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'WebRTC', 'Flutter', 'AWS', 'HL7 FHIR'],
    hasWebsite: true,
    websiteUrl: 'https://qimora.app',
    hasMobileApp: true,
    appStoreUrl: '#',
    playStoreUrl: '#',
    hasAI: false,
    overview:
      'A comprehensive healthcare management system built for a network of clinics needing to modernize their operations. The platform handles everything from patient registration to billing, with a focus on security, compliance, and ease of use for both medical staff and patients.',
    challenge:
      'The clinic network was drowning in paperwork, with patient records scattered across locations, appointment scheduling done manually, and no way to offer remote consultations. They needed a HIPAA-compliant solution that could unify their operations while enabling telemedicine.',
    techRationale:
      'PostgreSQL + FHIR alignment for interoperability, WebRTC for telemedicine, Flutter for patient apps, AWS for compliance-ready hosting.',
    subProjects: [
      {
        name: 'Patient Portal',
        icon: 'heart-pulse',
        desc: 'Medical records, prescriptions, appointment booking',
        fullDesc:
          'Secure patient portal with complete medical history access, prescription management, appointment scheduling, and health document uploads.',
        features: [
          'Medical history timeline',
          'Prescription refill requests',
          'Online appointment booking',
          'Secure document sharing'
        ]
      },
      {
        name: 'Clinic Dashboard',
        icon: 'activity',
        desc: 'Staff scheduling, resource management, analytics',
        fullDesc:
          'Comprehensive admin dashboard for clinic managers to oversee appointments, staff schedules, room allocation, and financial performance.',
        features: [
          'Visual appointment calendar',
          'Staff shift management',
          'Resource utilization reports',
          'Revenue analytics'
        ]
      },
      {
        name: 'Telemedicine',
        icon: 'video',
        desc: 'Video consultations, chat support, e-prescriptions',
        fullDesc:
          'Full telemedicine suite with HD video consultations, secure messaging, digital prescriptions, and integration with local pharmacies.',
        features: [
          'HD video consultations',
          'Waiting room management',
          'E-prescription system',
          'Pharmacy integration'
        ]
      }
    ],
    mobileScreenshots: [
      { url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=390&h=844&fit=crop', caption: 'Patient Portal' },
      { url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=390&h=844&fit=crop', caption: 'Appointments' },
      { url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=390&h=844&fit=crop', caption: 'Telemedicine' },
      { url: 'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=390&h=844&fit=crop', caption: 'Medical Records' }
    ],
    stats: [
      { label: 'Patients', value: '5K+' },
      { label: 'Clinics', value: '12' },
      { label: 'Consultations', value: '15K+' }
    ],
    results: [
      { value: '50%', label: 'Admin Time Saved', desc: 'Automated scheduling and records reduced paperwork dramatically' },
      { value: '30%', label: 'More Appointments', desc: 'Telemedicine enabled doctors to see more patients' },
      { value: '99.9%', label: 'Uptime', desc: 'Mission-critical reliability for healthcare operations' },
      { value: '4.9★', label: 'Patient Satisfaction', desc: 'Patients love the easy booking and video consultations' }
    ],
    testimonial: {
      quote:
        'The system has transformed how we deliver care. Our staff spends less time on admin and more time with patients. The telemedicine feature was a game-changer during the pandemic.',
      name: 'Dr. Ahmed Hassan',
      role: 'Medical Director',
      avatar: 'AH'
    },
    isPublished: true,
    order: 3
  }
];
