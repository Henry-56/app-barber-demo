import React from 'react';
import { auth } from '@/src/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/src/lib/drizzle';
import { barbershops } from '@/src/lib/schema';
import { eq } from 'drizzle-orm';
import DashboardShell from '@/src/components/dashboard/DashboardShell';
import SessionProviderWrapper from '@/src/components/dashboard/SessionProviderWrapper';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.barbershopId) redirect('/login');

  const [shop] = await db
    .select({
      id: barbershops.id,
      name: barbershops.name,
      trialEndsAt: barbershops.trialEndsAt,
      subscriptionStatus: barbershops.subscriptionStatus,
    })
    .from(barbershops)
    .where(eq(barbershops.id, session.user.barbershopId))
    .limit(1);

  const trialDaysLeft = shop?.trialEndsAt
    ? Math.ceil((new Date(shop.trialEndsAt).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <SessionProviderWrapper>
      <DashboardShell shopName={shop?.name ?? 'Mi Barbería'} trialDaysLeft={trialDaysLeft}>
        {children}
      </DashboardShell>
    </SessionProviderWrapper>
  );
}
