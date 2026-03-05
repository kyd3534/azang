'use client';

import { useState } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICES: { id: DeviceMode; icon: typeof Monitor; label: string; width: string | null }[] = [
  { id: 'desktop', icon: Monitor, label: '데스크톱', width: null },
  { id: 'tablet', icon: Tablet, label: '768px', width: '768px' },
  { id: 'mobile', icon: Smartphone, label: '390px', width: '390px' },
];

export function DevicePreview({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DeviceMode>('desktop');

  const current = DEVICES.find((d) => d.id === mode)!;

  return (
    <>
      {/* 플로팅 툴바 */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #E5E7EB',
          borderRadius: 9999,
          padding: '5px 10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
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

      {/* 콘텐츠 래퍼 */}
      {!current.width ? (
        <>{children}</>
      ) : (
        <div
          style={{
            minHeight: '100vh',
            background: '#D1D5DB',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          {/* 기기 라벨 */}
          <div
            style={{
              position: 'fixed',
              top: 10,
              right: 16,
              zIndex: 99999,
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
      )}
    </>
  );
}
