import { useRef, useState, useEffect } from 'react';
import { Play, Loader } from 'lucide-react';

interface ExerciseVideoProps {
  videoUrl: string;
  imageUrl?: string;
  name: string;
  className?: string;
  autoPlay?: boolean;
}

export function ExerciseVideo({ videoUrl, imageUrl, name, className = '', autoPlay = false }: ExerciseVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    if (videoRef.current) {
      videoRef.current.load();
      if (playing) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [videoUrl]);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  if (!videoUrl && !imageUrl) return null;

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-black/40 cursor-pointer group ${className}`}
      onClick={toggle}
    >
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={imageUrl}
          autoPlay={autoPlay}
          loop
          muted
          playsInline
          onCanPlay={() => setLoaded(true)}
          onLoadedData={() => setLoaded(true)}
          className="w-full h-full object-cover"
        />
      ) : imageUrl ? (
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      ) : null}

      {/* Loading indicator */}
      {!loaded && videoUrl && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <Loader size={24} className="text-primary-fixed animate-spin" />
        </div>
      )}

      {/* Play/Pause overlay */}
      {videoUrl && (
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${playing && loaded ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
          <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            {playing ? (
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-white rounded-full" />
                <div className="w-1 h-4 bg-white rounded-full" />
              </div>
            ) : (
              <Play size={18} fill="white" className="text-white ml-0.5" />
            )}
          </div>
        </div>
      )}

      {/* GIF badge */}
      {videoUrl && (
        <div className="absolute top-2 right-2 bg-primary-fixed text-on-primary-fixed font-mono font-black text-[9px] px-1.5 py-0.5 rounded tracking-widest">
          GIF
        </div>
      )}
    </div>
  );
}
