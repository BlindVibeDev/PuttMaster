import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AudioState {
  // Game audio elements
  backgroundMusic: HTMLAudioElement | null;
  hitSound: HTMLAudioElement | null;
  successSound: HTMLAudioElement | null;
  swingSound: HTMLAudioElement | null;
  waterSound: HTMLAudioElement | null;
  bounceSound: HTMLAudioElement | null;
  
  // Menu/UI audio elements
  clickSound: HTMLAudioElement | null;
  notificationSound: HTMLAudioElement | null;
  readySound: HTMLAudioElement | null;
  lobbyMusic: HTMLAudioElement | null;
  joinSound: HTMLAudioElement | null;
  leaveSound: HTMLAudioElement | null;
  
  // State
  isMuted: boolean;
  volume: number; // 0 to 1
  
  // Setter functions - Game sounds
  setBackgroundMusic: (music: HTMLAudioElement) => void;
  setHitSound: (sound: HTMLAudioElement) => void;
  setSuccessSound: (sound: HTMLAudioElement) => void;
  setSwingSound: (sound: HTMLAudioElement) => void;
  setWaterSound: (sound: HTMLAudioElement) => void;
  setBounceSound: (sound: HTMLAudioElement) => void;
  
  // Setter functions - Menu/UI sounds
  setClickSound: (sound: HTMLAudioElement) => void;
  setNotificationSound: (sound: HTMLAudioElement) => void;
  setReadySound: (sound: HTMLAudioElement) => void;
  setLobbyMusic: (music: HTMLAudioElement) => void;
  setJoinSound: (sound: HTMLAudioElement) => void;
  setLeaveSound: (sound: HTMLAudioElement) => void;
  
  // Volume control
  setVolume: (volume: number) => void;
  
  // Mute control
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  
  // Game sound playback
  playHit: () => void;
  playSuccess: () => void;
  playSwing: () => void;
  playWater: () => void;
  playBounce: () => void;
  
  // Menu/UI sound playback
  playClick: () => void;
  playNotification: () => void;
  playReady: () => void;
  playJoin: () => void;
  playLeave: () => void;
  
  // Background music control
  pauseBackgroundMusic: () => void;
  resumeBackgroundMusic: () => void;
  startLobbyMusic: () => void;
  stopLobbyMusic: () => void;
  
  // Load sound utilities
  loadSounds: () => void;
}

