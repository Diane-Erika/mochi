/* eslint-disable prettier/prettier */
import { create } from 'zustand'

export type AnimationName = 'idle' | 'walk'

export interface AnimationState {
    current: AnimationName
    frame: number
    direction: 1 | -1
    play: (name: AnimationName) => void
    advanceFrame: (maxFrames: number) => void
    setDirection: (d: 1 | -1) => void
}

export const useAnimationStore = create<AnimationState>((set) => ({
    current: 'idle',
    frame: 0,
    direction: 1,
    play: (name) => set({ current: name, frame: 0 }),
    advanceFrame: (maxFrames) => set((state) => ({ frame: (state.frame + 1) % maxFrames })),
    setDirection: (d) => set({ direction: d }),
}))
