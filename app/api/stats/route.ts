import { NextResponse } from 'next/server';
import { sql, ensureDB } from '@/src/lib/db';
import { CUTS_REQUIRED_FOR_FREE, PRICE_PER_CUT, SUBSCRIPTION_PRICE } from '@/src/constants';

export async function GET() {
  try {
    await ensureDB();

    const [retention] = await sql`
      SELECT
        COUNT(*)                                                                      AS total,
        COUNT(*) FILTER (WHERE
          EXTRACT(EPOCH FROM (NOW() - last_visit)) / 86400.0
          / COALESCE(avg_frequency_days, 15) < 1.0
        )                                                                             AS active,
        COUNT(*) FILTER (WHERE
          EXTRACT(EPOCH FROM (NOW() - last_visit)) / 86400.0
          / COALESCE(avg_frequency_days, 15) BETWEEN 1.0 AND 1.49
        )                                                                             AS at_risk,
        COUNT(*) FILTER (WHERE
          EXTRACT(EPOCH FROM (NOW() - last_visit)) / 86400.0
          / COALESCE(avg_frequency_days, 15) >= 1.5
        )                                                                             AS inactive,
        COUNT(*) FILTER (WHERE free_cuts_available > 0)                              AS free_available,
        COUNT(*) FILTER (WHERE
          cuts_toward_free >= ${CUTS_REQUIRED_FOR_FREE - 1}
          AND free_cuts_available = 0
        )                                                                             AS close_to_free
      FROM clients
    `;

    const [thisMonth] = await sql`
      SELECT
        COUNT(*)                                                 AS contacted,
        COUNT(*) FILTER (WHERE outcome = 'came_back')           AS recovered,
        COUNT(*) FILTER (WHERE outcome = 'responded')           AS responded,
        COUNT(*) FILTER (WHERE outcome = 'no_response')         AS no_response
      FROM outreach_log
      WHERE sent_at >= DATE_TRUNC('month', NOW())
    `;

    const [allTime] = await sql`
      SELECT
        COUNT(*)                                          AS contacted,
        COUNT(*) FILTER (WHERE outcome = 'came_back')   AS recovered
      FROM outreach_log
    `;

    const monthRecovered  = parseInt(thisMonth.recovered)  || 0;
    const monthContacted  = parseInt(thisMonth.contacted)  || 0;
    const revenue         = monthRecovered * PRICE_PER_CUT;
    const roi             = revenue / SUBSCRIPTION_PRICE;

    return NextResponse.json({
      thisMonth: {
        recovered:    monthRecovered,
        contacted:    monthContacted,
        responded:    parseInt(thisMonth.responded)   || 0,
        noResponse:   parseInt(thisMonth.no_response) || 0,
        recoveryRate: monthContacted > 0 ? Math.round((monthRecovered / monthContacted) * 100) : 0,
        revenue,
        roi: Math.round(roi * 10) / 10,
      },
      allTime: {
        recovered: parseInt(allTime.recovered) || 0,
        contacted: parseInt(allTime.contacted) || 0,
        revenue:   (parseInt(allTime.recovered) || 0) * PRICE_PER_CUT,
      },
      retention: {
        total:    parseInt(retention.total)    || 0,
        active:   parseInt(retention.active)   || 0,
        atRisk:   parseInt(retention.at_risk)  || 0,
        inactive: parseInt(retention.inactive) || 0,
        rate:     parseInt(retention.total) > 0
          ? Math.round((parseInt(retention.active) / parseInt(retention.total)) * 100)
          : 0,
      },
      loyalty: {
        freeAvailable: parseInt(retention.free_available) || 0,
        closeToFree:   parseInt(retention.close_to_free)  || 0,
      },
      pricePerCut:       PRICE_PER_CUT,
      subscriptionPrice: SUBSCRIPTION_PRICE,
    });
  } catch (err) {
    console.error('[GET /api/stats]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
