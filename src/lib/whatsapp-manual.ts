export function generateWhatsAppLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '');
  const normalized = clean.startsWith('51') ? clean : `51${clean}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
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

  bienvenida: `👋 ¡Bienvenido a {{shopName}}!

Gracias por tu primera visita. Puedes ver tu historial y agendar tu próxima cita aquí:
{{bookingUrl}}`,
};
