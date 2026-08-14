<<<<<<< Updated upstream

# 🚀 Readme-Forge - Enterprise Platform
> **An AI-powered README.md generator built with Next.js and Llama 3.3, converting GitHub repository URLs into polished documentation using custom templates.**

<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs" width="50"/>
  <img src="https://skillicons.dev/icons?i=nodejs" width="50"/>
  <img src="https://skillicons.dev/icons?i=typescript" width="50"/>
  <img src="https://skillicons.dev/icons?i=tailwindcss" width="50"/>
</p>

---

## 🌟 Overview

**Readme-Forge** is a high-performance platform designed to streamline the process of generating high-quality README.md files for GitHub repositories. By leveraging the power of AI and modern web technologies, Readme-Forge aims to simplify the documentation process, making it easier for developers to focus on their projects.

### Why Readme-Forge?

* **Unified Workspace:** Readme-Forge streamlines the process of generating README.md files, providing a unified workspace for developers to manage their project documentation.
* **Modern Stack:** Built on modern infrastructure and clean architectural principles, Readme-Forge ensures a scalable and maintainable solution for generating high-quality README.md files.
* **Automated Data Flow:** Readme-Forge handles complex background logic and real-time processing seamlessly, allowing developers to generate polished documentation with minimal effort.

Readme-Forge is designed to simplify the documentation process, making it easier for developers to create high-quality README.md files. By providing a unified workspace and automating the data flow, Readme-Forge saves developers time and effort, allowing them to focus on their projects.

The platform's architecture is built on modern infrastructure and clean architectural principles, ensuring a scalable and maintainable solution. This enables Readme-Forge to handle complex background logic and real-time processing seamlessly, providing a smooth and efficient experience for developers.

In addition to its technical capabilities, Readme-Forge is also designed to be user-friendly and intuitive. The platform provides a simple and easy-to-use interface, making it easy for developers to generate high-quality README.md files, even for those who are not familiar with documentation best practices.

---

## ✨ Features

### 🎯 Core Features
* **Environment Config Template:** Readme-Forge provides an environment config template, making it easy for developers to configure their project settings.
* **AI-Powered README.md Generation:** Readme-Forge uses AI to generate high-quality README.md files, saving developers time and effort.

### 🔧 Technical Highlights
* **Next.js and Llama 3.3 Integration:** Readme-Forge is built with Next.js and Llama 3.3, providing a powerful and scalable solution for generating README.md files.
* **Custom Templates:** Readme-Forge allows developers to use custom templates, providing flexibility and control over the documentation process.

---

## 🛠 Technologies Used

* Node.js
* TypeScript
* React
* Next.js
* Tailwind CSS
* Groq API

---

## 📦 Installation

Clone the repository:
```bash
git clone https://github.com/DarkFeed2005/Readme-Forge.git
cd Readme-Forge
```

Install dependencies:
```bash
pnpm install
```

---

## 🚀 Usage

Start the development server:
```bash
pnpm dev
```

---

## 📁 Project Structure

