import { NextResponse } from 'next/server';
// Recordatorios automáticos eliminados — se usa el módulo de AccionesPanel manual en el dashboard
export async function GET() {
  return NextResponse.json({ removed: true }, { status: 410 });
}
