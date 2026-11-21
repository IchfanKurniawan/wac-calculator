import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronLeft, Droplets, Building2, Factory, ShoppingBag, Home, Plane, Landmark, Building, Download, Upload } from 'lucide-react';
import { C } from '../../components/shared/tokens';
import { TYPOLOGY_CONFIG } from '../../constants/typologies';

interface HeaderProps {
  onMenuClick: () => void;
  schemeLabel: string;
  isMobile: boolean;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  currentScheme: string;
  onSchemeChange: (scheme: string) => void;
  onImport: () => void;
  onExport: () => void;
}

const TYPOLOGY_ICONS: Record<string, React.ReactNode> = {
  KANTOR: <Building2 size={16} />,
  PABRIK: <Factory size={16} />,
  MALL: <ShoppingBag size={16} />,
  APARTEMEN: <Home size={16} />,
  AIRPORT: <Plane size={16} />,
  MASJID: <Landmark size={16} />,
  STADIUM: <Building size={16} />,
};

export function Header({
  onMenuClick,
  schemeLabel,
  isMobile,
  sidebarOpen,
  onSidebarToggle,
  currentScheme,
  onSchemeChange,
  onImport,
  onExport,
}: HeaderProps) {
  const [schemeOpen, setSchemeOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
          setSchemeOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const schemes = Object.entries(TYPOLOGY_CONFIG).map(([id, cfg]) => ({
    id,
    label: cfg.label,
    active: cfg.active,
    note: cfg.active ? 'Aktif — Phase 1' : (cfg.note ?? `Phase ${cfg.phase}`),
  }));

  const currentConfig = TYPOLOGY_CONFIG[currentScheme as keyof typeof TYPOLOGY_CONFIG];

  return (
    <header
      className="site-header"
      role="banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--hdr-h)',
        zIndex: 50,
        background: C.card,
        borderBottom: `1px solid ${C.line}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        boxShadow: '0 1px 3px rgba(17,17,17,0.08)',
      }}
    >
      {/* Hamburger */}
      <button
        type="button"
        onClick={onSidebarToggle}
        aria-label={sidebarOpen ? 'Tutup navigasi' : 'Buka navigasi'}
        aria-expanded={sidebarOpen}
        style={{
          display: isMobile ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 8,
          border: 'none',
          background: 'transparent',
          color: C.heading,
          cursor: 'pointer',
          marginRight: 12,
        }}
      >
        {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
      </button>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: C.brand,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <Droplets size={18} />
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--display)',
            fontSize: 18,
            fontWeight: 600,
            color: C.heading,
            lineHeight: 1.2,
          }}>
            Kalkulator Air
          </div>
          <div style={{
            fontFamily: 'var(--sans)',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: C.accent,
            marginTop: -2,
          }}>
            GREENSHIP NB
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Import / Export Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          onClick={onImport}
          aria-label="Impor JSON"
          title="Impor JSON"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: C.heading,
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = C.lighter}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Upload size={20} />
        </button>
        <button
          type="button"
          onClick={onExport}
          aria-label="Ekspor JSON"
          title="Ekspor JSON"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: C.heading,
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = C.lighter}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Download size={20} />
        </button>
      </div>

      {/* Typology Selector - Dropdown */}
      <div style={{ position: 'relative' }} ref={dropdownRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setSchemeOpen(!schemeOpen)}
          aria-label={`Tipologi: ${schemeLabel}. Klik untuk mengganti.`}
          aria-expanded={schemeOpen}
          aria-haspopup="listbox"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 14px',
            borderRadius: 10,
            border: `1.5px solid ${schemeOpen ? C.brand : C.line}`,
            background: C.card,
            color: C.heading,
            fontFamily: 'var(--sans)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: schemeOpen ? `0 0 0 3px ${C.brand}20` : 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {TYPOLOGY_ICONS[currentScheme] || <Building2 size={16} />}
          <span>{schemeLabel}</span>
          <ChevronLeft size={14} style={{ transition: 'transform 0.15s', transform: schemeOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </button>

        {schemeOpen && (
          <div
            role="listbox"
            aria-label="Pilih tipologi bangunan"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 60,
              minWidth: 260,
              background: C.card,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              boxShadow: '0 12px 40px rgba(17,17,17,0.15)',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out',
            }}
          >
            {schemes.map((s) => (
              <button
                key={s.id}
                type="button"
                role="option"
                aria-selected={s.id === currentScheme}
                onClick={() => {
                  onSchemeChange(s.id);
                  setSchemeOpen(false);
                }}
                disabled={!s.active}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  border: 'none',
                  background: s.id === currentScheme ? C.brandBg : 'transparent',
                  color: !s.active ? C.muted : s.id === currentScheme ? C.brand : C.heading,
                  fontFamily: 'var(--sans)',
                  fontSize: 14,
                  fontWeight: s.id === currentScheme ? 600 : 500,
                  cursor: !s.active ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s, color 0.1s',
                  borderBottom: s.id !== schemes[schemes.length - 1].id ? `1px solid ${C.line}` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = s.id === currentScheme ? C.brandBg : C.lighter;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.background = s.id === currentScheme ? C.brandBg : 'transparent';
                  }
                }}
              >
                {TYPOLOGY_ICONS[s.id] || <Building2 size={16} />}
                <span style={{ flex: 1 }}>{s.label}</span>
                {!s.active && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: C.warningBg,
                    color: C.warningInk,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {s.note?.replace('Phase ', 'P')}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}