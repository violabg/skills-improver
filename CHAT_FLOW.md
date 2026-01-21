# AI Chat Flow & Architecture

This document details the inner workings of the **AI Career Mentor** chat system in Skills Improver, explaining how it integrates with your assessments and handles user data.

## 1. System Overview

The AI Chat Advisor provides persistent, context-aware mentorship. Unlike a standard chatbot, it is deeply integrated into the application's data layer, leveraging your assessment history to provide personalized guidance.

### Visual Architecture

```text
User Message → Auth Verification → Context Extraction → AI Processing → Response Streaming → Persistence
```

---

## 2. Core Flow Breakdown

### 2a. Context Extraction (The "Brain")

Every message sent to the chat triggers an automatic background process that fetches your latest professional profile. The system looks for:

1. **Target Role**: Your stated career goal (e.g., "Developer → Tech Lead").
2. **Skill Summary**: Your current levels across your evaluated skills.
3. **Top Gaps**: Identified weaknesses that need bridging for your target role.
4. **Recent History**: The last 5 interactions to maintain conversational thread.

### 2b. AI Request Optimization

The system uses the **Vercel AI SDK** with the `fastModel` (Groq/Kimi 2). Your message is wrapped with a "Context Prompt" that tells the AI:

- "This user wants to become a [Target Role]."
- "Their strongest skills are [Skill A, Skill B]."
- "They currently struggle with [Gap X, Gap Y]."

### 2c. Persistence Layer

Chats are saved in two ways:

- **ChatConversation**: Stores the full conversation history (JSON) including user and AI messages. This is what allows you to see your "History" in the sidebar.
- **MentorInteraction**: Records single question/answer pairs for internal analytics and to provide secondary context for other AI features.

---

## 3. Assessment Integration

### How It Relates to Assessments

The chat is **User-Scoped**, not **Assessment-Scoped**. This means your chat history isn't deleted if you start a new assessment.

### Handling Multiple Assessments

If you have completed multiple assessments over time, the system applies a **"Latest Wins"** logic:

1. The API queries the database for `Assessment` records where `status = 'COMPLETED'`.
2. It sorts them by `completedAt DESC`.
3. It uses the **first** result found as the primary context for the AI.

**Why this matters:**

- **Dynamic Pivoting**: If you finish a new assessment today, your existing chat threads will immediately "inherit" the new context. You don't need to start a new chat for the AI to know your goals have changed.
- **Data Integrity**: Historical assessments are kept for your records but don't "pollute" the AI's current understanding of your needs.

---

## 4. Key Endpoints & Database Models

### Technical Schema

- **Model**: `ChatConversation`
  - `messages`: JSON array of `UIMessage` objects.
  - `updatedAt`: Used to sort the sidebar.
- **Endpoint**: `POST /api/chat`
  - Handles the primary streaming logic and context injection.
- **Endpoint**: `GET /api/chat/conversations`
  - Populates the sidebar history.

---

## 5. Summary Table

| Scenario | Behavior |
| :--- | :--- |
| **New Message** | Injects latest completed assessment + profile data into the prompt. |
| **Switching Chats** | Loads the JSON history for that ID, but uses the *current* latest assessment context for new replies. |
| **Multiple Completed Assessments** | AI always responds based on the assessment with the most recent `completedAt` timestamp. |
| **In-Progress Assessments** | Ignored by the chat until they are fully COMPLETED/Saved. |
