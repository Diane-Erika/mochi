import { AnimationName, useAnimationStore } from './animationStore'

const ANIM_POOL: AnimationName[] = ['idle', 'walk', 'fly']

function pickRandom<T>(pool: T[]): T {
    return pool[Math.floor(Math.random() * pool.length)]
}

export function startAnimationController(): () => void {
    const { play } = useAnimationStore.getState()

    let stopped = false
    let timer: ReturnType<typeof setTimeout>

    function scheduleNext(): void {
        const delay = 3000 + Math.random() * 5000 // every 3-8s
        timer = setTimeout(() => {
            if (stopped) return
            const next = pickRandom(ANIM_POOL)
            play(next)
            scheduleNext()
        }, delay)
    }

    scheduleNext()

    return () => {
        stopped = true
        clearTimeout(timer)
    }
}
