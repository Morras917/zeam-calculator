'use client';

import { useState, useCallback, useMemo } from 'react';

// ── Zeam brand palette ──
const Z = {
  teal: '#00B4D8',
  green: '#06D6A0',
  dark: '#1A2332',
  darkAlt: '#0F2040',
  gold: '#FFD166',
  orange: '#F4A261',
  pink: '#EF476F',
  cyan: '#7ECFEA',
};

const RATES = {
  commission: 0.015,
  referralBonus: 40,
  bonusTiers: [
    { min: 0, max: 50000, bonus: 0 },
    { min: 50001, max: 150000, bonus: 500 },
    { min: 150001, max: 300000, bonus: 1500 },
    { min: 300001, max: 500000, bonus: 3500 },
    { min: 500001, max: Infinity, bonus: 7500 },
  ],
};

type Currency = { sym: string; code: string };
const CURRENCIES: Currency[] = [
  { sym: 'R', code: 'ZAR' },
  { sym: 'KSh', code: 'KES' },
  { sym: 'TSh', code: 'TZS' },
];

function fmt(n: number, sym: string) {
  return sym + Math.round(n).toLocaleString();
}

function pct(v: number, min: number, max: number) {
  return ((v - min) / (max - min)) * 100;
}

function barWidth(val: number, max: number) {
  return Math.min((val / (max || 1)) * 100, 100);
}

