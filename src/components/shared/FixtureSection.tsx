import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { FixtureProduct, FixtureTypeId } from '../../types';
import { FIXTURE_BASELINES } from '../../constants/baselines';
import { mkProd } from '../../utils/defaults';
import { Inp, C } from './atoms';

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

  return (
    <div style={{ marginBottom: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.s700 }}>{label}</span>
          <span style={{
            fontSize: 11, color: C.s500, background: C.s100,
            padding: '2px 8px', borderRadius: 20,
          }}>
            Baseline ≤ {baseline} {unit}
          </span>
        </div>
        {products.length < 4 && (
          <button
            onClick={add}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, color: C.teal, background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <Plus size={11} /> Tambah
          </button>
        )}
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 110px 90px', gap: 5, marginBottom: 4 }}>
        {['Nama Produk', 'Jumlah', `Desain (${unit})`, 'Status'].map(h => (
          <div key={h} style={{ fontSize: 10, color: C.s300 }}>{h}</div>
        ))}
      </div>

      {/* Product rows */}
      {products.map((p, i) => {
        const isHemat = p.rate > 0 && p.rate <= baseline;
        return (
          <div
            key={i}
            style={{ display: 'grid', gridTemplateColumns: '1fr 72px 110px 90px', gap: 5, marginBottom: 5, alignItems: 'center' }}
          >
            <Inp type="text" value={p.name} onChange={v => upd(i, 'name', v)} placeholder={`Produk ${i + 1}`} />
            <Inp value={p.qty || ''} onChange={v => upd(i, 'qty', v)} step={1} />
            <Inp value={p.rate || ''} onChange={v => upd(i, 'rate', v)} step={0.1} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {p.rate > 0 && (
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 700,
                  background: isHemat ? '#DCFCE7' : '#FEF2F2',
                  color: isHemat ? '#15803D' : '#DC2626',
                }}>
                  {isHemat ? '✓ Hemat' : '✗ Boros'}
                </span>
              )}
              {i > 0 && (
                <button
                  onClick={() => del(i)}
                  style={{ color: C.s300, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
