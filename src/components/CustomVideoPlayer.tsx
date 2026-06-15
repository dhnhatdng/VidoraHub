"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  RotateCcw, RotateCw, Loader2, Maximize2 
} from "lucide-react";

interface CustomVideoPlayerProps {
  src: string;
  onFirstPlay?: () => void;
}

export function CustomVideoPlayer({ src, onFirstPlay }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPlayedStarted, setHasPlayedStarted] = useState(false);

  // Auto-hide controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger first play callback
  useEffect(() => {
    if (isPlaying && !hasPlayedStarted) {
      setHasPlayedStarted(true);
      if (onFirstPlay) onFirstPlay();
    }
  }, [isPlaying, hasPlayedStarted, onFirstPlay]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore input elements
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable) {
        return;
      }

      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "m") {
        e.preventDefault();
        toggleMute();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        skip(-10);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        skip(10);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isFullscreen, isMuted]);

  // Video event handlers
  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);
  const onTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };
  const onDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const onWaiting = () => setIsLoading(true);
  const onPlaying = () => setIsLoading(false);

  // Format Time (e.g. 02:45)
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle Seek / Progress Drag
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    videoRef.current.volume = newVol;
    setIsMuted(newVol === 0);
    videoRef.current.muted = newVol === 0;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  // Handle Playback Speed Change
  const cycleSpeed = () => {
    if (!videoRef.current) return;
    const speeds = [1, 1.25, 1.5, 2, 0.5, 0.75];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackRate(nextSpeed);
    videoRef.current.playbackRate = nextSpeed;
  };

  // Fullscreen implementation
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error attempting to enable full-screen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Update fullscreen state on exit (e.g. via Escape key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // skip forward/backward
  const skip = (amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      Math.max(0, videoRef.current.currentTime + amount),
      duration
    );
  };

  // Mouse Move Event: Show controls and hide after 2.5s
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative overflow-hidden rounded-2xl border border-slate-900 bg-black aspect-video w-full group select-none shadow-2xl"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onPlay={onPlay}
        onPause={onPause}
        onTimeUpdate={onTimeUpdate}
        onDurationChange={onDurationChange}
        onWaiting={onWaiting}
        onPlaying={onPlaying}
        onLoadedMetadata={onDurationChange}
        preload="auto"
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none z-20">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Large Central Play Overlay (Briefly shows play/pause animation on click) */}
      {!isPlaying && !isLoading && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/35 transition cursor-pointer z-10"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/95 text-white shadow-lg shadow-indigo-500/30 transform scale-100 hover:scale-110 active:scale-95 transition-all duration-200">
            <Play className="h-7 w-7 fill-white ml-1 text-white" />
          </div>
        </div>
      )}

      {/* Custom Controls Container */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent flex flex-col gap-3 transition-opacity duration-300 z-30 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Bar slider */}
        <div className="flex items-center gap-2 group/progress relative w-full">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-indigo-500 hover:h-2.5 transition-all outline-none"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((currentTime / (duration || 1)) * 100).toFixed(2)}%, #1e293b ${((currentTime / (duration || 1)) * 100).toFixed(2)}%, #1e293b 100%)`
            }}
          />
        </div>

        {/* Buttons Controls Layout */}
        <div className="flex items-center justify-between text-slate-200">
          {/* Left Controls */}
          <div className="flex items-center gap-4">
            {/* Play/Pause Button */}
            <button 
              onClick={togglePlay}
              className="p-1 rounded-lg hover:bg-slate-900 text-slate-200 hover:text-white transition cursor-pointer"
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
            </button>

            {/* Back / Forward 10s */}
            <button 
              onClick={() => skip(-10)}
              className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
              title="Back 10s"
            >
              <RotateCcw className="h-4.5 w-4.5" />
            </button>
            <button 
              onClick={() => skip(10)}
              className="p-1 rounded-lg hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
              title="Forward 10s"
            >
              <RotateCw className="h-4.5 w-4.5" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/volume">
              <button 
                onClick={toggleMute}
                className="p-1 rounded-lg hover:bg-slate-900 text-slate-200 hover:text-white transition cursor-pointer"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 h-1 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-indigo-500"
                style={{
                  background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((isMuted ? 0 : volume) * 100).toFixed(0)}%, #1e293b ${((isMuted ? 0 : volume) * 100).toFixed(0)}%, #1e293b 100%)`
                }}
              />
            </div>

            {/* Time Indicator */}
            <div className="text-xs text-slate-400 font-medium">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1.5">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Speed Selector */}
            <button
              onClick={cycleSpeed}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-900 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              title="Playback Speed"
            >
              {playbackRate}x
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1 rounded-lg hover:bg-slate-900 text-slate-200 hover:text-white transition cursor-pointer"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
