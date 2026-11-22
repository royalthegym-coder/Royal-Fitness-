# Royal The Gym

A gym-management and fitness application built with React, TypeScript, and Vite.

[![CI](https://github.com/royalthegym-coder/Royal-Fitness-/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/royalthegym-coder/Royal-Fitness-/actions/workflows/ci.yml)
[![CodeQL](https://github.com/royalthegym-coder/Royal-Fitness-/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/royalthegym-coder/Royal-Fitness-/actions/workflows/codeql.yml)

## What this repository contains

- Member, membership, package, staff, billing, and payment modules
- Lead/CRM, expense, attendance, and scheduling modules
- Workout, diet-planning, and fitness/health modules, including AI-assisted features
- Automation and integration modules for services such as Google Business, Maps, and WhatsApp

These are modules present in the codebase; integrations and individual features may require separate provider accounts, server configuration, and testing before production use.

## Technology

React 18 · TypeScript · Vite · Supabase · Firebase · Google GenAI and OpenAI client libraries

## Run locally

Requirements: Node.js and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Add only the environment values needed for the modules you intend to use. For code checks:

```bash
npm run lint
npm run build
```

## Security

- Keep local environment files out of Git; `.env.example` is the safe template.
- Treat values included in a browser build as public. Never put service-role, database, payment, or other privileged credentials in client-side code; use a server-side service for private keys.
- See [SECURITY.md](SECURITY.md) for vulnerability reporting guidance.

## Project site

Configured URL: https://royal-fitness-rho.vercel.app
