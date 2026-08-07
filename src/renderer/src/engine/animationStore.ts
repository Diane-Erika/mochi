/* eslint-disable prettier/prettier */
import { create } from 'zustand'

export type AnimationName = 'idle' | 'walk'

export interface AnimationState {
    current: AnimationName
    frame: number
    direction: 1 | -1
    /**
     * Height is its own axis, not an animation: there is no flight sprite yet,
     * so mochi keeps playing idle/walk while it climbs. Once fly art exists this
     * becomes an AnimationName like the rest.
     */
    altitude: number
    maxAltitude: number
    /** Where the current flight is headed. Equal to `altitude` means settled. */
    targetAltitude: number
    play: (name: AnimationName) => void
    advanceFrame: (maxFrames: number) => void
    setDirection: (d: 1 | -1) => void
    syncAltitude: (altitude: number, maxAltitude: number) => void
    setTargetAltitude: (altitude: number) => void
}

export const useAnimationStore = create<AnimationState>((set) => ({
    current: 'idle',
    frame: 0,
    direction: 1,
    altitude: 0,
    maxAltitude: 0,
    targetAltitude: 0,
    play: (name) => set({ current: name, frame: 0 }),
    advanceFrame: (maxFrames) => set((state) => ({ frame: (state.frame + 1) % maxFrames })),
    setDirection: (d) => set({ direction: d }),
    syncAltitude: (altitude, maxAltitude) => set({ altitude, maxAltitude }),
    setTargetAltitude: (altitude) => set({ targetAltitude: altitude }),
}))