```text
=======
# Readme-Forge
> An AI-powered README.md generator built with Next.js and Llama 3.3. Converts GitHub repository URLs into polished documentation using custom templates.

<p align="center">
  <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
    <img src="https://skillicons.dev/icons?i=nextjs" alt="nextjs" width="50" height="50"/>
  </a>&nbsp;
  <a href="https://www.typescriptlang.org/" target="_blank" rel="noreferrer">
    <img src="https://skillicons.dev/icons?i=ts" alt="typescript" width="50" height="50"/>
  </a>&nbsp;
  <a href="https://tailwindcss.com/" target="_blank" rel="noreferrer">
    <img src="https://skillicons.dev/icons?i=tailwindcss" alt="tailwindcss" width="50" height="50"/>
  </a>&nbsp;
  <a href="https://groq.com/" target="_blank" rel="noreferrer">
    <img src="https://skillicons.dev/icons?i=github" alt="groq" width="50" height="50"/>
  </a>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-45E0C2?style=flat-square">
  <img alt="Stars" src="https://img.shields.io/github/stars/DarkFeed2005/Readme-Forge?style=flat-square">
  <img alt="Forks" src="https://img.shields.io/github/forks/DarkFeed2005/Readme-Forge?style=flat-square">
</p>

## 📖 Table of Contents
- [Overview](#-overview)
- [Why Readme-Forge?](#why-readme-forge)
- [Features](#-features)
- [Architecture](#️-architecture)
- [Tech Stack](#️-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Security Model](#-security-model)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Author](#-author)

## 🌟 Overview
Readme-Forge is an AI-powered README.md generator built with Next.js and Llama 3.3. It converts GitHub repository URLs into polished documentation using custom templates.

### Why Readme-Forge?
Readme-Forge provides a simple and efficient way to generate high-quality README.md files for your GitHub repositories. With its AI-powered engine and custom templates, you can create professional-looking documentation in minutes.

## ✨ Features
- **AI-powered README.md generation**: Readme-Forge uses Llama 3.3 (via Groq) to generate high-quality README.md files based on your GitHub repository URL.
- **GitHub metadata extraction**: Fetches real repository metadata, the recursive file tree, and manifest files (`package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`) to detect the actual tech stack and features.
- **Custom templates**: A static template system with placeholder tokens (`{{placeholders}}`) — paste or edit your own structure and the model fills it exactly as written.
- **Live streaming preview**: Dual-pane dashboard with rendered Markdown preview and raw editor, Copy to Clipboard and Download `README.md` support.
- **Environment config template**: ships with a `.env.example` for server-side `GROQ_API_KEY` configuration.

## 🏗️ Architecture
Readme-Forge is a Next.js 15 application using the App Router. It has **no database** — every generation flow runs fully in memory:

```
┌─────────────────┐    fetch(/api/github)     ┌──────────────────┐
│   Next.js Web    │ ────────────────────────► │  /api/github      │
│  (React + Tailwind)│                         │  (proxies GitHub   │
│  dual-pane UI     │                          │   REST API, parses │
└────────┬─────────┘                          │   owner/repo, tree,│
         │                                    │   manifests, tech   │
         │  streaming text (no DB)            │   detection)        │
         ▼                                    └─────────┬────────┘
┌─────────────────┐                          ┌───────────▼────────┐
│   ReadmePreview  │ ◄── STREAM ─────────────│  /api/generate     │
│  (react-markdown │                          │  (Groq SDK,        │
│   + remark-gfm)  │                          │   Llama 3.3 70B,   │
└─────────────────┘                          │   streaming)        │
                                              └───────────────────┘
```

When you submit a repository URL, `/api/github` proxies the GitHub REST API (metadata, recursive file tree, key file contents) and detects the tech stack, then `/api/generate` hands that context plus your template to Llama 3.3 70B on Groq and streams the completion back to the browser for a live preview.

## 🛠️ Tech Stack
**Frontend**
- [Next.js](https://nextjs.org/) (TypeScript, App Router)
- Tailwind CSS + [Lucide React](https://lucide.dev/) icons

**AI Generation**
- [Groq SDK](https://console.groq.com/) — [Llama 3.3 70B](https://groq.com/) (`llama-3.3-70b-versatile`), streamed server-sent response

**Markdown Rendering**
- [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)

## 📦 Installation
To install Readme-Forge, follow these steps:
1. Clone the repository:
   ```bash
   git clone https://github.com/DarkFeed2005/Readme-Forge.git
   cd Readme-Forge
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment:
   ```bash
   cp .env.example .env.local   # add your GROQ_API_KEY (https://console.groq.com/keys)
   ```
4. Start the application:
   ```bash
   npm run dev
   ```
   The app is available at `http://localhost:3000`.

