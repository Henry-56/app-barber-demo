export function generateWhatsAppLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '');
  const normalized = clean.startsWith('51') ? clean : `51${clean}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// ─── Click-to-Send system ─────────────────────────────────

export type WaTemplateType = 'confirmacion' | 'recordatorio' | 'recuperacion' | 'fidelizacion' | 'bienvenida';

export type ShopWaData = {
  name: string;
  slug: string;
  whatsappTemplateConfirmacion?: string | null;
  whatsappTemplateRecordatorio?: string | null;
  whatsappTemplateRecuperacion?: string | null;
  whatsappTemplateFidelizacion?: string | null;
  whatsappTemplateBienvenida?: string | null;
};

export const waDefaults: Record<WaTemplateType, string> = {
  confirmacion: `✅ *Reserva confirmada*\n\nHola {{clientName}}, tu cita está confirmada:\n📅 {{date}} a las {{time}}\n✂️ {{service}}\n💈 {{barberName}}\n\nTe esperamos en {{shopName}}.`,
  recordatorio: `⏰ *Recordatorio de cita*\n\nHola {{clientName}}, mañana tienes cita:\n📅 {{date}} a las {{time}}\n✂️ {{service}}\n\n¿Alguna duda? Escríbenos.`,
  recuperacion: `Hola {{clientName}} 👋\n\nHace tiempo no te vemos en {{shopName}}. ¡Te extrañamos!\n\nAgenda tu cita: {{bookingUrl}}`,
  fidelizacion: `🎉 *¡Felicidades {{clientName}}!*\n\nCompletaste 5 cortes en {{shopName}}.\n¡Tu próximo corte es GRATIS! 🎁\n\nAgenda cuando quieras: {{bookingUrl}}`,
  bienvenida: `Hola {{clientName}} 👋 Bienvenido a {{shopName}}.\n\nTu tarjeta de fidelización ya está activa — cada 5 cortes el 6to es gratis ✂️\n\nPara tu próxima cita agéndala aquí:\n👉 {{bookingUrl}}`,
};

export function buildWaMessage(
  shop: ShopWaData,
  type: WaTemplateType,
  clientPhone: string,
  vars: Record<string, string>
): { url: string; message: string } {
  const templateMap: Record<WaTemplateType, string | null | undefined> = {
    confirmacion: shop.whatsappTemplateConfirmacion,
    recordatorio: shop.whatsappTemplateRecordatorio,
    recuperacion: shop.whatsappTemplateRecuperacion,
    fidelizacion: shop.whatsappTemplateFidelizacion,
    bienvenida: shop.whatsappTemplateBienvenida,
  };
  const template = templateMap[type] || waDefaults[type];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const allVars = { shopName: shop.name, bookingUrl: `${baseUrl}/${shop.slug}/reservar`, ...vars };
  const message = fillTemplate(template, allVars);
  return { url: generateWhatsAppLink(clientPhone, message), message };
}

export const defaultTemplates = {
  confirmacion: `✅ *Reserva confirmada*

Hola {{clientName}}, tu cita está confirmada:
📅 {{date}}
⏰ {{time}}
✂️ {{service}}
💈 {{barberName}}

Te esperamos en {{shopName}}.`,

  recordatorio: `⏰ *Recordatorio de cita*

Hola {{clientName}}, mañana tienes cita:
📅 {{date}} a las {{time}}
✂️ {{service}}

¿Alguna duda? Escríbenos.`,

  recuperacion: `Hola {{clientName}} 👋

Hace tiempo no te vemos en {{shopName}}. ¡Te extrañamos!

Agenda tu cita: {{bookingUrl}}`,

  fidelizacion: `🎉 *¡Felicidades {{clientName}}!*

Completaste 5 cortes en {{shopName}}.
¡Tu próximo corte es GRATIS! 🎁

Agenda cuando quieras: {{bookingUrl}}`,

  bienvenida: `Hola {{clientName}} 👋 Bienvenido a {{shopName}}.

Tu tarjeta de fidelización ya está activa — cada 5 cortes el 6to es gratis ✂️

Para tu próxima cita puedes agendarla directo aquí (sin llamar ni escribir):
👉 {{bookingUrl}}

¡Te esperamos!`,
};
