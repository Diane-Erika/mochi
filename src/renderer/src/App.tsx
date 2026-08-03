import { useEffect } from 'react'
import { Pet } from './components/Pet'
import { startAnimationController } from './engine/animationController'
import { startMovementController } from './engine/movementController'

function App(): React.JSX.Element {
    useEffect(() => {
        const stopAnim = startAnimationController()
        const stopMove = startMovementController()

        return () => {
            stopAnim()
            stopMove()
        }
    }, [])

    return <Pet />
}

export default App