## 🚀 Usage
1. Paste a public GitHub repository URL (e.g. `https://github.com/owner/repo`) — or paste it directly into the **README Template** section of the dashboard.
2. Click **Fetch** — metadata, file tree, and manifest contents are pulled from the GitHub API.
3. Pick or paste your template (a default clean template is included; custom structures with `{{placeholders}}` are supported).
4. Optionally override the Groq API key (it falls back to the server-side `GROQ_API_KEY`).
5. Click **Generate README** — the result streams in live on the right; use **Copy** or **Download README.md** when it's done.

## 📁 Project Structure
```
Readme-Forge/
>>>>>>> Stashed changes
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── next.config.mjs
<<<<<<< Updated upstream
├── package-lock.json
=======
>>>>>>> Stashed changes
├── package.json
├── postcss.config.mjs
├── src
│   ├── app
│   │   ├── api
<<<<<<< Updated upstream
│   │   │   ├── generate
│   │   │   │   └── route.ts
│   │   │   ├── github
│   │   │   │   └── route.ts
│   │   ├── globals.css
│   │   ├── icon.svg
│   │   ├── layout.tsx
│   │   └── page.tsx
=======
│   │   │   ├── generate/           # Groq SDK streaming route (Llama 3.3 70B)
│   │   │   └── github/             # GitHub metadata, tree, manifest fetcher
│   │   ├── globals.css
│   │   ├── icon.svg
│   │   ├── layout.tsx
│   │   └── page.tsx                # unified state management
>>>>>>> Stashed changes
│   ├── components
│   │   ├── Navbar.tsx
│   │   ├── ReadmePreview.tsx
│   │   ├── RepoForm.tsx
│   │   └── TemplateEditor.tsx
│   ├── lib
│   │   ├── github.ts
│   │   ├── templates.ts
│   │   └── types.ts
<<<<<<< Updated upstream
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Author

GitHub: DarkFeed2005

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Stars: 0](https://img.shields.io/github/stars/DarkFeed2005/Readme-Forge.svg)](https://github.com/DarkFeed2005/Readme-Forge/stargazers)
[![Forks: 0](https://img.shields.io/github/forks/DarkFeed2005/Readme-Forge.svg)](https://github.com/DarkFeed2005/Readme-Forge/network/members)
=======
│   ├── tailwind.config.ts
└── tsconfig.json
```

## 🔐 Security Model
- **Server-side key custody**: the Groq API key lives in `.env.local`, which is gitignored and never committed. The client never sees the server key.
- **Optional client key override**: if supplied, it is sent only to your own server and used exclusively for that generation request — never stored or logged.
- **No persistence**: repository metadata and generated READMEs exist only in page memory for the session; nothing is written to disk or stored server-side.
- **Public data only**: `/api/github` fetches only the public GitHub REST API and only repositories you provide a URL for.

## 🗺️ Roadmap
- **Improve AI-powered README.md generation**: Continue to improve the quality of the generated README.md files.
- **Add more custom templates**: Provide more custom templates for users to choose from.
- **Improve user interface**: Improve the user interface to make it more user-friendly.

## 🤝 Contributing
Contributions are welcome! To contribute, please fork the repository and submit a pull request.

## 📄 License
Readme-Forge is licensed under the MIT License. See `LICENSE` for details.

## 👨‍💻 Author
**Kalana Yasassri**

<p>
  <a href="https://github.com/darkfeed2005" target="_blank" rel="noreferrer"><img src="https://skillicons.dev/icons?i=github" alt="github" width="24" height="24"/></a>&nbsp;
  <a href="https://www.linkedin.com/in/kalana-yasassri-684591251/" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/linkedin/linkedin-original.svg" alt="linkedin" width="24" height="24"/></a>&nbsp;
  <a href="https://www.instagram.com/kalana_yasassri" target="_blank" rel="noreferrer"><img src="https://skillicons.dev/icons?i=instagram" alt="instagram" width="24" height="24"/></a>
</p>
>>>>>>> Stashed changes
