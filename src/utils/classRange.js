export const DEFAULT_LOWER_CLASS = 1;
export const DEFAULT_UPPER_CLASS = 12;
export const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

export function classRangesOverlap(entityLower, entityUpper, schoolLower, schoolUpper) {
  if (schoolLower == null || schoolUpper == null) return true;

  const el = Number(entityLower ?? DEFAULT_LOWER_CLASS);
  const eu = Number(entityUpper ?? DEFAULT_UPPER_CLASS);
  const sl = Number(schoolLower);
  const su = Number(schoolUpper);

  if (Number.isNaN(el) || Number.isNaN(eu) || Number.isNaN(sl) || Number.isNaN(su)) {
    return true;
  }

  return el <= su && eu >= sl;
}

export function formatClassRange(lowerClass, upperClass) {
  const lower = Number(lowerClass ?? DEFAULT_LOWER_CLASS);
  const upper = Number(upperClass ?? DEFAULT_UPPER_CLASS);
  return `${lower}–${upper}`;
}
