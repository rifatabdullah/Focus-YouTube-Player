interface Window {
  YT?: {
    Player: new (element: HTMLIFrameElement, options: { events: { onReady: () => void; onStateChange: (event: { data: number }) => void } }) => YTPlayer;
    PlayerState: { ENDED: number; PLAYING: number; PAUSED: number };
  };
  onYouTubeIframeAPIReady?: () => void;
}

interface YTPlayer {
  destroy(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
}
