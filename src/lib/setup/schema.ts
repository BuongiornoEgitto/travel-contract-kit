import { z } from 'zod';
import { MIN_PASSWORD_LENGTH, PLACEHOLDER_PASSWORD } from '../config';

export const setupRequestSchema = z.object({
  token: z.string().min(1, 'Token di configurazione mancante.'),
  databaseUrl: z
    .string()
    .trim()
    .min(1, 'Incolla la connection string del tuo database.')
    .refine((value) => /^postgres(ql)?:\/\//.test(value), 'La connection string deve iniziare con postgresql://')
    .refine((value) => !value.includes('USER:PASSWORD@HOST'), 'Questa e ancora la connection string di esempio: incolla quella del tuo database.')
    .refine((value) => {
      try {
        return Boolean(new URL(value).hostname);
      } catch {
        return false;
      }
    }, 'La connection string non e un indirizzo valido.'),
  anthropicApiKey: z.string().trim().min(1, 'Incolla la tua chiave API Anthropic.'),
  operatorPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri.`)
    .refine((value) => value !== PLACEHOLDER_PASSWORD, 'Scegli una password diversa da quella di esempio.'),
  agencyName: z.string().trim().min(1, 'Indica il nome della tua agenzia.'),
  contractTemplateText: z.string().trim().min(1, 'Il testo del contratto non puo essere vuoto.'),
  appUrl: z.string().trim().url('Indirizzo dell’app non valido.'),
});

export type SetupRequest = z.infer<typeof setupRequestSchema>;
