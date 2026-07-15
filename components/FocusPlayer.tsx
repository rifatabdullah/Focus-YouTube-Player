"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseYouTubeVideoId } from "@/lib/youtube";

const PLAYER_PARAMS = "rel=0&modestbranding=1&iv_load_policy=3&fs=1&playsinline=1&cc_load_policy=0&controls=1&enablejsapi=1";

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function ReplayIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 4v6h6"/><path d="M5.5 9A8 8 0 1 1 4 14"/></svg>;
}

function SlidersIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>;
}

export default function FocusPlayer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = parseYouTubeVideoId(searchParams.get("v") ?? "");
  const [videoId, setVideoId] = useState<string | null>(initialId);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [ended, setEnded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState("25");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [timerFinished, setTimerFinished] = useState(false);
  const [timerPanelOpen, setTimerPanelOpen] = useState(false);
  const [timerError, setTimerError] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPauseTimeout = useCallback(() => {
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = null;
  }, []);

  useEffect(() => {
    if (remaining === null || remaining <= 0 || !videoId) return;
    const interval = setInterval(() => {
      setRemaining((value) => {
        if (value === null) return null;
        if (value <= 1) {
          playerRef.current?.pauseVideo();
          setTimerFinished(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remaining, videoId]);

  useEffect(() => {
    if (!videoId || !iframeRef.current) return;
    let cancelled = false;

    const createPlayer = () => {
      if (cancelled || !window.YT || !iframeRef.current || playerRef.current) return;
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: () => undefined,
          onStateChange: ({ data }) => {
            const state = window.YT?.PlayerState;
            if (!state) return;
            if (data === state.ENDED) {
              clearPauseTimeout();
              setPaused(false);
              setEnded(true);
            } else if (data === state.PAUSED) {
              clearPauseTimeout();
              pauseTimeoutRef.current = setTimeout(() => setPaused(true), 1500);
            } else if (data === state.PLAYING) {
              clearPauseTimeout();
              setPaused(false);
              setEnded(false);
            }
          },
        },
      });
    };

    if (window.YT?.Player) createPlayer();
    else {
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        createPlayer();
      };
      if (!existing) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      clearPauseTimeout();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId, clearPauseTimeout]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const id = parseYouTubeVideoId(input);
    if (!id) {
      setError("Enter a valid YouTube link or 11-character video ID.");
      return;
    }
    setError("");
    setVideoId(id);
    setRemaining(null);
    setTimerFinished(false);
    router.replace(`/?v=${id}`, { scroll: false });
  }

  function newVideo() {
    clearPauseTimeout();
    setVideoId(null);
    setInput("");
    setError("");
    setEnded(false);
    setPaused(false);
    setRemaining(null);
    setTimerFinished(false);
    setTimerPanelOpen(false);
    setTimerError("");
    setFocusMode(false);
    setMenuOpen(false);
    router.replace("/", { scroll: false });
  }

  function replay() {
    playerRef.current?.seekTo(0, true);
    playerRef.current?.playVideo();
    setEnded(false);
  }

  function startTimer() {
    const minutes = Number(timerMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 999) {
      setTimerError("Enter 1–999 minutes.");
      return;
    }
    setRemaining(Math.round(minutes * 60));
    setTimerFinished(false);
    setTimerError("");
    setTimerPanelOpen(false);
  }

  function clearTimer() {
    setRemaining(null);
    setTimerFinished(false);
  }

  const toggles = (
    <div className="flex items-center gap-5 text-sm text-ink/65">
      <div className="relative">
        <button type="button" onClick={() => setTimerPanelOpen((open) => !open)} className="transition-opacity hover:opacity-60">Timer</button>
        {timerPanelOpen && (
          <div className="absolute right-0 top-8 z-50 w-56 rounded-lg border border-ink/10 bg-canvas p-3 text-ink">
            <label htmlFor="timer-minutes" className="mb-2 block text-xs text-ink/60">Minutes</label>
            <div className="flex gap-2">
              <input id="timer-minutes" type="number" min="1" max="999" value={timerMinutes} onChange={(e) => { setTimerMinutes(e.target.value); setTimerError(""); }} onKeyDown={(e) => { if (e.key === "Enter") startTimer(); }} className="min-w-0 flex-1 rounded-md border border-ink/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-accent" />
              <button type="button" onClick={startTimer} className="rounded-md border border-ink/15 px-3 py-1.5 font-semibold transition-opacity hover:opacity-65">Start</button>
            </div>
            {timerError && <p className="mt-2 text-xs text-ink/60" role="alert">{timerError}</p>}
          </div>
        )}
      </div>
      <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={focusMode} onChange={(e) => setFocusMode(e.target.checked)} className="h-4 w-4 accent-accent" /> Focus mode</label>
    </div>
  );

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4 py-12 text-ink sm:px-8">
      {focusMode && videoId && <div className="pointer-events-none fixed inset-0 z-10 bg-black/90 backdrop-blur-sm" aria-hidden="true" />}

      {!videoId ? (
        <section className="w-full max-w-xl transition duration-200 ease-out">
          <h1 className="mb-8 text-center text-xl font-semibold tracking-tight">Focus Player</h1>
          <form onSubmit={submit} noValidate>
            <div className="flex overflow-hidden rounded-lg border border-ink/10 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent">
              <label htmlFor="youtube-url" className="sr-only">YouTube link</label>
              <input id="youtube-url" value={input} onChange={(e) => { setInput(e.target.value); if (error) setError(""); }} placeholder="Paste a YouTube link" autoFocus className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base text-ink outline-none placeholder:text-ink/35" />
              <button type="submit" className="border-l border-ink/10 px-5 font-semibold transition-opacity hover:opacity-65">Play</button>
            </div>
            <p className={`mt-3 text-sm text-ink/60 ${error ? "visible" : "invisible"}`} role="alert">{error || "Error placeholder"}</p>
          </form>
        </section>
      ) : (
        <section className="relative w-full max-w-4xl transition duration-200 ease-out">
          <div className={`relative z-20 mb-4 flex items-center justify-between transition-opacity duration-200 ${focusMode ? "opacity-30 hover:opacity-100 focus-within:opacity-100" : "opacity-100"}`}>
            <button onClick={newVideo} className="text-sm text-ink/65 transition-opacity hover:opacity-60">← New video</button>
            <div className="hidden sm:block">{toggles}</div>
            <div className="relative sm:hidden">
              <button aria-label="Player settings" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="rounded-md border border-ink/10 p-2 text-ink/65"><SlidersIcon /></button>
              {menuOpen && <div className="absolute right-0 top-12 z-40 w-44 rounded-lg border border-ink/10 bg-canvas p-4">{toggles}</div>}
            </div>
          </div>

          <div className="relative z-20 aspect-video w-full overflow-hidden rounded-lg border border-ink/10 bg-black">
            <iframe ref={iframeRef} key={videoId} id={`focus-player-${videoId}`} src={`https://www.youtube-nocookie.com/embed/${videoId}?${PLAYER_PARAMS}`} title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen className="absolute inset-0 h-full w-full" />
            <div className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-canvas/95 transition-opacity duration-200 ${paused && !ended ? "opacity-100" : "opacity-0"}`} aria-hidden={!paused}><span className="text-sm text-ink/55">Paused</span></div>
            <div className={`absolute inset-0 flex items-center justify-center bg-canvas transition-opacity duration-200 ${ended ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!ended}>
              <button onClick={replay} className="flex items-center gap-2 rounded-lg border border-ink/15 px-5 py-3 font-semibold transition-opacity hover:opacity-65"><ReplayIcon /> Replay</button>
            </div>
          </div>

          <div className={`relative z-20 mt-4 flex justify-end transition-opacity duration-200 ${focusMode ? "opacity-30 hover:opacity-100 focus-within:opacity-100" : "opacity-100"}`}>
            <div className="group relative">
              <button aria-label="Information about YouTube ads" className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/15 text-xs text-ink/55">?</button>
              <p role="tooltip" className="pointer-events-none absolute bottom-9 right-0 w-64 rounded-md border border-ink/10 bg-canvas px-3 py-2 text-xs text-ink/65 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">Mid-roll ads are controlled by YouTube and can&apos;t be removed here.</p>
            </div>
          </div>
        </section>
      )}

      {videoId && remaining !== null && (
        <div className="fixed bottom-4 right-4 z-30 flex items-center gap-3 rounded-md border border-ink/15 bg-canvas px-3 py-2 text-sm text-ink/80 sm:bottom-6 sm:right-6">
          <span className="font-mono tabular-nums" aria-live="polite">{timerFinished ? "Time’s up" : formatTime(remaining)}</span>
          <button type="button" onClick={clearTimer} className="text-xs text-ink/50 transition-opacity hover:opacity-60">{timerFinished ? "Dismiss" : "Cancel"}</button>
        </div>
      )}
    </main>
  );
}
