import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { PET_SIZE } from '../shared/petSize'
import { PetPosition } from '../shared/petPosition'

function createWindow(): void {
    const { workArea } = screen.getPrimaryDisplay()

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: PET_SIZE,
        height: PET_SIZE,
        x: Math.round(workArea.x + workArea.width / 2),
        // Spawn on the ground. Must agree with `groundY` in pet:move-by, or the
        // pet reports a non-zero altitude before it has ever flown.
        y: workArea.y + workArea.height - PET_SIZE,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        hasShadow: false,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
        },
    })

    mainWindow.setAlwaysOnTop(true, 'screen-saver')
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // IPC test
    ipcMain.on('ping', () => console.log('pong'))

    ipcMain.handle('pet:move-by', (e, dx: number, dy: number): PetPosition => {
        const win = BrowserWindow.fromWebContents(e.sender)!
        const [x, y] = win.getPosition()
        const { workArea } = screen.getPrimaryDisplay()
        const maxX = workArea.x + workArea.width - PET_SIZE
        const groundY = workArea.y + workArea.height - PET_SIZE
        const nextX = Math.round(Math.min(maxX, Math.max(workArea.x, x + dx)))
        const nextY = Math.round(Math.min(groundY, Math.max(workArea.y, y + dy)))

        win.setBounds({ x: nextX, y: nextY, width: PET_SIZE, height: PET_SIZE })

        return {
            x: nextX,
            y: nextY,
            // Altitude counts up from the floor, so the renderer can reason
            // about height without knowing where the work area begins.
            altitude: groundY - nextY,
            maxAltitude: groundY - workArea.y,
            atLeft: nextX <= workArea.x,
            atRight: nextX >= maxX,
            atGround: nextY >= groundY,
            atCeiling: nextY <= workArea.y,
        }
    })

    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
