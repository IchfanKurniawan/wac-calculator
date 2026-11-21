import { Plus, Trash2 } from 'lucide-react';
import type { FixtureProduct, FixtureTypeId } from '../../types';
import { FIXTURE_BASELINES } from '../../constants/baselines';
import { mkProd } from '../../utils/defaults';
import { Inp, Badge, IconGhost, NumField } from './atoms';
import { C } from './tokens';

interface Props {
  type: FixtureTypeId;
  products: FixtureProduct[];
  onChange: (products: FixtureProduct[]) => void;
}

export function FixtureSection({ type, products, onChange }: Props) {
  const { baseline, unit, label } = FIXTURE_BASELINES[type];

  const add = () => products.length < 4 && onChange([...products, mkProd()]);
  const del = (i: number) => onChange(products.filter((_, j) => j !== i));
  const upd = (i: number, field: keyof FixtureProduct, val: string | number) => {
    const next = [...products];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };
  
  const handleNameChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => upd(i, 'name', e.target.value);

  return (
    <section style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <strong style={{ fontFamily: 'var(--sans)', fontSize: 14, color: C.heading }}>{label}</strong>
          <Badge variant="info" size="sm">Baseline ≤ {baseline} {unit}</Badge>
        </div>
        {products.length < 4 && (
          <button type="button" onClick={add} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: 'transparent', border: `1.5px solid ${C.heading}`,
            color: C.heading, fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
          }} onMouseEnter={(e)=>{e.currentTarget.style.background=C.lighter}} onMouseLeave={(e)=>{e.currentTarget.style.background='transparent'}}>
            <Plus size={12} /> Tambah
          </button>
        )}
      </div>

      <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 80px', gap: 8, padding: '10px 12px', background: C.lighter, borderBottom: `1px solid ${C.line}`, fontSize: 12, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--sans)' }}>
          <div>Nama Produk</div>
          <div style={{ textAlign: 'center' }}>Jumlah</div>
          <div style={{ textAlign: 'center' }}>Desain ({unit})</div>
          <div>Status</div>
        </div>

        {/* Rows */}
        {products.map((p, i) => {
          const isHemat = p.rate > 0 && p.rate <= baseline;
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 80px', gap: 8, padding: '8px 12px', alignItems: 'center', borderBottom: i < products.length - 1 ? `1px solid ${C.line}` : 'none', background: '#fff' }}>
              <Inp
                type="text"
                value={p.name}
                onChange={(e) => handleNameChange(i, e)}
                placeholder={`Produk ${i + 1}`}
                style={{ fontSize: 13 }}
              />
              <NumField
                value={p.qty}
                onChange={(v) => upd(i, 'qty', v)}
                min={0}
                max={1000000}
                integer
                style={{ fontSize: 13 }}
                aria-label={`Jumlah ${label} produk ${i + 1}`}
              />
              <NumField
                value={p.rate}
                onChange={(v) => upd(i, 'rate', v)}
                min={0}
                max={100000}
                style={{ fontSize: 13 }}
                aria-label={`Laju desain ${label} produk ${i + 1}`}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                {p.rate > 0 && (
                  <Badge variant={isHemat ? 'success' : 'danger'} size="sm">
                    {isHemat ? '✓ Hemat' : '✕ Boros'}
                  </Badge>
                )}
                {i > 0 && (
                  <IconGhost onClick={() => del(i)} aria-label={`Hapus produk ${i + 1}`}>
                    <Trash2 size={12} />
                  </IconGhost>
                )}
              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <div style={{ padding: '20px 12px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
            Belum ada produk. Klik "Tambah" untuk menambahkan.
          </div>
        )}
      </div>
    </section>
  );
}