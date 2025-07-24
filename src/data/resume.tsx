import { Icons } from "@/components/icons";
import { HomeIcon, NotebookIcon } from "lucide-react";

export const DATA = {
  name: "Akash Kumar Prasad",
  url: "https://akashkumarprasad.com",
  description:
    "I'm a Data Science student at IIT Madras, learning to build fast, functional software — from responsive web apps to AI-powered tools. Just getting started, but building every day. ",
  avatarUrl: "/me.jpg",
  skills: {
    "Programming Languages": [
      "JavaScript",
      "TypeScript",
      "Python",
      "Java",
      "SQL",
    ],
    "Frontend": [
      "React",
      "Next.js",
      "HTML/CSS",
      "Tailwind CSS",
    ],
    "Backend": [
      "Node.js",
      "REST APIs",
    ],
    "Database": [
      "PostgreSQL",
      "MongoDB",
      "MySQL",
    ],
    "Tools & Technologies": [
      "Git",
      "Vercel",
    ],
  },
  navbar: [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/projects", icon: NotebookIcon, label: "Projects" },
  ],
  contact: {
    email: "akashkuamrprasad984@gmail.com",
    tel: "8585897351",
    social: {
      GitHub: {
        name: "GitHub",
        url: "https://github.com/Akash8585",
        icon: Icons.github,

        navbar: true,
      },
      LinkedIn: {
        name: "LinkedIn",
        url: "https://dub.sh/dillion-linkedin",
        icon: Icons.linkedin,

        navbar: true,
      },
      X: {
        name: "X",
        url: "https://x.com/akash87478",
        icon: Icons.x,

        navbar: true,
      },
      email: {
        name: "Send Email",
        url: "mailto:akashkuamrprasad984@gmail.com",
        icon: Icons.email,

        navbar: true,
      },
    },
  },

  work: [
    {
      company: "Your Company",
      href: "#",
      badges: [],
      location: "Remote",
      title: "Software Developer",
      logoUrl: "/me.jpg", // placeholder logo
      start: "2024",
      end: "Present",
      description:
        "Add your work experience here. Update the company, title, dates, and description to match your actual experience.",
    },
  ],
  projects: [
    {
      title: "IntelCraft",
      href: "https://github.com/Akash8585/IntelCraft",
      dates: "2025", // approximate project period
      active: true,
      description:
        "IntelCraft is an AI powered outreach assistant designed for students and freshers. It scrapes company and then auto generates personalized outreach emails or cover letters, complete with real time progress updates via WebSockets.",
      technologies: [
        "React",
        "TypeScript",
        "FastAPI",
        "PostgreSQL",
        "WebSockets",
        "OpenAI / Gemini / Tavily",
        "LangGraph",
        "Vercel",
        "Railway",
      ],
      links: [
        {
          type: "GitHub",
          href: "https://github.com/Akash8585/IntelCraft",
          icon: <Icons.github className="size-3" />,
        },
        {
          type: "Website",
          href: "https://intel-craft.vercel.app/",
          icon: <Icons.globe className="size-3" />,
        },
      ],
      image: "/intelcraft.png",
      video: "" 
    },
    {
      title: "YT‑Slice",
      href: "https://github.com/Akash8585/YT‑slice",
      dates: "2025", // approximate project period
      active: true,
      description:
        "Full‑stack web app to calculate total and average duration of videos in a YouTube playlist range, with viewing time estimates at different playback speeds.",
      technologies: [
        "Next.js (App Router)",
        "TypeScript",
        "Tailwind CSS",
        "ShadCN UI",
        "React Hook Form",
        "YouTube Data API v3"
      ],
      links: [
        {
          type: "GitHub",
          href: "https://github.com/Akash8585/YT-slice",
          icon: <Icons.github className="size-3" />,
        },
        {
          type: "Website",
          href: "https://yt-slice.vercel.app/",
          icon: <Icons.globe className="size-3" />,
        }
      ],
      image: "/ytslice.png",
      video: ""
    },
    {
      title: "SynergySphere",
      href: "https://github.com/Akash8585/SynergySphere",
      dates: "2025", // based on hackathon and development timing
      active: false, // hackathon prototype / MVP from IITM hackathon
      description:
        "Advanced team collaboration platform built during IITM hackathon: task management, threaded chat, mentions, notifications, and project dashboards.",
      technologies: [
        "Next.js 15",
        "TypeScript",
        "Tailwind CSS",
        "Shadcn UI",
        "better‑auth",
        "PostgreSQL",
        "Drizzle ORM"
      ],
      links: [
        {
          type: "GitHub",
          href: "https://github.com/Akash8585/SynergySphere",
          icon: <Icons.github className="size-3" />
        },
        {
          type: "Demo Video",
          href: "https://youtu.be/baCzpVf0wYM",
          icon: <Icons.youtube className="size-3" />
        },
      ],
      image: "",
      video: ""
    }
    
  ],
  hackathons: [
    {
      title: "Odoo x Paradox hackathon",
      dates: "June 4th - 5th, 2025",
      location: "IIT Madras Campus",
      description:
        "Advanced team collaboration platform built with task management, threaded chat, mentions, notifications, and project dashboards.",
      image:
        "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/hack-western.png",
      links: [
        {
          title: "GitHub",
          href: "https://github.com/Akash8585/SynergySphere",
          icon: <Icons.github className="size-3" />
        },
        {
          title: "Video",
          href: "https://youtu.be/baCzpVf0wYM",
          icon: <Icons.youtube className="size-3" />
        },
        {
          title: "Linkedin",
          href: "https://www.linkedin.com/posts/akash-kumar-prasad-82b1a1285_odoo-odoohackathon-odooiitm-activity-7337056575439757312-e36x?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEVC0WMBauGta5uHZxR5F2jhy5LmKCGhB2E",
          icon: <Icons.linkedin className="size-3" />
        },

      ],
    },
  ],
} as const;
