import { CloudRain, Printer } from 'lucide-react';
import { Button, DetailCard, Inp, Label, Sel } from './atoms';
import { C } from './tokens';

export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
}

export interface ProjectToolbarProps {
  list: ProjectSummary[];
  activeId: string;
  activeName: string;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onImport: () => void;
  onExport: () => void;
  onPrint: () => void;
  onReset: () => void;
}

const formatDate = (t: number) =>
  new Date(t).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

export function ProjectToolbar({
  list,
  activeId,
  activeName,
  onSwitch,
  onCreate,
  onDuplicate,
  onDelete,
  onRename,
  onImport,
  onExport,
  onPrint,
  onReset,
}: ProjectToolbarProps) {
  return (
    <DetailCard
      title="Proyek & Laporan"
      subtitle="Draf tersimpan otomatis di browser ini. Ekspor JSON untuk cadangan atau pindah perangkat."
      icon={<CloudRain size={20} />}
      className="no-print"
      style={{ marginBottom: 16 }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: '1 1 240px', minWidth: 220 }}>
          <Label htmlFor="project-select">Proyek tersimpan</Label>
          <Sel
            id="project-select"
            value={activeId}
            onChange={e => onSwitch(e.target.value)}
            options={list.map(p => ({ value: p.id, label: `${p.name} · ${formatDate(p.updatedAt)}` }))}
          />
        </div>
        <div style={{ flex: '1 1 220px', minWidth: 200 }}>
          <Label htmlFor="project-name">Nama proyek</Label>
          <Inp
            id="project-name"
            value={activeName}
            maxLength={80}
            onChange={e => onRename(e.target.value)}
            placeholder="Contoh: Menara Kuningan — revisi 2"
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
        <Button type="button" size="sm" variant="ghost" onClick={onCreate}>Proyek Baru</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDuplicate}>Duplikat</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onDelete} disabled={list.length <= 1}>
          Hapus Proyek
        </Button>
        <Button type="button" size="sm" variant="primary" onClick={onExport}>Ekspor JSON</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onImport}>Impor JSON</Button>
        <Button type="button" size="sm" variant="dark" onClick={onPrint}>
          <Printer size={14} /> Cetak / PDF
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onReset}>Kosongkan Isian</Button>
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
        Setiap proyek menyimpan isian dan hasilnya sendiri, jadi beberapa bangunan bisa dikerjakan bergantian.
        Cetak membuka dialog print browser — pilih “Simpan sebagai PDF” untuk laporan.
      </div>
    </DetailCard>
  );
}
