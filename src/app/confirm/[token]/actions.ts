'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { acceptConfirmation } from '@/lib/case';

export async function accept(token: string, confirmation: FormDataEntryValue | null) {
  if (confirmation !== 'yes') throw new Error('Per confermare, seleziona la casella di presa visione.');
  const requestHeaders = await headers();
  const origin = requestHeaders.get('origin');
  const expected = process.env.APP_URL ? new URL(process.env.APP_URL).origin : `${requestHeaders.get('x-forwarded-proto') ?? 'http'}://${requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host')}`;
  if (!origin || new URL(origin).origin !== expected) throw new Error('Richiesta non valida.');
  const ip = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const accepted = await acceptConfirmation(token, ip, requestHeaders.get('user-agent'));
  revalidatePath(`/confirm/${token}`);
  redirect(accepted ? `/confirm/${token}` : `/confirm/${token}?status=error`);
}
