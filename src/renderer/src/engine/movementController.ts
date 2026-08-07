import { useAnimationStore } from './animationStore'

const STEP_MS = 33 // ~30fps movement, independent of the 4fps frame ticker
const SPEED = 2 // pixels per step, horizontal
const FLY_SPEED = 2 // pixels per step, vertical

// Heights mochi settles at, as fractions of the tallest flight the display
// allows. Discrete levels rather than a free random number so repeated visits
// read as floors instead of drift; 0 is how it gets back down.
const ALTITUDE_LEVELS = [0, 0.3, 0.55, 0.8]
const FLIGHT_MIN_MS = 6000
const FLIGHT_MAX_MS = 12000

function pickAltitude(maxAltitude: number, current: number): number {
    const levels = ALTITUDE_LEVELS.map((f) => Math.round(f * maxAltitude)).filter(
        // Skip the level it is already on, or the flight is a no-op.
        (a) => Math.abs(a - current) > FLY_SPEED,
    )
    if (levels.length === 0) return current
    return levels[Math.floor(Math.random() * levels.length)]
}

export function startMovementController(): () => void {
    let stopped = false
    let timer: ReturnType<typeof setTimeout>
    let flightTimer: ReturnType<typeof setTimeout>

    async function tick(): Promise<void> {
        if (stopped) return
        const { current, direction, altitude, targetAltitude } = useAnimationStore.getState()
        const { setDirection, syncAltitude, setTargetAltitude } = useAnimationStore.getState()

        // One axis at a time: mochi climbs to a height, then walks along it.
        const gap = targetAltitude - altitude
        const flying = gap !== 0

        // Screen y grows downward while altitude grows upward, hence the
        // negation. Capping the step at the remaining gap makes the last one
        // land exactly on the level instead of oscillating around it.
        const dy = flying ? -Math.sign(gap) * Math.min(FLY_SPEED, Math.abs(gap)) : 0
        const dx = current === 'walk' ? direction * SPEED : 0

        const pos = await window.api.moveBy(dx, dy)
        syncAltitude(pos.altitude, pos.maxAltitude)

        if (dx !== 0) {
            // Set, don't toggle: at the left edge direction is always +1 no
            // matter how many ticks report it, so the pet leaves as soon as it
            // physically can instead of vibrating against the wall.
            if (pos.atLeft) setDirection(1)
            else if (pos.atRight) setDirection(-1)
        }

        // The clamp is the backstop. A target this display cannot reach would
        // otherwise leave mochi climbing against the ceiling forever.
        if (flying && (pos.atGround || pos.atCeiling)) setTargetAltitude(pos.altitude)

        if (!stopped) timer = setTimeout(tick, STEP_MS)
    }

    function scheduleFlight(): void {
        const delay = FLIGHT_MIN_MS + Math.random() * (FLIGHT_MAX_MS - FLIGHT_MIN_MS)
        flightTimer = setTimeout(() => {
            if (stopped) return
            const { altitude, maxAltitude, targetAltitude, setTargetAltitude } =
                useAnimationStore.getState()
            // Don't retarget mid-climb — let the flight in progress finish.
            if (altitude === targetAltitude) {
                setTargetAltitude(pickAltitude(maxAltitude, altitude))
            }
            scheduleFlight()
        }, delay)
    }

    tick()
    scheduleFlight()

    return () => {
        stopped = true
        clearTimeout(timer)
        clearTimeout(flightTimer)
    }
}
