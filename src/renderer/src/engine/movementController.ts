import { useAnimationStore } from './animationStore'

const STEP_MS = 33 // ~30fps movement, independent of the 4fps frame ticker
const SPEED = 2 // pixels per step

export function startMovementController(): () => void {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>

    async function tick(): Promise<void> {
        if (stopped) return
        const { current, direction, setDirection } = useAnimationStore.getState()

        if (current === 'walk') {
            const { atLeft, atRight } = await window.api.moveBy(direction * SPEED)
            console.log('atLeft', atLeft, 'atRight', atRight, 'direction', direction)
            // Set, don't toggle: at the left edge direction is always +1 no
            // matter how many ticks report it, so the pet leaves as soon as it
            // physically can instead of vibrating against the wall.
            if (atLeft) setDirection(1)
            else if (atRight) setDirection(-1)
        }

        if (!stopped) timer = setTimeout(tick, STEP_MS)
    }

    tick()
    return () => {
        stopped = true
        clearTimeout(timer)
    }
}
