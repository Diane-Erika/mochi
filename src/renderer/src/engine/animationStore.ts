/* eslint-disable prettier/prettier */
import { create } from 'zustand'

export type AnimationName = 'idle' | 'walk' | 'fly'

export interface AnimationState {
    current: AnimationName
    frame: number
    direction: 1 | -1
    verticalDirection: 1 | -1 // 1 = moving down (y increasing), -1 = moving up (y decreasing)
    play: (name: AnimationName) => void
    advanceFrame: (maxFrames: number) => void
    setDirection: (d: 1 | -1) => void
    setVerticalDirection: (d: 1 | -1) => void
}

export const useAnimationStore = create<AnimationState>((set) => ({
    current: 'idle',
    frame: 0,
    direction: 1,
    verticalDirection: 1,
    play: (name) => set({ current: name, frame: 0 }),
    advanceFrame: (maxFrames) => set((state) => ({ frame: (state.frame + 1) % maxFrames })),
    setDirection: (d) => set({ direction: d }),
    setVerticalDirection: (d) => set({ verticalDirection: d }),
}))
