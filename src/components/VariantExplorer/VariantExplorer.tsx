import { useState, useCallback, useMemo } from 'react';
import { VariantCatalog } from './VariantCatalog';
import { VariantDetail } from './VariantDetail';
import { getAllVariations } from '../../data/variations';

export function VariantExplorer() {
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);

  const selectedPosition = useMemo(
    () => selectedPositionId ? getAllVariations().find(p => p.id === selectedPositionId) ?? null : null,
    [selectedPositionId]
  );

  const handleSelectPosition = useCallback((positionId: string) => {
    setSelectedPositionId(positionId);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedPositionId(null);
  }, []);

  if (selectedPosition) {
    return <VariantDetail position={selectedPosition} onBack={handleBack} />;
  }

  return <VariantCatalog onSelectPosition={handleSelectPosition} />;
}
