import { useState } from 'react';
import { GLOSSARY, searchGlossary, getGlossaryByCategory } from '../../data/glossary';
import type { GlossaryEntry } from '../../types';
import { GlossaryPopup } from './GlossaryPopup';

const CATEGORIES: { id: GlossaryEntry['category']; label: string }[] = [
  { id: 'temel', label: 'Temel' },
  { id: 'teknik', label: 'Teknik' },
  { id: 'strateji', label: 'Strateji' },
  { id: 'oyun_sonu', label: 'Oyun Sonu' },
  { id: 'terim', label: 'Genel Terimler' },
];

export function GlossaryPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryEntry['category'] | 'all'>('all');
  const [selectedEntry, setSelectedEntry] = useState<GlossaryEntry | null>(null);

  const filteredEntries = (() => {
    let entries = query ? searchGlossary(query) : GLOSSARY;
    if (category !== 'all') {
      entries = entries.filter(e => e.category === category);
    }
    return entries.sort((a, b) => a.term.localeCompare(b.term, 'tr'));
  })();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Kavram Sözlüğü</h2>
        <p className="text-text-secondary">Go terimlerinin interaktif sözlüğü</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Terim ara..."
            className="w-full pl-10 pr-4 py-3 rounded-xl glass border-glass-border bg-transparent text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === 'all' ? 'bg-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}
        >
          Tümü ({GLOSSARY.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = getGlossaryByCategory(cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === cat.id ? 'bg-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntries.map(entry => (
          <button
            key={entry.id}
            onClick={() => setSelectedEntry(entry)}
            className="glass rounded-2xl p-5 text-left card-hover border border-glass-border"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-text-primary">{entry.term}</h3>
              <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                Seviye {entry.level}
              </span>
            </div>
            {entry.term_en && (
              <p className="text-xs text-text-secondary mb-2">{entry.term_en}{entry.term_jp ? ` · ${entry.term_jp}` : ''}</p>
            )}
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{entry.definition}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-primary/50 text-text-secondary">
                {CATEGORIES.find(c => c.id === entry.category)?.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-secondary">Sonuç bulunamadı.</p>
        </div>
      )}

      {selectedEntry && (
        <GlossaryPopup
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onNavigate={(entry) => setSelectedEntry(entry)}
        />
      )}
    </div>
  );
}
