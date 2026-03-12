import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Save to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from('merchant_leads').insert({
      contact_name: body.contact_name,
      phone_number: body.phone_number,
      shop_name: body.shop_name || null,
      currency: body.currency,
      monthly_airtime: body.monthly_airtime,
      monthly_vouchers: body.monthly_vouchers,
      monthly_remittance: body.monthly_remittance,
      monthly_qr_sales: body.monthly_qr_sales,
      referrals: body.referrals,
      monthly_earnings: body.monthly_earnings,
      annual_earnings: body.annual_earnings,
    });

    if (error) {
      console.error('Supabase insert error:', error);
    }

    // 2. Append to Google Sheet via Apps Script web app
    const sheetUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
    if (sheetUrl) {
      try {
        await fetch(sheetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contact_name: body.contact_name || '',
            phone_number: body.phone_number || '',
            shop_name: body.shop_name || '',
          }),
        });
      } catch (sheetErr) {
        console.error('Google Sheets append error:', sheetErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
