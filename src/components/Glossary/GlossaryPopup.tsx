import { Board } from '../Board';
import { createBoardFromStones } from '../../utils/boardUtils';
import type { GlossaryEntry, BoardSize } from '../../types';
import { GLOSSARY } from '../../data/glossary';

interface GlossaryPopupProps {
  entry: GlossaryEntry;
  onClose: () => void;
  onNavigate: (entry: GlossaryEntry) => void;
}

export function GlossaryPopup({ entry, onClose, onNavigate }: GlossaryPopupProps) {
  const relatedEntries = GLOSSARY.filter(e => entry.related_terms.includes(e.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative glass-strong rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
        >
          ✕
        </button>

        <div className="mb-4">
          <h3 className="text-2xl font-bold text-text-primary">{entry.term}</h3>
          {entry.term_en && (
            <p className="text-sm text-text-secondary mt-1">
              {entry.term_en}{entry.term_jp ? ` · ${entry.term_jp}` : ''}
            </p>
          )}
        </div>

        <span className="inline-block text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium mb-4">
          Seviye {entry.level}
        </span>

        <p className="text-text-primary/90 leading-relaxed mb-6">{entry.definition}</p>

        {entry.example_stones && (
          <div className="mb-6 flex flex-col items-center">
            <div className="w-full max-w-xs glass rounded-2xl p-4">
              <Board
                size={(entry.example_size || 9) as BoardSize}
                board={createBoardFromStones(entry.example_stones, entry.example_size || 9)}
                showCoordinates={true}
              />
            </div>
            {entry.example_annotation && (
              <p className="text-sm text-text-secondary mt-3 text-center italic">{entry.example_annotation}</p>
            )}
          </div>
        )}

        {relatedEntries.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-text-secondary mb-3">İlgili Terimler</h4>
            <div className="flex flex-wrap gap-2">
              {relatedEntries.map(rel => (
                <button
                  key={rel.id}
                  onClick={() => onNavigate(rel)}
                  className="px-3 py-1.5 rounded-lg glass text-sm text-text-secondary hover:text-accent transition-colors"
                >
                  {rel.term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
