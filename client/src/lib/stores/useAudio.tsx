import { create } from "zustand";

interface AudioState {
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  swingSound: HTMLAudioElement | null;
  waterSound: HTMLAudioElement | null;
  bounceSound: HTMLAudioElement | null;
  isMuted: boolean;
  
  // Setter functions
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setSwingSound: (sound: HTMLAudioElement) => void;
  setWaterSound: (sound: HTMLAudioElement) => void;
  setBounceSound: (sound: HTMLAudioElement) => void;
  
  // Control functions
  toggleMute: () => void;
  playHit: () => void;
  playSuccess: () => void;
  playSwing: () => void;
  playWater: () => void;
  playBounce: () => void;
  pauseBackgroundMusic: () => void;
  resumeBackgroundMusic: () => void;
}

export const useAudio = create<AudioState>((set, get) => ({
  backgroundMusic: null,
  hitSound: null,
  successSound: null,
  swingSound: null,
  waterSound: null,
  bounceSound: null,
  isMuted: false, // Start with sound enabled
  
  setBackgroundMusic: (music) => set({ backgroundMusic: music }),
  setHitSound: (sound) => set({ hitSound: sound }),
  setSuccessSound: (sound) => set({ successSound: sound }),
  setSwingSound: (sound) => set({ swingSound: sound }),
  setWaterSound: (sound) => set({ waterSound: sound }),
  setBounceSound: (sound) => set({ bounceSound: sound }),
  
  toggleMute: () => {
    const { isMuted, backgroundMusic } = get();
    const newMutedState = !isMuted;
    
    // Update the muted state
    set({ isMuted: newMutedState });
    
    // Handle background music based on mute state
    if (backgroundMusic) {
      if (newMutedState) {
        backgroundMusic.pause();
      } else {
        backgroundMusic.play().catch(err => {
          console.log('Play prevented after unmute. User interaction may be required.', err);
        });
      }
    }
    
    // Log the change
    console.log(`Sound ${newMutedState ? 'muted' : 'unmuted'}`);
  },
  
  pauseBackgroundMusic: () => {
    const { backgroundMusic } = get();
    if (backgroundMusic) {
      backgroundMusic.pause();
    }
  },
  
  resumeBackgroundMusic: () => {
    const { backgroundMusic, isMuted } = get();
    if (backgroundMusic && !isMuted) {
      backgroundMusic.play().catch(err => {
        console.log('Auto-play prevented. User interaction required.', err);
      });
    }
  },
  
  playHit: () => {
    const { hitSound, isMuted } = get();
    if (hitSound && !isMuted) {
      // Clone the sound to allow overlapping playback
      const soundClone = hitSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.3;
      soundClone.play().catch(error => {
        console.log("Hit sound play prevented:", error);
      });
    }
  },
  
  playSuccess: () => {
    const { successSound, isMuted } = get();
    if (successSound && !isMuted) {
      successSound.currentTime = 0;
      successSound.play().catch(error => {
        console.log("Success sound play prevented:", error);
      });
    }
  },
  
  playSwing: () => {
    const { swingSound, isMuted } = get();
    if (swingSound && !isMuted) {
      // Clone the sound to allow overlapping playback
      const soundClone = swingSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.2;
      soundClone.play().catch(error => {
        console.log("Swing sound play prevented:", error);
      });
    }
  },
  
  playWater: () => {
    const { waterSound, isMuted } = get();
    if (waterSound && !isMuted) {
      waterSound.currentTime = 0;
      waterSound.play().catch(error => {
        console.log("Water sound play prevented:", error);
      });
    }
  },
  
  playBounce: () => {
    const { bounceSound, isMuted } = get();
    if (bounceSound && !isMuted) {
      // Clone the sound to allow multiple bounces
      const soundClone = bounceSound.cloneNode() as HTMLAudioElement;
      soundClone.volume = 0.15;
      soundClone.play().catch(error => {
        console.log("Bounce sound play prevented:", error);
      });
    }
  }
}));
