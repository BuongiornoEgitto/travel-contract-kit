import { z } from 'zod';

const extracted = <T extends z.ZodType>(value: T) => z.object({ value: value.nullable(), confidence: z.number().min(0).max(100) });
export const bookingDraftSchema = z.object({
  operatorName: extracted(z.string()), operatorReference: extracted(z.string()), tripDescription: extracted(z.string()),
  departureDate: extracted(z.iso.date()), returnDate: extracted(z.iso.date()),
  travellers: z.array(z.object({ fullName: extracted(z.string()), birthDate: extracted(z.iso.date()) })), totalCents: extracted(z.number().int().nonnegative()),
});
export type BookingDraft = z.infer<typeof bookingDraftSchema>;
export function fieldsNeedingReview(draft: BookingDraft): string[] {
  const fields: Array<[string, { value: unknown; confidence: number }]> = [['Tour Operator', draft.operatorName], ['Riferimento', draft.operatorReference], ['Viaggio', draft.tripDescription], ['Partenza', draft.departureDate], ['Rientro', draft.returnDate], ['Totale', draft.totalCents]];
  return fields.filter(([, field]) => field.value === null || field.confidence < 90).map(([name]) => name);
}
