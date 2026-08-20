export interface Relative {
  id: string;
  name: string;
  relation: 'child' | 'sibling' | 'nephew' | 'niece' | 'other';
  age: number;
  isLegitimate: boolean;
  gender?: 'Male' | 'Female' | string;
}

/**
 * SuccessionService
 * 
 * Pure domain service for calculating order of succession for a title or noble house
 * based on traditional lineage rules (eldest legitimate child, siblings, nephews/nieces, other blood relatives).
 * 
 * @rule politics.succession
 */
export class SuccessionService {
  /**
   * Evaluates and orders the potential heirs according to succession law.
   */
  public static getSuccessionOrder(relatives: Relative[]): Relative[] {
    // 1. Eldest legitimate child, followed by younger legitimate children
    const children = relatives
      .filter(r => r.relation === 'child' && r.isLegitimate)
      .sort((a, b) => b.age - a.age);

    // 2. Siblings of the ruler (legitimate)
    const siblings = relatives
      .filter(r => r.relation === 'sibling' && r.isLegitimate)
      .sort((a, b) => b.age - a.age);

    // 3. Children of siblings (nephews/nieces, legitimate)
    const nephewsAndNieces = relatives
      .filter(r => (r.relation === 'nephew' || r.relation === 'niece') && r.isLegitimate)
      .sort((a, b) => b.age - a.age);

    // 4. Closest blood relative (other legitimate relatives first, then illegitimate)
    const otherRelatives = relatives
      .filter(r => 
        (r.relation === 'other' || 
         r.relation === 'child' || 
         r.relation === 'sibling' || 
         r.relation === 'nephew' || 
         r.relation === 'niece') && 
        !(
          (r.relation === 'child' && r.isLegitimate) ||
          (r.relation === 'sibling' && r.isLegitimate) ||
          ((r.relation === 'nephew' || r.relation === 'niece') && r.isLegitimate)
        )
      )
      .sort((a, b) => {
        // Legitimate other relatives first
        if (a.isLegitimate && !b.isLegitimate) return -1;
        if (!a.isLegitimate && b.isLegitimate) return 1;
        // Then by age
        return b.age - a.age;
      });

    return [...children, ...siblings, ...nephewsAndNieces, ...otherRelatives];
  }
}
