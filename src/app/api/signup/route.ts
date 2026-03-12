import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

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
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
