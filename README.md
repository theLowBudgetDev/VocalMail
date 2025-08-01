# VocalMail: The Voice-Controlled Email Client

VocalMail is a final year project that re-imagines the email experience for visually impaired users. It's a web-based email client built with Next.js and powered by Google's Generative AI, allowing users to navigate their inbox, manage contacts, and compose emails entirely through voice commands. The primary focus is on creating a high-contrast, minimalist UI that is fully accessible and controllable without needing to see the screen.

## Core Features

- **Voice Command & Navigation:** Navigate all parts of the application (Inbox, Sent, Contacts, etc.) using simple, intuitive voice commands.
- **AI-Powered Email Summarization:** Get the gist of long emails instantly with a voice command to summarize the content.
- **Hands-Free Composition & Proofreading:** Dictate emails with your voice. The AI cleans up the text, and you can have it read the draft back to you before sending.
- **Smart Replies:** The AI suggests short, contextual replies to emails, which can be selected by voice to speed up responses.
- **Full Contact Management:** Add, search, delete, and initiate emails to your contacts, all through voice commands.
- **Global Email Search:** Find any email, no matter which folder it's in, by searching for content in its subject or body using a voice command.
- **Text-to-Speech & Caching:** All on-screen text and email content can be read aloud. Responses are cached to provide a snappy user experience and reduce API usage.
- **Simplified Mock User System:** The application runs as a single, pre-seeded user ("Charlie Davis") to allow for easy demonstration and testing without any login or registration required.

## Simplified User Experience

VocalMail now uses a simplified, authentication-free system. The application automatically runs as a default mock user, "Charlie Davis". This allows you to start using the app immediately without the need for registration or login. The session is managed automatically, and all data is tied to this default user.

## Technology Stack

- **Frontend:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS, ShadCN UI
- **Data:** In-memory mock data (no database required).
- **Generative AI:** Google AI Platform via Genkit
- **UI/UX:** High-contrast, minimalist design focused on accessibility.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- An API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env` in the root of the project and add your Google AI API key:
    ```
    GOOGLE_API_KEY=your_google_ai_api_key_here
    ```

4.  **Set up the database:**
    To create and seed your local database, run the following commands in order:
    ```bash
    npx prisma migrate dev --name init
    npm run db:seed
    ```

### Running the Application

You need to run two processes in separate terminals: the Next.js frontend server and the Genkit AI server.

1.  **Start the Genkit server:**
    ```bash
    npm run genkit:dev
    ```
    This will start the AI flows on a local server.

2.  **Start the Next.js development server:**
    ```bash
    npm run dev
    ```

The application will open to `http://localhost:3000` and take you directly to the inbox for the default user.

## How It Works

The application uses the browser's `MediaRecorder` API to capture voice commands. This audio is sent to a Genkit AI flow, which uses Google's AI models to first transcribe the audio and then understand the user's intent. Based on the recognized command, the application performs an action, such as navigating to a new page, reading an email aloud, or filtering a list. All text-to-speech is handled by another AI flow and cached on the client to ensure a smooth and efficient experience. All user and email data is served from a mock, in-memory data store for demonstration purposes.
