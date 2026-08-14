export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

export const DEFAULT_TEMPLATE = `# {{repo_name}}

{{badges}}

## About

{{about}}

## Key Features

{{features}}

## Tech Stack

{{tech_stack}}

## Getting Started

### Prerequisites

{{prerequisites}}

### Installation

{{installation}}

## Usage

{{usage}}

## License

{{license}}
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
    name: "Default (Clean)",
    description: "Balanced template with badges, overview, features, tech stack, quick start, usage, and license.",
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