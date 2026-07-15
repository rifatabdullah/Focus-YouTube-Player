# Focus Player

A minimalist, distraction-free YouTube player. Paste a YouTube link, watch that video, and avoid the usual feed, comments, sidebar, and recommendation clutter.

The app accepts standard watch links, short links, embed links, Shorts links, and raw 11-character video IDs. It uses YouTube's privacy-enhanced embed and covers the end screen with a replay control. It also includes optional local-only session timer and focus-mode controls.

## Run locally

Requirements: Node.js 18.17 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To verify a production build:

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Create a GitHub repository and push this project to it.
2. Sign in to [Vercel](https://vercel.com) and choose **Add New → Project**.
3. Import the GitHub repository and click **Deploy**.

Vercel detects Next.js automatically. No environment variables, API keys, database, or custom build settings are required.

## Notes

- The video URL is stored as `?v=VIDEO_ID`, so focused-player links can be bookmarked or shared.
- YouTube controls in-stream and mid-roll ads; embedded apps cannot remove them.
- `rel=0` cannot fully disable YouTube's related end screen, so Focus Player places an opaque replay overlay over the iframe when playback ends.
