import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
    moveBy: (dx: number): Promise<{ x: number; atLeft: boolean; atRight: boolean }> =>
        ipcRenderer.invoke('pet:move-by', dx),
    moveByY: (dy: number): Promise<{ y: number; atTop: boolean; atBottom: boolean }> =>
        ipcRenderer.invoke('pet:move-by-y', dy),
    getCursorPoint: (): Promise<{ x: number; y: number }> =>
        ipcRenderer.invoke('pet:get-cursor-point'),
    getPosition: (): Promise<{ x: number; y: number }> => ipcRenderer.invoke('pet:get-position'),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}
