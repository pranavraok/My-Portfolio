export const profile = {
  name: "Pranav Rao K",
  email: "pranavraok18@gmail.com",
  location: "Bengaluru, India",
  github: "https://github.com/pranavraok",
  linkedin: "https://www.linkedin.com/in/pranav-rao-k/",
  resume: "/media/pranav-rao-resume.pdf",
};

export const projects = [
  {
    slug: "mentora",
    title: "Mentora",
    category: "AI-powered learning & careers",
    color: "#386cff",
    code: "MR",
    year: "2026",
    description:
      "A personal learning companion that turns big career goals into clear, achievable next steps.",
    story:
      "Mentora brings AI-generated roadmaps, ATS resume feedback, progress tracking, and a little motivation into one mobile experience. I worked on Flutter development, UI/UX design, and Gemini integration.",
    stack: ["Flutter", "Dart", "Gemini", "Supabase"],
    url: "https://mentora-app-download-guide.vercel.app/",
    repo: "https://github.com/pranavraok/Mentora-App",
    highlights: [
      "Personalized learning roadmaps",
      "AI resume feedback",
      "Progress, XP & achievements",
    ],
  },
  {
    slug: "nutrigo",
    title: "NutriGo",
    category: "AI nutrition & food recognition",
    color: "#81b93d",
    code: "NG",
    year: "2026",
    description:
      "Making everyday nutrition easier to understand, with a little help from computer vision.",
    story:
      "NutriGo combines food recognition with a nutrition tracking experience. Built with an AI backend and a responsive interface, it explores how image-based input can make tracking meals more approachable.",
    stack: ["YOLO", "FastAPI", "React", "Python"],
    repo: "https://github.com/tung-programming/nutrigo",
    highlights: [
      "Food image recognition",
      "Nutrition tracking",
      "Hack&Verse 2026 — 1st runner-up",
    ],
  },
  {
    slug: "tradeledger",
    title: "TradeLedger",
    category: "Trading journal & analytics",
    color: "#173d37",
    year: "2026",
    cover: "tradeledger",
    description: "Turn trading history into a clearer picture of performance.",
    story:
      "TradeLedger is a trading journal and portfolio analytics product. Log trades, import records, and review performance patterns in one place — bringing a clearer feedback loop to everyday trading.",
    stack: ["Fintech", "Analytics", "AI"],
    url: "https://trade-ledger.live/",
    highlights: [
      "Trade logging & CSV imports",
      "Portfolio analytics",
      "Performance review",
    ],
  },
  {
    slug: "hostelvoice",
    title: "HostelVoice",
    category: "A better connected campus",
    color: "#9867df",
    year: "2026",
    cover: "hostelvoice",
    description:
      "A shared digital home for hostel residents and administrators.",
    story:
      "HostelVoice brings hostel operations together: issue tracking, announcements, leave requests, and mess management. Built with Next.js, Express, and Supabase, it makes the everyday campus experience easier to navigate.",
    stack: ["Next.js", "Express", "Supabase"],
    repo: "https://github.com/tung-programming/HostelVoice",
    highlights: [
      "Resident & admin authentication",
      "Issue tracking & announcements",
      "Leave & mess management",
    ],
  },
  {
    slug: "stock-analysis-pro",
    title: "Stock Analysis Pro",
    category: "AI-powered equity research",
    color: "#263d78",
    code: "SA",
    year: "2025",
    description:
      "Technical and fundamental data, brought together in one research workflow.",
    story:
      "An AI-powered platform for exploring Indian equities on NSE and BSE. Stock Analysis Pro brings market data, technical analysis, and fundamental signals into an accessible research experience.",
    stack: ["Python", "Machine Learning", "Fintech"],
    highlights: [
      "NSE & BSE equity analysis",
      "Technical & fundamental signals",
      "Data-driven research reports",
    ],
  },
  {
    slug: "saanvi",
    title: "Saanvi",
    category: "Voice AI for dental care",
    color: "#f6a748",
    code: "VA",
    year: "2025",
    description:
      "An AI receptionist that helps clinics handle the everyday conversation.",
    story:
      "Saanvi is a voice assistant for a dental clinic, built with n8n and Retell AI. It handles appointment availability, common questions, and transfers conversations to staff when human support is needed.",
    stack: ["n8n", "Retell AI", "Automation"],
    highlights: [
      "Appointment booking",
      "Clinic FAQs",
      "Escalation to human staff",
    ],
  },
  {
    slug: "electrotech",
    title: "ElectroTech",
    category: "A mobile electronics store",
    color: "#fac650",
    code: "ET",
    year: "2025",
    description:
      "A clean, mobile-first experience for discovering electronics.",
    story:
      "A Flutter shopping application for an electronics store, combining a product browsing interface with Firebase and a consistent mobile design system.",
    stack: ["Flutter", "Dart", "Firebase", "Figma"],
    highlights: [
      "Mobile storefront",
      "Product discovery",
      "Flutter interface design",
    ],
  },
  {
    slug: "email-classifier",
    title: "Email Classifier",
    category: "An inbox with a little intelligence",
    color: "#a9c2e1",
    code: "GSD",
    year: "2025",
    description: "An automated workflow that brings order to a busy inbox.",
    story:
      "An AI-powered email classification workflow using n8n, the Gemini API, and Gmail. It explores how practical automation can reduce repetitive inbox management.",
    stack: ["n8n", "Gemini API", "Gmail"],
    highlights: [
      "AI email classification",
      "Workflow automation",
      "Gmail integration",
    ],
  },
  {
    slug: "speedsnare",
    title: "SpeedSnare",
    category: "Computer vision on the road",
    color: "#e77360",
    code: "SS",
    year: "2025",
    description:
      "Vehicle tracking and speed estimation through computer vision.",
    story:
      "SpeedSnare processes traffic video to track vehicles and estimate their speed. The application combines Flask with OpenCV and YOLOv4-tiny for a computer vision workflow.",
    stack: ["OpenCV", "YOLO", "Python", "Flask"],
    highlights: [
      "Vehicle detection",
      "Video-based tracking",
      "Speed estimation",
    ],
  },
  {
    slug: "dermiscan",
    title: "DermiScan",
    category: "Exploring AI in healthtech",
    color: "#bf8aa8",
    code: "DS",
    year: "2025",
    description: "A machine learning exploration of skin-image classification.",
    story:
      "DermiScan is a skin-image classification project built with Flask, TensorFlow, and MobileNetV2. It demonstrates a model training and inference workflow through a web interface.",
    stack: ["TensorFlow", "MobileNetV2", "Flask"],
    highlights: [
      "Image classification",
      "Deep learning inference",
      "Web-based model interface",
    ],
  },
  {
    slug: "autoworth",
    title: "AutoWorth",
    category: "Machine learning for vehicle prices",
    color: "#edaa63",
    code: "AW",
    year: "2025",
    description:
      "Explore vehicle pricing through a trained machine learning model.",
    story:
      "AutoWorth uses scikit-learn to explore vehicle price prediction, with data preparation, model evaluation, and visualizations forming the core workflow.",
    stack: ["Scikit-learn", "Python", "Matplotlib"],
    highlights: [
      "Vehicle price prediction",
      "Model evaluation",
      "Data visualization",
    ],
  },
];

export const awards = [
  {
    title: "Hack&Verse",
    result: "1st runner-up",
    date: "February 2026",
    image: "hackverse",
    detail: "NutriGo · GDG on Campus SATI × Hack2skill",
  },
  {
    title: "Hack Space",
    result: "1st place",
    date: "January 2026",
    image: "hackspace",
    detail: "Mentora · Generative AI track",
  },
  {
    title: "Trikaya HackToHire",
    result: "Top 10",
    date: "December 2025",
    image: "trikaya",
    detail: "Selected from 4,000+ teams",
  },
  {
    title: "Hult Prize",
    result: "1st place",
    date: "November 2025",
    image: "hult",
    detail: "Hackathon · MAHE",
  },
];
