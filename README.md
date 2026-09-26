# AI Candidate

An AI candidate simulator that listens to a human interviewer's question, generates a first-person answer grounded in a supplied resume, and speaks it through browser speech synthesis. It is for disclosed simulations and practice. It cannot guarantee interview outcomes.

## Run locally

Requires Node 22.13+ and pnpm. Run `pnpm install` and `pnpm dev`, then open the printed local URL. The app checks for an on-device model in supported desktop Chrome browsers. If it is unavailable, the site owner can set `OPENAI_API_KEY` on the server (copy `.env.example` to `.env.local` for local development). `OPENAI_MODEL` optionally overrides the default server model. Never put API keys in client code or commit `.env.local`.

Upload PDF, DOCX, or TXT, or paste resume text. Add the target job description. Open the room, allow microphone access, and let the interviewer speak. A final transcript generates an answer; typed questions work too. When the server provider is configured, `/api/answer` streams text deltas from the OpenAI Responses API. Otherwise, a supported browser can download and use its on-device language model. The browser queues sentence-level speech synthesis and resumes listening after playback. Microphone support and voices vary by browser. Stop voice and mute controls are provided.

## Data and limits

The resume is parsed locally and held in the active tab. With server AI, questions, resume text, job description, and recent answers are sent to the provider; its API key stays server-side. With on-device AI, generation stays in the browser. Up to 20 completed question-and-answer transcripts are saved in this browser's local storage and can be cleared in Past sessions. There is no cross-device account history or database.

The on-device model requires a supported browser and capable device. Its initial download can take time, and it may be unavailable on some browsers. If neither provider is ready, the setup screen says so and disables the room. Scanned PDFs need OCR. Browser speech is not provider-grade streaming STT/TTS, and echo cancellation depends on the device/browser. A multi-user public deployment would need authentication, durable rate limiting, retention controls, and more robust audio infrastructure. This is a disclosed simulation, and generated answers can be wrong.
