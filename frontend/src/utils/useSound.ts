// src/hooks/useSound.js
import { useMemo } from 'react';
import { Howl } from 'howler';

const useSound = (src: string, options = {}) => {
  const sound = useMemo(() => new Howl({ src: [src], ...options }), [src]);

  const play = () => sound.play(); // returns sound ID (can be used to stop individual instances)

  const stop = (id: number) => {
    if (id) {
      sound.stop(id); // stop a specific instance
    } else {
      sound.stop(); // stop all instances
    }
  };

  return { play, stop };
};

export default useSound;
