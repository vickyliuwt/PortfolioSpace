"use client";

// VoiceBubble.tsx
// voice bubble

import { useEffect, useRef, useState } from "react";
import { FiPlay, FiPause } from "react-icons/fi";

// fake bars
function bars(seed: string, n = 34): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    out.push(0.25 + ((h % 1000) / 1000) * 0.75);
  }
  return out;
}

function mmss(sec: number): string {
  if (!sec || sec < 0) sec = 0;
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

export default function VoiceBubble({ src, secs, mine }: { src: string; secs?: number; mine?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [dur, setDur] = useState(secs || 0);
  const [wave, setWave] = useState<number[]>(() => bars(src));

  // real bars
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        const resp = await fetch(src);
        const raw = await resp.arrayBuffer();
        const ctx = new AC();
        const audioBuf = await ctx.decodeAudioData(raw);
        const data = audioBuf.getChannelData(0);
        const N = 34;
        const block = Math.floor(data.length / N) || 1;
        const peaks: number[] = [];
        let max = 0;
        for (let i = 0; i < N; i++) {
          let p = 0;
          for (let j = 0; j < block; j++) {
            const v = Math.abs(data[i * block + j] || 0);
            if (v > p) p = v;
          }
          peaks.push(p);
          if (p > max) max = p;
        }
        const norm = peaks.map((p) => (max > 0 ? 0.12 + (p / max) * 0.88 : 0.3));
        if (ctx.close) ctx.close();
        if (alive) setWave(norm);
      } catch {
        // keep the pseudo waveform
      }
    })();
    return () => {
      alive = false;
    };
  }, [src]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (a.duration && isFinite(a.duration)) setProgress(a.currentTime / a.duration);
    };
    const onMeta = () => {
      if (a.duration && isFinite(a.duration)) setDur(a.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => {});
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const fg = mine ? "#fff" : "var(--rose)";
  const bg = mine ? "rgba(255,255,255,0.4)" : "rgba(217,106,134,0.28)";
  const played = Math.round(progress * wave.length);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 190 }}>
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, border: "none", cursor: "pointer", background: mine ? "rgba(255,255,255,0.25)" : "var(--pink-wash)", color: fg, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {playing ? <FiPause /> : <FiPlay style={{ marginLeft: 2 }} />}
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, height: 28 }}>
        {wave.map((v, i) => (
          <span key={i} style={{ flex: 1, height: `${Math.round(v * 100)}%`, borderRadius: 999, background: i < played ? fg : bg, transition: "background 0.1s" }} />
        ))}
      </div>
      <span style={{ fontSize: "0.72rem", fontWeight: 700, opacity: 0.85, flexShrink: 0 }}>{mmss(dur)}</span>
    </div>
  );
}
