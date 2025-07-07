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
- **Mock User Authentication:** A simple, mock-user authentication system for easy demonstration and testing.

## User Authentication

VocalMail uses a simple, mock-user authentication system. On the login page, you can select which of the five pre-seeded users you would like to log in as. This allows for easy testing of a multi-user environment without the need for registration or password management. Your session is remembered in a browser cookie, and you can switch between users from the profile icon in the top-right corner.

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

### Logging In

Once the application is running, it will open to `http://localhost:9002`. You will be directed to a login page where you can select one of the mock users (e.g., Charlie Davis, Alice Williams) to begin using the application.

## How It Works

The application uses the browser's `MediaRecorder` API to capture voice commands. This audio is sent to a Genkit AI flow, which uses Google's AI models to first transcribe the audio and then understand the user's intent. Based on the recognized command, the application performs an action, such as navigating to a new page, reading an email aloud, or filtering a list. All text-to-speech is handled by another AI flow and cached on the client to ensure a smooth and efficient experience. All user and email data is served from a mock, in-memory data store for demonstration purposes.
