import { ElectronAPI } from '@electron-toolkit/preload'
import { PetPosition } from '../shared/petPosition'

export interface PetAPI {
    moveBy: (dx: number, dy: number) => Promise<PetPosition>
}

declare global {
    interface Window {
        electron: ElectronAPI
        api: PetAPI
    }
}