// ── Slider ──
function Slider({
  label, sublabel, value, min, max, step, display, color, onChange,
}: {
  label: string; sublabel: string; value: number; min: number; max: number;
  step: number; display: string; color: string; onChange: (v: number) => void;
}) {
  const p = pct(value, min, max);
  return (
    <div className="slider-wrap">
      <div className="slider-top">
        <div>
          <div className="slider-label">{label}</div>
          <div className="slider-sublabel">{sublabel}</div>
        </div>
        <div className="slider-value" style={{ color }}>{display}</div>
      </div>
      <div className="slider-track">
        <div className="slider-fill" style={{ background: `linear-gradient(90deg, ${color}99, ${color})`, width: `${p}%` }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <div className="slider-thumb" style={{ borderColor: color, boxShadow: `0 2px 12px ${color}55`, left: `${p}%` }} />
      </div>
    </div>
  );
}

// ── Revenue stream config ──
const STREAMS = [
  { key: 'airtime',    icon: '📱', title: 'Prepaid Airtime Sales',  sub: 'Earn 1.5% commission on every airtime top-up you sell',   color: Z.teal,   sliderLabel: 'Monthly airtime sold',      sliderSub: 'Total airtime top-up sales per month',         min: 0, max: 80000,  step: 500 },
  { key: 'vouchers',   icon: '🎟️', title: 'ONE Voucher Sales',      sub: 'Earn 1.5% commission on every ONE voucher sold',          color: Z.green,  sliderLabel: 'Monthly voucher sales',     sliderSub: 'Total ONE voucher sales per month',            min: 0, max: 80000,  step: 500 },
  { key: 'remittance', icon: '💸', title: 'Remittance Services',    sub: 'Earn 1.5% on every remittance you process for customers', color: Z.orange, sliderLabel: 'Monthly remittance volume', sliderSub: 'Total money sent on behalf of customers',      min: 0, max: 200000, step: 1000 },
  { key: 'qr',         icon: '📲', title: 'QR Product Sales',       sub: 'Earn 1.5% on products sold from your shop via QR',        color: Z.gold,   sliderLabel: 'Monthly QR sales',          sliderSub: 'Products sold via Zeam QR payment',            min: 0, max: 200000, step: 1000 },
] as const;

type StreamKey = typeof STREAMS[number]['key'];

// ── Main ──
export default function Calculator() {
  const [page, setPage] = useState<'inputs' | 'results'>('inputs');
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [shopName, setShopName] = useState('');
  const [volumes, setVolumes] = useState<Record<StreamKey, number>>({
    airtime: 5000,
    vouchers: 3000,
    remittance: 10000,
    qr: 15000,
  });
  const [ref, setRef] = useState(10);
  const [signupStatus, setSignupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const sym = currency.sym;

  const setVolume = (key: StreamKey, v: number) =>
    setVolumes((prev) => ({ ...prev, [key]: v }));

  const calc = useMemo(() => {
    const commissions = STREAMS.map((s) => ({
      key: s.key,
      amount: Math.round(volumes[s.key] * RATES.commission),
    }));
    const totalCommission = commissions.reduce((a, c) => a + c.amount, 0);
    const totalVolume = Object.values(volumes).reduce((a, v) => a + v, 0);
    const refEarn = Math.round(ref * RATES.referralBonus);
    const tier = [...RATES.bonusTiers].reverse().find((t) => totalVolume >= t.min) || RATES.bonusTiers[0];
    const bonus = tier.bonus;
    const total = totalCommission + refEarn + bonus;
    const annual = total * 12;
    return { commissions, totalCommission, totalVolume, refEarn, bonus, tier, total, annual };
  }, [volumes, ref]);

  const showResults = useCallback(() => { setPage('results'); window.scrollTo(0, 0); }, []);
  const showInputs = useCallback(() => { setPage('inputs'); window.scrollTo(0, 0); }, []);

  const handleSignup = async () => {
    setSignupStatus('loading');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: shopName,
          currency: currency.code,
          monthly_airtime: volumes.airtime,
          monthly_vouchers: volumes.vouchers,
          monthly_remittance: volumes.remittance,
          monthly_qr_sales: volumes.qr,
          referrals: ref,
          monthly_earnings: calc.total,
          annual_earnings: calc.annual,
        }),
      });
      setSignupStatus(res.ok ? 'success' : 'error');
    } catch {
      setSignupStatus('error');
    }
  };

  const barMax = Math.max(...calc.commissions.map((c) => c.amount), 100) * 1.4;

  return (
    <>
      {/* HEADER */}
      <div className="header">
        <div className="logo-wrap">
          <div className="logo-icon">Z</div>
          <div>
            <div className="logo-name">Zeam.money</div>
            <div className="logo-sub">MERCHANT EARNINGS CALCULATOR</div>
          </div>
        </div>
        <div className="currency-btns">
          {CURRENCIES.map((c) => (
            <button key={c.code} className={`cur-btn ${currency.code === c.code ? 'active' : ''}`} onClick={() => setCurrency(c)}>
              {c.sym}
            </button>
          ))}
        </div>
      </div>

      <div className="container">
        {/* ====== INPUTS ====== */}
        {page === 'inputs' && (
          <div className="page active">
            <div className="intro">
              <h1>How much can your shop <span>earn</span> with Zeam?</h1>
              <p>Move the sliders to match your shop. See your monthly earnings update live.</p>
            </div>

            {/* Shop name */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon" style={{ background: `${Z.teal}18` }}>🏪</div>
                <div>
                  <div className="card-title">Your Shop</div>
                  <div className="card-sub">Optional — personalise your report</div>
                </div>
              </div>
              <input className="shop-input" type="text" placeholder="e.g. Mama Grace's Spaza" value={shopName} onChange={(e) => setShopName(e.target.value)} />
            </div>

            {/* Revenue streams */}
            {STREAMS.map((s) => (
              <div className="card" key={s.key}>
                <div className="card-header">
                  <div className="card-icon" style={{ background: `${s.color}18` }}>{s.icon}</div>
                  <div>
                    <div className="card-title">{s.title}</div>
                    <div className="card-sub">{s.sub}</div>
                  </div>
                </div>
                <Slider
                  label={s.sliderLabel}
                  sublabel={s.sliderSub}
                  value={volumes[s.key]}
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  display={`${sym}${(volumes[s.key] / 1000).toFixed(1)}K`}
                  color={s.color}
                  onChange={(v) => setVolume(s.key, v)}
                />
                <div className="preview-box" style={{ background: `${s.color}10` }}>
                  <div className="preview-label">Commission earned (1.5%)</div>
                  <div className="preview-value" style={{ color: s.color }}>
                    {fmt(volumes[s.key] * RATES.commission, sym)}
                  </div>
                </div>
              </div>
            ))}

            {/* Referrals */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon" style={{ background: `${Z.green}18` }}>🤝</div>
                <div>
                  <div className="card-title">Sign Up New Zeam Users</div>
                  <div className="card-sub">Earn {sym}40 for every new customer you sign on to Zeam</div>
                </div>
              </div>
              <Slider label="New Zeam sign-ons per month" sublabel="Customers you introduce to Zeam" value={ref} min={0} max={100} step={1} display={`${ref} people`} color={Z.green} onChange={setRef} />
              <div className="preview-box" style={{ background: `${Z.green}10` }}>
                <div className="preview-label">Referral earnings this month</div>
                <div className="preview-value" style={{ color: Z.green }}>{fmt(calc.refEarn, sym)}</div>
              </div>
            </div>

            {/* Live strip */}
            <div className="live-strip">
              <div>
                <div className="live-label">Your monthly earnings</div>
                <div className="live-amount">{fmt(calc.total, sym)}</div>
              </div>
              <button className="btn-primary" onClick={showResults}>See full<br />breakdown →</button>
            </div>
          </div>
        )}

        {/* ====== RESULTS ====== */}
        {page === 'results' && (
          <div className="page active animate-in">
            <div className="results-intro">
              <div className="sub">{shopName ? `Earnings report for ${shopName}` : 'Your Zeam earnings breakdown'}</div>
              <h2>Here is exactly how you <span>earn</span> with Zeam</h2>
            </div>

            <div className="total-card">
              <div className="total-label">Total Monthly Earnings</div>
              <div className="total-amount">{fmt(calc.total, sym)}</div>
              <div className="total-sub">per month, into your pocket</div>
            </div>

            <div className="annual-card">
              <div>
                <div className="annual-label">Annual Earnings</div>
                <div className="annual-amount">{fmt(calc.annual, sym)}</div>
                <div className="annual-sub">every year with Zeam</div>
              </div>
              <div className="annual-icon">💰</div>
            </div>

            {/* Breakdown */}
            <div className="breakdown-card">
              <div className="section-title">Where your money comes from</div>
              {STREAMS.map((s) => {
                const comm = calc.commissions.find((c) => c.key === s.key)!;
                return (
                  <div className="bar-row" key={s.key}>
                    <div className="bar-top">
                      <div className="bar-label">{s.icon} {s.title} (1.5%)</div>
                      <div className="bar-amount" style={{ color: s.color }}>{fmt(comm.amount, sym)}</div>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ background: `linear-gradient(90deg, ${s.color}88, ${s.color})`, width: `${barWidth(comm.amount, barMax)}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="bar-row">
                <div className="bar-top">
                  <div className="bar-label">🤝 Sign-on bonuses ({ref} × {sym}40)</div>
                  <div className="bar-amount" style={{ color: Z.green }}>{fmt(calc.refEarn, sym)}</div>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ background: `linear-gradient(90deg, ${Z.green}88, ${Z.green})`, width: `${barWidth(calc.refEarn, barMax)}%` }} />
                </div>
              </div>
              {calc.bonus > 0 && (
                <div className="bar-row">
                  <div className="bar-top">
                    <div className="bar-label">🏆 Monthly volume bonus</div>
                    <div className="bar-amount" style={{ color: Z.pink }}>{fmt(calc.bonus, sym)}</div>
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ background: `linear-gradient(90deg, ${Z.pink}88, ${Z.pink})`, width: `${barWidth(calc.bonus, barMax)}%` }} />
                  </div>
                </div>
              )}
              <div className="total-row">
                <div className="total-row-label">Total Monthly</div>
                <div className="total-row-value">{fmt(calc.total, sym)}</div>
              </div>
            </div>

            {/* Volume bonus tiers */}
            <div className="tier-card">
              <div className="section-title">🏆 Volume Bonus Tiers</div>
              <div className="section-subtitle">Higher combined volume = bigger monthly bonuses</div>
              {RATES.bonusTiers.filter((t) => t.bonus > 0).map((t, i) => {
                const reached = calc.totalVolume >= t.min;
                const p = t.max === Infinity ? 100 : Math.min(((calc.totalVolume - t.min) / (t.max - t.min)) * 100, 100);
                const label = t.max === Infinity
                  ? `${sym}${(t.min / 1000).toFixed(0)}K+/month`
                  : `${sym}${(t.min / 1000).toFixed(0)}K – ${sym}${(t.max / 1000).toFixed(0)}K/month`;
                return (
                  <div key={i} className={`tier-item ${reached ? 'reached' : ''}`}>
                    <div className="tier-top">
                      <div className={`tier-name ${reached ? 'reached' : ''}`}>{reached ? '✅' : '🔒'} {label}</div>
                      <div className={`tier-bonus ${reached ? 'reached' : ''}`}>+{sym}{t.bonus.toLocaleString()} bonus</div>
                    </div>
                    <div className="tier-bar-track">
                      <div className={`tier-bar-fill ${reached ? 'reached' : ''}`} style={{ width: `${Math.max(p, 0).toFixed(1)}%` }} />
                    </div>
                  </div>
                );
              })}
              {calc.totalVolume < 50001 && (
                <div className="tier-hint">You need {fmt(50001 - calc.totalVolume, sym)} more in combined monthly volume to unlock your first bonus!</div>
              )}
            </div>

            {/* Real life */}
            <div className="real-life-card">
              <div className="real-life-title">What {fmt(calc.total, sym)} means for you</div>
              <div className="real-life-item">
                <div className="real-life-emoji">🏠</div>
                <div>
                  <div className="real-life-text-title">Extra rent money</div>
                  <div className="real-life-text-desc">Covers {Math.max(Math.floor(calc.total / 3500), 0)} months of rent (avg {sym}3,500/mo)</div>
                </div>
              </div>
              <div className="real-life-item">
                <div className="real-life-emoji">🎓</div>
                <div>
                  <div className="real-life-text-title">School fees</div>
                  <div className="real-life-text-desc">Pays for {Math.max(Math.floor(calc.total / 2000), 0)} children&apos;s school fees</div>
                </div>
              </div>
              <div className="real-life-item">
                <div className="real-life-emoji">📦</div>
                <div>
                  <div className="real-life-text-title">Stock top-up</div>
                  <div className="real-life-text-desc">Adds {fmt(calc.total, sym)} to your monthly restocking budget</div>
                </div>
              </div>
              <div className="real-life-item">
                <div className="real-life-emoji">💊</div>
                <div>
                  <div className="real-life-text-title">Family healthcare</div>
                  <div className="real-life-text-desc">Covers family medical costs with {fmt(Math.max(0, calc.total - 1500), sym)} left over</div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="cta-grid">
              <button className="btn-secondary" onClick={showInputs}>← Adjust numbers</button>
              <button className="btn-primary" style={{ padding: '14px' }} onClick={handleSignup} disabled={signupStatus === 'loading'}>
                {signupStatus === 'loading' ? 'Submitting...' : signupStatus === 'success' ? '✅ Submitted!' : 'Sign me up! 🚀'}
              </button>
            </div>
            {signupStatus === 'success' && (
              <div className="signup-toast success">🎉 Your details have been submitted! The Zeam team will be in touch.</div>
            )}
            {signupStatus === 'error' && (
              <div className="signup-toast error">Something went wrong. Please try again.</div>
            )}
            <div className="disclaimer">
              Estimates based on standard Zeam merchant commission rates (1.5% on all transactions, {sym}40 per sign-on).
              Actual earnings depend on transaction volumes and product availability in your area. · Zeam.money
            </div>
          </div>
        )}
      </div>
    </>
  );
}
