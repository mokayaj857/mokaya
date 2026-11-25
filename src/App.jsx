import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Projects from './components/Projects';
import ProtocolPlayground from './components/ProtocolPlayground';
import EngineeringFocus from './components/EngineeringFocus';
import Bio from './components/Bio';
import Contact from './components/Contact';
import Footer from './components/Footer';
import DeveloperTerminal from './components/DeveloperTerminal';
import CommandPalette from './components/CommandPalette';
import CustomCursor from './components/CustomCursor';
import PhotoDumpModal, { FloatingPhotoDumpButton } from './components/PhotoDumpModal';
import { sound } from './utils/sound';
import { Terminal, Search, Volume2, VolumeX } from 'lucide-react';
import './App.css';

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('jm-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [photoDumpOpen, setPhotoDumpOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jm-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    sound.playClick();
  };

  const toggleSound = () => {
    const next = sound.toggle();
    setSoundEnabled(next);
    if (next) sound.playClick();
  };

  // Global keyboard shortcuts (Cmd+K for Command Palette, ~ for Terminal)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        sound.playClick();
      } else if (e.key === '`' || e.key === '~') {
        const active = document.activeElement;
        const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
        if (!isInput) {
          e.preventDefault();
          setTerminalOpen((prev) => !prev);
          sound.playClick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="portfolio-app">
      {/* Custom Precision Cursor */}
      <CustomCursor />

      {/* Floating Pill Navigation */}
      <Navbar
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenCommandPalette={() => {
          sound.playClick();
          setPaletteOpen(true);
        }}
        onOpenTerminal={() => {
          sound.playClick();
          setTerminalOpen(true);
        }}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
      />

      {/* Main Single-Column Document Flow */}
      <main className="container">
        <Hero />
        <Projects />
        <ProtocolPlayground />
        <EngineeringFocus />
        <Bio />
        <Contact />
        <Footer />
      </main>

      {/* Floating Interactive Dock (Quick HUD - Bottom Right) */}
      <div className="floating-hud-dock">
        <button
          type="button"
          className="hud-dock-btn"
          onClick={() => {
            sound.playClick();
            setPaletteOpen(true);
          }}
          title="Open Command Palette (Cmd + K)"
        >
          <Search size={13} />
          <span className="mono">⌘K</span>
        </button>

        <button
          type="button"
          className="hud-dock-btn"
          onClick={() => {
            sound.playClick();
            setTerminalOpen(true);
          }}
          title="Open Developer Terminal (~)"
        >
          <Terminal size={13} />
          <span className="mono">Terminal</span>
        </button>

        <button
          type="button"
          className="hud-dock-btn icon-only"
          onClick={toggleSound}
          title={soundEnabled ? 'Tactile Sound: ON (Click to mute)' : 'Tactile Sound: MUTED (Click to enable)'}
        >
          {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
      </div>

      {/* Floating Photo Dump Widget (Bottom Left - Google Photos Pinwheel) */}
      <FloatingPhotoDumpButton onClick={() => setPhotoDumpOpen(true)} />

      {/* Modal: Photo Dump Gallery */}
      <PhotoDumpModal
        isOpen={photoDumpOpen}
        onClose={() => setPhotoDumpOpen(false)}
      />

      {/* Modal: Developer Terminal */}
      {terminalOpen && (
        <DeveloperTerminal
          isOpen={terminalOpen}
          onClose={() => setTerminalOpen(false)}
          theme={theme}
          toggleTheme={toggleTheme}
          soundEnabled={soundEnabled}
          toggleSound={toggleSound}
          onOpenPhotoDump={() => setPhotoDumpOpen(true)}
        />
      )}

      {/* Modal: Command Palette */}
      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          theme={theme}
          toggleTheme={toggleTheme}
          soundEnabled={soundEnabled}
          toggleSound={toggleSound}
          onOpenPhotoDump={() => setPhotoDumpOpen(true)}
        />
      )}
    </div>
  );
}
