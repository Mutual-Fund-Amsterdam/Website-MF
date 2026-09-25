"use client";

import Image from "next/image";
import { useState } from "react";

const videoUrl =
  "https://www.youtube-nocookie.com/embed/5cAZ-VM_MpQ?autoplay=1&playsinline=1&rel=0";

export default function IntroVideo() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="video-frame">
      {isPlaying ? (
        <iframe
          src={videoUrl}
          title="Mutual Fund — beleggen met passie"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          className="video-poster"
          type="button"
          onClick={() => setIsPlaying(true)}
          aria-label="Speel de video over Mutual Fund af"
        >
          <Image
            className="video-poster-image"
            src="/images/mf-meeting-audience.jpg"
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
          />
          <span className="video-poster-shade" aria-hidden="true" />
          <span className="video-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="m8 5 11 7-11 7V5Z" />
            </svg>
          </span>
          <span className="video-poster-label" aria-hidden="true">
            Mutual Fund in beeld
          </span>
        </button>
      )}
    </div>
  );
}
