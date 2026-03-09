import type { CalendarMapping, Offering } from './types.js';

/** Create an offering definition. */
export function defineOffering(config: {
  id: string;
  label: string;
  mappings: CalendarMapping[];
}): Offering {
  if (config.mappings.length === 0) {
    throw new Error('Offering must have at least one calendar mapping');
  }
  return {
    id: config.id,
    label: config.label,
    mappings: config.mappings,
  };
}
