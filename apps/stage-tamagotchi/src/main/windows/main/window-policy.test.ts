import { describe, expect, it, vi } from 'vitest'

import { applyMainWindowDisplayMode, ordinaryMainWindowConfig, selectMainWindowDisplayMode } from './window-policy'

describe('main window policy', () => {
  it('uses an ordinary main window on Flatpak KDE Wayland', () => {
    expect(selectMainWindowDisplayMode({
      FLATPAK_ID: 'ai.moeru.airi',
      XDG_CURRENT_DESKTOP: 'KDE',
      XDG_SESSION_TYPE: 'Wayland',
    })).toBe('ordinary-window')

    expect(selectMainWindowDisplayMode({
      FLATPAK_ID: 'ai.moeru.airi',
      DESKTOP_SESSION: 'plasma',
      XDG_SESSION_TYPE: 'wayland',
    })).toBe('ordinary-window')
  })

  it('keeps the special panel mode outside the Flatpak KDE Wayland combination', () => {
    expect(selectMainWindowDisplayMode({
      FLATPAK_ID: 'ai.moeru.airi',
      XDG_CURRENT_DESKTOP: 'GNOME',
      XDG_SESSION_TYPE: 'wayland',
    })).toBe('special-panel')

    expect(selectMainWindowDisplayMode({
      XDG_CURRENT_DESKTOP: 'KDE',
      XDG_SESSION_TYPE: 'wayland',
    })).toBe('special-panel')

    expect(selectMainWindowDisplayMode({
      FLATPAK_ID: 'ai.moeru.airi',
      XDG_CURRENT_DESKTOP: 'KDE',
      XDG_SESSION_TYPE: 'x11',
    })).toBe('special-panel')
  })

  it('builds ordinary BrowserWindow options without transparent panel hints', () => {
    expect(ordinaryMainWindowConfig()).toEqual({
      frame: true,
      transparent: false,
      hasShadow: true,
    })
  })

  it('does not apply panel-only compositor hints in ordinary mode', () => {
    const window = {
      setAlwaysOnTop: vi.fn(),
      setFullScreenable: vi.fn(),
      setVisibleOnAllWorkspaces: vi.fn(),
    }

    applyMainWindowDisplayMode(window, 'ordinary-window')

    expect(window.setFullScreenable).toHaveBeenCalledWith(false)
    expect(window.setAlwaysOnTop).not.toHaveBeenCalled()
    expect(window.setVisibleOnAllWorkspaces).not.toHaveBeenCalled()
  })

  it('keeps panel compositor hints in the default mode', () => {
    const window = {
      setAlwaysOnTop: vi.fn(),
      setFullScreenable: vi.fn(),
      setVisibleOnAllWorkspaces: vi.fn(),
    }

    applyMainWindowDisplayMode(window, 'special-panel')

    expect(window.setFullScreenable).toHaveBeenCalledWith(false)
    expect(window.setAlwaysOnTop).toHaveBeenCalledWith(true, 'screen-saver', 1)
    expect(window.setVisibleOnAllWorkspaces).toHaveBeenCalledWith(true)
  })
})
