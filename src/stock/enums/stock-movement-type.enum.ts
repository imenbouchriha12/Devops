export enum StockMovementType {
  ENTREE_ACHAT = 'ENTREE_ACHAT',
  SORTIE_VENTE = 'SORTIE_VENTE',
  AJUSTEMENT_POSITIF = 'AJUSTEMENT_POSITIF',
  AJUSTEMENT_NEGATIF = 'AJUSTEMENT_NEGATIF',
}

export function isIncrementType(type: StockMovementType): boolean {
  return [
    StockMovementType.ENTREE_ACHAT,
    StockMovementType.AJUSTEMENT_POSITIF,
  ].includes(type);
}

export function isDecrementType(type: StockMovementType): boolean {
  return [
    StockMovementType.SORTIE_VENTE,
    StockMovementType.AJUSTEMENT_NEGATIF,
  ].includes(type);
}
