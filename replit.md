# Overview

This is a Discord bot called "Ccoin" built with Discord.js and TypeScript. It's a comprehensive gaming and economic bot featuring an integrated AI assistant, economic system, games, admin panels, and web interface. The bot includes slash commands, interactive menus, and a sophisticated economy system with coins and crystals.

# System Architecture

## Backend Architecture
- **Primary Framework**: Express.js server with Discord.js v14+ for Discord integration
- **Language**: TypeScript with Node.js runtime
- **Database**: MongoDB for persistent data storage (users, transactions, server configurations)
- **AI Integration**: Multiple AI services including Google Gemini API, Vertex AI, and custom CCOIN AI tuning capabilities
- **Authentication**: Session-based authentication for admin panel

## Frontend Architecture
- **Web Interface**: React with Vite for the admin panel
- **UI Framework**: Combination of custom CSS (Fluent UI inspired) and Tailwind CSS
- **Component Library**: Radix UI components for modern interface elements
- **Styling**: CSS custom properties with responsive design

## Discord Integration
- **Command System**: Slash commands with button-based interactions
- **Menu System**: Interactive embed-based menus for all bot functions
- **Games**: Group games like Mafia, Werewolf, and mini-games
- **Economy**: Coin and crystal management with banking, loans, and jobs

# Key Components

## Discord Bot Core
- **Main Entry**: `server/index.ts` - Bot initialization and Express server setup
- **Commands**: Slash commands in `server/discord/commands/` directory
- **Events**: Discord event handlers in `server/discord/events/`
- **Components**: Interactive button/menu handlers in `server/discord/components/`
- **Services**: Business logic in `server/discord/services/` including AI service, economy, and user management

## Admin Panel
- **Web Interface**: Express routes serving React frontend on port 5000
- **Admin Routes**: Located in `admin/` directory with EJS templates
- **Fluent UI**: Microsoft Fluent UI inspired design system
- **Dashboard**: Real-time statistics and management tools

## AI System
- **CCOIN AI**: Custom fine-tuned Gemini models for bot-specific responses
- **Multi-Provider**: Support for Google AI, Vertex AI, OpenAI, and others
- **Caching**: LRU cache for optimized response times
- **Training**: Custom training pipeline for domain-specific AI responses

## Database Schema
- **Users**: Complete user profiles with economy data, jobs, and statistics
- **Servers**: Per-server configurations and settings
- **Transactions**: All economic transactions and history
- **Games**: Game sessions and leaderboards

# Data Flow

## User Interactions
1. Discord slash commands trigger interaction handlers
2. Button/menu interactions processed through component handlers
3. Data validation and business logic in service layer
4. Database operations through Mongoose models
5. Response sent back to Discord with updated UI

## Admin Operations
1. Web requests to Express admin routes
2. Authentication middleware validation
3. Database queries and updates
4. Real-time updates to admin dashboard
5. Optional Discord notifications for admin actions

## AI Processing
1. User input received through `/askai` command or automatic triggers
2. Request routing to appropriate AI service
3. Caching check for similar requests
4. AI API call with optimized parameters
5. Response processing and formatting for Discord

# External Dependencies

## Core Dependencies
- **discord.js**: ^14.15.0 - Discord API interaction
- **express**: Web server for admin panel
- **mongoose**: MongoDB object modeling
- **@google/generative-ai**: Gemini AI integration
- **@google-cloud/vertexai**: Vertex AI integration

## UI Dependencies
- **react**: Frontend framework
- **@radix-ui/***: Component library
- **tailwindcss**: CSS framework
- **vite**: Build tool and dev server

## AI Dependencies
- **@google/generative-ai**: Google Gemini API
- **@google-cloud/vertexai**: Google Vertex AI
- **@huggingface/inference**: Hugging Face models

# Deployment Strategy

## Production Environment
- **Platform**: Designed for Replit deployment with automatic environment detection
- **Port Configuration**: Express server on port 5000, Discord bot runs alongside
- **Environment Variables**: Comprehensive `.env` configuration for all APIs and database connections
- **Process Management**: Single process handling both Discord bot and web server

## Development Environment
- **Local Development**: `npm run dev` with hot reloading
- **Database**: MongoDB connection with fallback configurations
- **Testing**: Built-in test scripts for AI services and database connections

## Build Process
- **TypeScript Compilation**: `tsc` for type checking
- **Vite Build**: Production builds for React frontend
- **ESBuild**: Server-side bundling for optimal performance

# Changelog

- June 28, 2025. Initial setup

# User Preferences

Preferred communication style: Simple, everyday language.