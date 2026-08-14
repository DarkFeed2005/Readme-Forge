export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const DEFAULT_TEMPLATE = `# 🚀 {{repo_name}} - Enterprise Platform

> {{short_description}}

<p align="center">
  <img src="https://skillicons.dev/icons?i={{tech_stack_icons}}" width="50"/>
</p>

---

## 🌟 Overview

**{{repo_name}}** is a high-performance platform designed to...

### Why {{repo_name}}?

* **Unified Workspace:** Streamlines project workflows and data management into one solution.
* **Modern Stack:** Built on modern infrastructure and clean architectural principles.
* **Automated Data Flow:** Handles complex background logic and real-time processing seamlessly.

---

## ✨ Features

### 🎯 Core Features
* {{core_feature_1}}
* {{core_feature_2}}

### 🔧 Technical Highlights
* {{tech_highlight_1}}
* {{tech_highlight_2}}

---

## 🛠 Technologies Used

{{tech_stack_list}}

---

## 📦 Installation

Clone the repository:
\`\`\`bash
git clone {{repo_url}}.git
cd {{repo_name}}
\`\`\`

Install dependencies:
\`\`\`bash
pnpm install
\`\`\`

---

## 🚀 Usage

Start the development server:
\`\`\`bash
pnpm dev
\`\`\`

---

## 📁 Project Structure

\`\`\`text
{{file_tree}}
\`\`\`

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your Changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the Branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

---

## 👨‍💻 Author

GitHub: {{repo_owner}}
`;

export const MINIMAL_TEMPLATE = `# {{repo_name}}

{{badges}}

{{about}}

## Installation

{{installation}}

## Usage

{{usage}}

## License

{{license}}
`;

export const PRO_TEMPLATE = `# {{repo_name}}

{{badges}}

{{about}}

## Table of Contents

- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Key Features

{{features}}

## Tech Stack

{{tech_stack}}

## Getting Started

### Prerequisites

{{prerequisites}}

### Installation

{{installation}}

### Configuration

{{configuration}}

## Usage

{{usage}}

## Roadmap

{{roadmap}}

## Contributing

{{contributing}}

## License

{{license}}
`;

export const TEMPLATES: Template[] = [
  {
    id: "default",
    name: "Enterprise (Standard)",
    description: "Enterprise-grade skeleton: emoji title with blockquote, Skillicons header, categorized features, full setup guide, and project tree.",
    content: DEFAULT_TEMPLATE,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Short and focused. Badges, one-line overview, install, usage, and license only.",
    content: MINIMAL_TEMPLATE,
  },
  {
    id: "pro",
    name: "Pro (Detailed)",
    description: "Full documentation structure with table of contents, configuration, roadmap, and contributing.",
    content: PRO_TEMPLATE,
  },
];

export function getTemplateById(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}