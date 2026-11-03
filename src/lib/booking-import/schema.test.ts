import { describe, expect, it } from 'vitest';
import { bookingDraftSchema, fieldsNeedingReview } from './schema';
describe('booking draft', () => {
  it('requires confidence for every extracted field', () => expect(() => bookingDraftSchema.parse({})).toThrow());
  it('sends missing or uncertain fields to human review', () => {
    const draft = bookingDraftSchema.parse({ operatorName: { value: 'Example TO', confidence: 100 }, operatorReference: { value: null, confidence: 0 }, tripDescription: { value: 'Sharm', confidence: 95 }, departureDate: { value: '2026-12-01', confidence: 99 }, returnDate: { value: '2026-12-08', confidence: 99 }, travellers: [], totalCents: { value: 180000, confidence: 80 } });
    expect(fieldsNeedingReview(draft)).toEqual(['Riferimento', 'Totale']);
  });
});
