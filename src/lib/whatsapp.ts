import { db } from './drizzle';
import { barbershops, whatsappMessages } from './schema';
import { eq } from 'drizzle-orm';

export const templates = {
  welcome: (name: string, shop: string) =>
    `Hola ${name} 👋 Bienvenido a ${shop}. Tu tarjeta de fidelización ya está activa — cada 5 cortes, el 6to es gratis. ✂️`,

  reminder24h: (name: string, date: string, time: string, barber: string) =>
    `Hola ${name}, mañana ${date} a las ${time} tienes tu cita con ${barber}. ✂️ Si no puedes venir, avísanos con tiempo.`,

  reminder2h: (name: string, time: string) =>
    `Hola ${name} ⏰ En 2 horas tienes tu cita (${time}). ¡Te esperamos!`,

  recovery: (name: string, shop: string, days: number) =>
    `Hola ${name} 👋 Hace ${days} días que no te vemos por ${shop}. Tu tarjeta de fidelización sigue activa con tus sellos guardados. ¿Cuándo vienes? ✂️`,

  loyaltyComplete: (name: string, shop: string) =>
    `¡Felicitaciones ${name}! 🎉 Completaste tus 5 cortes en ${shop}. Tu próximo corte es GRATIS. ¡Avísanos cuando quieras venir! ✂️`,

  trialReminder: (shop: string, daysLeft: number, clientCount: number, messageCount: number) =>
    `Hola equipo de ${shop} 👋 Tu prueba de BarberFlow vence en ${daysLeft} días. Llevas ${clientCount} clientes registrados y ${messageCount} mensajes automáticos enviados. Activa tu plan para no perder el acceso. Escríbenos aquí para activar.`,
};

export async function sendWhatsAppMessage({
  barbershopId,
  clientId,
  to,
  message,
  type,
}: {
  barbershopId: string;
  clientId?: string;
  to: string;
  message: string;
  type: typeof whatsappMessages.$inferInsert['type'];
}) {
  const [shop] = await db
    .select({ phoneId: barbershops.metaPhoneNumberId, token: barbershops.metaWhatsappToken })
    .from(barbershops)
    .where(eq(barbershops.id, barbershopId))
    .limit(1);

  const logEntry = {
    barbershopId,
    clientId: clientId ?? null,
    type,
    message,
    status: 'failed' as const,
  };

  if (!shop?.phoneId || !shop?.token) {
    await db.insert(whatsappMessages).values(logEntry);
    return false;
  }

  const phone = to.startsWith('+') ? to : `+51${to}`;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${shop.phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${shop.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    await db.insert(whatsappMessages).values({
      ...logEntry,
      status: res.ok ? 'sent' : 'failed',
    });

    return res.ok;
  } catch {
    await db.insert(whatsappMessages).values(logEntry);
    return false;
  }
}
