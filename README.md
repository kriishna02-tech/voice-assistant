# AI Candidate

An AI candidate simulator that listens to a human interviewer's question, generates a first-person answer grounded in a supplied resume, and speaks it through browser speech synthesis. It is for disclosed simulations and practice. It cannot guarantee interview outcomes.

## Run locally

Requires Node 22.13+ and pnpm. Run `pnpm install` and `pnpm dev`, then open the printed local URL. The app checks for an on-device model in supported desktop Chrome browsers. If it is unavailable, the site owner can set `OPENAI_API_KEY` on the server (copy `.env.example` to `.env.local` for local development). `OPENAI_MODEL` optionally overrides the default server model. Never put API keys in client code or commit `.env.local`.

Upload PDF, DOCX, or TXT, or paste resume text. Add the target job description. Open the room, allow microphone access where supported, and let the interviewer speak. Typed questions work across browsers. When the server provider is configured, `/api/answer` streams text deltas from the OpenAI Responses API and `/api/speech` generates a natural voice for each completed sentence. Otherwise, a supported browser can download and use its on-device language model and installed voices. For each question, the app selects relevant resume evidence, identifies the question's mechanism internally, and asks for a direct answer with a concrete check, decision rule, or consequence. It does not invent undocumented experience or outcomes. The browser queues speech and resumes listening after playback. Pick and preview an installed English voice in setup for on-device speech or server voice fallback. Stop voice and mute controls are provided.

## Data and limits

The resume is parsed locally and held in the active tab. With server AI, questions, resume text, job description, and recent answers are sent to the provider; its API key stays server-side. With on-device AI, generation stays in the browser. Up to 20 completed question-and-answer transcripts are saved in this browser's local storage and can be cleared in Past sessions. There is no cross-device account history or database.

The on-device model requires a supported browser and capable device. Its initial download can take time, and it may be unavailable on some browsers. To generate answers across devices, configure the server provider; this deployed site currently has no provider key. If neither provider is ready, setup says so and disables the room. Browser microphone dictation and natural sounding voices depend on browser and installed operating system voices; typing remains available. Scanned PDFs need OCR. Browser speech is not provider-grade streaming STT/TTS, and echo cancellation depends on the device/browser. A multi-user public deployment would need authentication, durable rate limiting, retention controls, and more robust audio infrastructure. This is a disclosed simulation, and generated answers can be wrong.