export const useAudio = create<AudioState>()(
  persist(
    (set, get) => ({
      // Game sounds
      backgroundMusic: null,
      hitSound: null,
      successSound: null,
      swingSound: null,
      waterSound: null,
      bounceSound: null,
      
      // Menu/UI sounds
      clickSound: null,
      notificationSound: null,
      readySound: null,
      lobbyMusic: null,
      joinSound: null,
      leaveSound: null,
      
      // State
      isMuted: false, // Start with sound enabled
      volume: 0.7, // Default volume
      
      // Setter functions - Game sounds
      setBackgroundMusic: (music) => set({ backgroundMusic: music }),
      setHitSound: (sound) => set({ hitSound: sound }),
      setSuccessSound: (sound) => set({ successSound: sound }),
      setSwingSound: (sound) => set({ swingSound: sound }),
      setWaterSound: (sound) => set({ waterSound: sound }),
      setBounceSound: (sound) => set({ bounceSound: sound }),
      
      // Setter functions - Menu/UI sounds
      setClickSound: (sound) => set({ clickSound: sound }),
      setNotificationSound: (sound) => set({ notificationSound: sound }),
      setReadySound: (sound) => set({ readySound: sound }),
      setLobbyMusic: (music) => set({ lobbyMusic: music }),
      setJoinSound: (sound) => set({ joinSound: sound }),
      setLeaveSound: (sound) => set({ leaveSound: sound }),
      
      // Volume control
      setVolume: (volume) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ volume: clampedVolume });
        
        // Update all sound volumes
        const state = get();
        const sounds = [
          state.backgroundMusic, state.hitSound, state.successSound,
          state.swingSound, state.waterSound, state.bounceSound,
          state.clickSound, state.notificationSound, state.readySound,
          state.lobbyMusic, state.joinSound, state.leaveSound
        ];
        
        sounds.forEach(sound => {
          if (sound) {
            sound.volume = clampedVolume;
          }
        });
      },
      
      // Mute control
      setMuted: (muted) => {
        set({ isMuted: muted });
        
        // Handle background music based on mute state
        const { backgroundMusic, lobbyMusic } = get();
        
        if (backgroundMusic) {
          if (muted) {
            backgroundMusic.pause();
          } else {
            backgroundMusic.play().catch(err => {
              console.log('Play prevented after unmute. User interaction may be required.', err);
            });
          }
        }
        
        if (lobbyMusic) {
          if (muted) {
            lobbyMusic.pause();
          } else {
            lobbyMusic.play().catch(err => {
              console.log('Play prevented after unmute. User interaction may be required.', err);
            });
          }
        }
      },
      
      toggleMute: () => {
        const { isMuted } = get();
        get().setMuted(!isMuted);
        console.log(`Sound ${!isMuted ? 'muted' : 'unmuted'}`);
      },
      
      // Game sound playback
      playHit: () => {
        const { hitSound, isMuted, volume } = get();
        if (hitSound && !isMuted) {
          // Clone the sound to allow overlapping playback
          const soundClone = hitSound.cloneNode() as HTMLAudioElement;
          soundClone.volume = volume * 0.3; // Adjust relative volume
          soundClone.play().catch(error => {
            console.log("Hit sound play prevented:", error);
          });
        }
      },
      
      playSuccess: () => {
        const { successSound, isMuted, volume } = get();
        if (successSound && !isMuted) {
          successSound.currentTime = 0;
          successSound.volume = volume * 0.5; // Adjust relative volume
          successSound.play().catch(error => {
            console.log("Success sound play prevented:", error);
          });
        }
      },
      
      playSwing: () => {
        const { swingSound, isMuted, volume } = get();
        if (swingSound && !isMuted) {
          // Clone the sound to allow overlapping playback
          const soundClone = swingSound.cloneNode() as HTMLAudioElement;
          soundClone.volume = volume * 0.2; // Adjust relative volume
          soundClone.play().catch(error => {
            console.log("Swing sound play prevented:", error);
          });
        }
      },
      
      playWater: () => {
        const { waterSound, isMuted, volume } = get();
        if (waterSound && !isMuted) {
          waterSound.currentTime = 0;
          waterSound.volume = volume * 0.4; // Adjust relative volume
          waterSound.play().catch(error => {
            console.log("Water sound play prevented:", error);
          });
        }
      },
      
      playBounce: () => {
        const { bounceSound, isMuted, volume } = get();
        if (bounceSound && !isMuted) {
          // Clone the sound to allow multiple bounces
          const soundClone = bounceSound.cloneNode() as HTMLAudioElement;
          soundClone.volume = volume * 0.15; // Adjust relative volume
          soundClone.play().catch(error => {
            console.log("Bounce sound play prevented:", error);
          });
        }
      },
      
      // Menu/UI sound playback
      playClick: () => {
        const { clickSound, isMuted, volume } = get();
        if (clickSound && !isMuted) {
          clickSound.currentTime = 0;
          clickSound.volume = volume * 0.3;
          clickSound.play().catch(error => {
            console.log("Click sound play prevented:", error);
          });
        }
      },
      
      playNotification: () => {
        const { notificationSound, isMuted, volume } = get();
        if (notificationSound && !isMuted) {
          notificationSound.currentTime = 0;
          notificationSound.volume = volume * 0.4;
          notificationSound.play().catch(error => {
            console.log("Notification sound play prevented:", error);
          });
        }
      },
      
      playReady: () => {
        const { readySound, isMuted, volume } = get();
        if (readySound && !isMuted) {
          readySound.currentTime = 0;
          readySound.volume = volume * 0.5;
          readySound.play().catch(error => {
            console.log("Ready sound play prevented:", error);
          });
        }
      },
      
      playJoin: () => {
        const { joinSound, isMuted, volume } = get();
        if (joinSound && !isMuted) {
          joinSound.currentTime = 0;
          joinSound.volume = volume * 0.4;
          joinSound.play().catch(error => {
            console.log("Join sound play prevented:", error);
          });
        }
      },
      
      playLeave: () => {
        const { leaveSound, isMuted, volume } = get();
        if (leaveSound && !isMuted) {
          leaveSound.currentTime = 0;
          leaveSound.volume = volume * 0.4;
          leaveSound.play().catch(error => {
            console.log("Leave sound play prevented:", error);
          });
        }
      },
      
      // Background music control
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
      
      startLobbyMusic: () => {
        const { lobbyMusic, isMuted, volume } = get();
        if (lobbyMusic && !isMuted) {
          lobbyMusic.loop = true;
          lobbyMusic.volume = volume * 0.3; // Lower volume for background music
          lobbyMusic.currentTime = 0;
          lobbyMusic.play().catch(err => {
            console.log('Lobby music play prevented. User interaction required.', err);
          });
        }
      },
      
      stopLobbyMusic: () => {
        const { lobbyMusic } = get();
        if (lobbyMusic) {
          lobbyMusic.pause();
          lobbyMusic.currentTime = 0;
        }
      },
      
      loadSounds: () => {
        // This function loads all game sounds that we need access to
        console.log('Loading game audio assets...');
        
        // Game sounds
        const backgroundMusic = new Audio('/sounds/game_music.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = get().volume * 0.3;
        set({ backgroundMusic });
        
        const hitSound = new Audio('/sounds/hit.mp3');
        hitSound.volume = get().volume * 0.3;
        set({ hitSound });
        
        const successSound = new Audio('/sounds/success.mp3');
        successSound.volume = get().volume * 0.5;
        set({ successSound });
        
        const swingSound = new Audio('/sounds/swing.mp3');
        swingSound.volume = get().volume * 0.2;
        set({ swingSound });
        
        const waterSound = new Audio('/sounds/water.mp3');
        waterSound.volume = get().volume * 0.4;
        set({ waterSound });
        
        const bounceSound = new Audio('/sounds/bounce.mp3');
        bounceSound.volume = get().volume * 0.15;
        set({ bounceSound });
        
        // Menu/UI sounds
        const clickSound = new Audio('/sounds/click.mp3');
        clickSound.volume = get().volume * 0.3;
        set({ clickSound });
        
        const notificationSound = new Audio('/sounds/notification.mp3');
        notificationSound.volume = get().volume * 0.4;
        set({ notificationSound });
        
        const readySound = new Audio('/sounds/ready.mp3');
        readySound.volume = get().volume * 0.5;
        set({ readySound });
        
        const lobbyMusic = new Audio('/sounds/lobby_music.mp3');
        lobbyMusic.loop = true;
        lobbyMusic.volume = get().volume * 0.3;
        set({ lobbyMusic });
        
        const joinSound = new Audio('/sounds/join.mp3');
        joinSound.volume = get().volume * 0.4;
        set({ joinSound });
        
        const leaveSound = new Audio('/sounds/leave.mp3');
        leaveSound.volume = get().volume * 0.4;
        set({ leaveSound });
        
        console.log('Audio assets loaded successfully');
      },
    }),
    {
      name: 'putt-putt-audio-settings',
      partialize: (state) => ({ 
        volume: state.volume, 
        isMuted: state.isMuted 
      }),
    }
  )
);
