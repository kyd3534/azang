'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICES = [
  { id: 'desktop' as DeviceMode, icon: Monitor, label: '데스크톱', width: null as string | null },
  { id: 'tablet' as DeviceMode, icon: Tablet, label: '768px', width: '768px' },
  { id: 'mobile' as DeviceMode, icon: Smartphone, label: '390px', width: '390px' },
];

const DeviceModeContext = createContext<{
  mode: DeviceMode;
  setMode: (m: DeviceMode) => void;
}>({ mode: 'desktop', setMode: () => {} });

export function DeviceModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DeviceMode>('desktop');
  return (
    <DeviceModeContext.Provider value={{ mode, setMode }}>
      {children}
    </DeviceModeContext.Provider>
  );
}

/** 하단 고정 툴바 — body 직계 자식으로 렌더링 */
export function DeviceToolbar() {
  const { mode, setMode } = useContext(DeviceModeContext);
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #E5E7EB',
        borderRadius: 9999,
        padding: '5px 10px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        pointerEvents: 'auto',
      }}
    >
      {DEVICES.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          title={label}
          onClick={() => setMode(id)}
          style={{
            padding: '5px 8px',
            borderRadius: 9999,
            background: mode === id ? '#EC4899' : 'transparent',
            color: mode === id ? 'white' : '#9CA3AF',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            transition: 'all 0.15s',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <Icon size={14} />
          {mode === id && label}
        </button>
      ))}
    </div>
  );
}

/** 콘텐츠 래퍼 — 선택된 모드에 따라 너비 조절 */
export function DevicePreview({ children }: { children: React.ReactNode }) {
  const { mode, setMode: _ } = useContext(DeviceModeContext);
  const current = DEVICES.find((d) => d.id === mode)!;

  if (!current.width) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#D1D5DB',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          position: 'fixed',
          top: 10,
          right: 16,
          zIndex: 999999,
          fontSize: 11,
          color: '#6B7280',
          background: 'rgba(255,255,255,0.9)',
          border: '1px solid #E5E7EB',
          borderRadius: 6,
          padding: '3px 8px',
          fontWeight: 600,
        }}
      >
        {current.id === 'tablet' ? '📱 태블릿' : '📱 모바일'} · {current.label}
      </div>
      <div
        style={{
          width: current.width,
          maxWidth: current.width,
          minWidth: current.width,
          background: 'white',
          minHeight: '100vh',
          overflowX: 'hidden',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 25px 50px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
}
