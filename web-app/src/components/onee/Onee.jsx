import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { loadAvatarRuntime } from './avatar-runtime.js';
import { avatarData } from './onee.avatar.js';

const VALID_ANIMATIONS = new Set([
  'sleeping', 'waking', 'idle', 'listening', 'thinking', 'searching',
  'working', 'excited', 'bored', 'suspicious', 'angry', 'drowsy',
  'happy', 'curious', 'confused', 'surprised', 'proud', 'sad',
  'laughing', 'scared', 'playful', 'celebrate'
]);

function getSafeAnimation(name) {
  if (name && VALID_ANIMATIONS.has(name)) return name;
  return 'idle';
}

export const Onee = forwardRef(function Onee(
  {
    animation = "idle",
    playing = true,
    loop,
    size = 240,
    className,
    style,
    onAnimationEnd,
  },
  ref
) {
  const host = useRef(null);
  const controller = useRef(null);
  const safeAnim = getSafeAnimation(animation);
  const animationRef = useRef(safeAnim);
  const playingRef = useRef(playing);
  const onAnimationEndRef = useRef(onAnimationEnd);
  animationRef.current = safeAnim;
  playingRef.current = playing;
  onAnimationEndRef.current = onAnimationEnd;

  useEffect(() => {
    if (!host.current) return;
    let disposed = false;
    let avatar = null;

    void loadAvatarRuntime(avatarData)
      .then(runtime => {
        if (disposed || !host.current) return;
        try {
          avatar = runtime.createAvatar(host.current, {
            animation: animationRef.current,
            autoplay: playingRef.current,
            loop,
            size: '100%',
            onAnimationEnd: next => onAnimationEndRef.current?.(next),
          });
          controller.current = avatar;
        } catch (err) {
          console.warn('[Onee] createAvatar warning:', err);
        }
      })
      .catch(err => {
        console.warn('[Onee] loadAvatarRuntime warning:', err);
      });

    return () => {
      disposed = true;
      try {
        avatar?.destroy();
      } catch (_e) {
        // Safe disposal
      }
      controller.current = null;
    };
  }, [loop]);

  useEffect(() => {
    const avatar = controller.current;
    if (!avatar) return;
    try {
      if (playing) {
        avatar.play(safeAnim);
      } else {
        avatar.pause();
      }
    } catch (err) {
      console.warn('[Onee] Play error handled:', err);
    }
  }, [safeAnim, playing]);

  useImperativeHandle(ref, () => ({
    play(next = animation) { 
      try {
        controller.current?.play(getSafeAnimation(next)); 
      } catch (_e) {}
    },
    pause() { 
      try {
        controller.current?.pause(); 
      } catch (_e) {}
    },
    stop() { 
      try {
        controller.current?.stop(); 
      } catch (_e) {}
    },
  }), [animation]);

  const dimension = typeof size === 'number' ? size + 'px' : size;
  return (
    <span 
      ref={host} 
      className={className} 
      style={{ display: 'inline-block', width: dimension, height: dimension, ...style }} 
    />
  );
});

export default Onee;
