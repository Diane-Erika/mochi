import { create } from 'zustand'

export type AnimationName = 'idle'

export interface AnimationState {
    current: AnimationName
    frame: number
    play: (name: AnimationName) => void
    advanceFrame: (maxFrames: number) => void
}

export const useAnimationStore = create<AnimationState>((set) => ({
    current: 'idle',
    frame: 0,
    play: (name) => set({ current: name, frame: 0 }),
    advanceFrame: (maxFrames) => set((state) => ({ frame: (state.frame + 1) % maxFrames })),
}))
