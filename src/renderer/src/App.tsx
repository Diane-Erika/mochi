import { useEffect } from 'react'
import { Pet } from './components/Pet'
import { startAnimationController } from './engine/animationController'
import { startMovementController } from './engine/movementController'
import { startFollowController } from './engine/followController'

function App(): React.JSX.Element {
    useEffect(() => {
        const stopAnim = startAnimationController()
        const stopMove = startMovementController()
        const stopFollow = startFollowController()

        return () => {
            stopAnim()
            stopMove()
            stopFollow()
        }
    }, [])

    return <Pet />
}

export default App
