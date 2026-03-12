'use client';

import { useState, useCallback, useMemo } from 'react';

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

// --------------- Slider Component ---------------
function Slider({
  label,
  sublabel,
  value,
  min,
  max,
  step,
  display,
  color,
  onChange,
}: {
  label: string;
  sublabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  color: string;
  onChange: (v: number) => void;
}) {
  const p = pct(value, min, max);
  return (
    <div className="slider-wrap">
      <div className="slider-top">
        <div>
          <div className="slider-label">{label}</div>
          <div className="slider-sublabel">{sublabel}</div>
        </div>
        <div className="slider-value" style={{ color }}>
          {display}
        </div>
      </div>
      <div className="slider-track">
        <div
          className="slider-fill"
          style={{
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            width: `${p}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <div
          className="slider-thumb"
          style={{
            borderColor: color,
            boxShadow: `0 2px 12px ${color}55`,
            left: `${p}%`,
          }}
        />
      </div>
    </div>
  );
}

// --------------- Main Calculator ---------------
export default function Calculator() {
  const [page, setPage] = useState<'inputs' | 'results'>('inputs');
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [shopName, setShopName] = useState('');
  const [customers, setCustomers] = useState(30);
  const [avg, setAvg] = useState(200);
  const [airtime, setAirtime] = useState(5000);
  const [elec, setElec] = useState(8000);
  const [ref, setRef] = useState(10);
  const [signupStatus, setSignupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const sym = currency.sym;

  const calc = useMemo(() => {
    const monthlyVol = customers * avg * 26;
    const txn = Math.round(monthlyVol * RATES.commission);
    const air = Math.round(airtime * RATES.commission);
    const elecComm = Math.round(elec * RATES.commission);
    const refEarn = Math.round(ref * RATES.referralBonus);
    const tier =
      [...RATES.bonusTiers].reverse().find((t) => monthlyVol >= t.min) ||
      RATES.bonusTiers[0];
    const bonus = tier.bonus;
    const total = txn + air + elecComm + refEarn + bonus;
    const annual = total * 12;
    return { monthlyVol, txn, air, elecComm, refEarn, bonus, tier, total, annual };
  }, [customers, avg, airtime, elec, ref]);

  const showResults = useCallback(() => {
    setPage('results');
    window.scrollTo(0, 0);
  }, []);

  const showInputs = useCallback(() => {
    setPage('inputs');
    window.scrollTo(0, 0);
  }, []);

  const handleSignup = async () => {
    setSignupStatus('loading');
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: shopName,
          currency: currency.code,
          customers_per_day: customers,
          avg_transaction: avg,
          monthly_airtime: airtime,
          monthly_electricity: elec,
          referrals: ref,
          monthly_earnings: calc.total,
          annual_earnings: calc.annual,
        }),
      });
      if (res.ok) {
        setSignupStatus('success');
      } else {
        setSignupStatus('error');
      }
    } catch {
      setSignupStatus('error');
    }
  };

  const barMax = Math.max(calc.txn, 100) * 1.4;

  // --------------- RENDER ---------------
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
            <button
              key={c.code}
              className={`cur-btn ${currency.code === c.code ? 'active' : ''}`}
              onClick={() => setCurrency(c)}
            >
              {c.sym}
            </button>
          ))}
        </div>
      </div>

      <div className="container">
        {/* ====== PAGE 1: INPUTS ====== */}
        {page === 'inputs' && (
          <div className="page active">
            <div className="intro">
              <h1>
                How much can your shop <span>earn</span> with Zeam?
              </h1>
              <p>
                Move the sliders to match your shop. See your monthly earnings
                update live.
              </p>
            </div>

            {/* Shop name */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon" style={{ background: '#f0f9ff' }}>
                  🏪
                </div>
                <div>
                  <div className="card-title">Your Shop</div>
                  <div className="card-sub">
                    Optional — personalise your report
                  </div>
                </div>
              </div>
              <input
                className="shop-input"
                type="text"
                placeholder="e.g. Mama Grace's Spaza"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
              />
            </div>

            {/* Customer payments */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon" style={{ background: '#e8f7ff' }}>
                  💳
                </div>
                <div>
                  <div className="card-title">Customer Payments</div>
                  <div className="card-sub">
                    Earn 1.5% commission on every payment through your shop
                  </div>
                </div>
              </div>
              <Slider
                label="Customers paying per day"
                sublabel="How many customers pay in your shop daily?"
                value={customers}
                min={5}
                max={200}
                step={5}
                display={`${customers} customers`}
                color="#00B4D8"
                onChange={setCustomers}
              />
              <Slider
                label="Average transaction value"
                sublabel="How much does a typical customer spend?"
                value={avg}
                min={20}
                max={2000}
                step={20}
                display={`${sym}${avg}`}
                color="#0f3460"
                onChange={setAvg}
              />
              <div className="preview-box">
                <div className="preview-label">
                  Monthly payment volume through your shop
                </div>
                <div className="preview-value" style={{ color: '#00B4D8' }}>
                  {fmt(calc.monthlyVol, sym)}
                </div>
              </div>
            </div>

            {/* Airtime & Electricity */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon" style={{ background: '#fff8e8' }}>
                  📱
                </div>
                <div>
                  <div className="card-title">Airtime &amp; Electricity Sales</div>
                  <div className="card-sub">
                    Earn 1.5% on every top-up and token you sell
                  </div>
                </div>
              </div>
              <Slider
                label="Monthly airtime sold"
                sublabel="Total airtime sales per month"
                value={airtime}
                min={0}
                max={50000}
                step={500}
                display={`${sym}${(airtime / 1000).toFixed(1)}K`}
                color="#F4A261"
                onChange={setAirtime}
              />
              <Slider
                label="Monthly electricity / utilities sold"
                sublabel="Prepaid electricity and water tokens"
                value={elec}
                min={0}
                max={80000}
                step={500}
                display={`${sym}${(elec / 1000).toFixed(1)}K`}
                color="#FFD166"
                onChange={setElec}
              />
            </div>

            {/* Referrals */}
            <div className="card">
              <div className="card-header">
                <div className="card-icon" style={{ background: '#eefff8' }}>
                  🤝
                </div>
                <div>
                  <div className="card-title">Sign Up New Zeam Users</div>
                  <div className="card-sub">
                    Earn R40 for every new customer you sign on to Zeam
                  </div>
                </div>
              </div>
              <Slider
                label="New Zeam sign-ons per month"
                sublabel="Customers you introduce to Zeam"
                value={ref}
                min={0}
                max={100}
                step={1}
                display={`${ref} people`}
                color="#06D6A0"
                onChange={setRef}
              />
              <div className="preview-box" style={{ background: '#eefff8' }}>
                <div className="preview-label">
                  Referral earnings this month
                </div>
                <div className="preview-value" style={{ color: '#06D6A0' }}>
                  {fmt(calc.refEarn, sym)}
                </div>
              </div>
            </div>

            {/* Live strip */}
            <div className="live-strip">
              <div>
                <div className="live-label">Your monthly earnings</div>
                <div className="live-amount">{fmt(calc.total, sym)}</div>
              </div>
              <button className="btn-primary" onClick={showResults}>
                See full
                <br />
                breakdown →
              </button>
            </div>
          </div>
        )}

        {/* ====== PAGE 2: RESULTS ====== */}
        {page === 'results' && (
          <div className="page active animate-in">
            <div className="results-intro">
              <div className="sub">
                {shopName
                  ? `Earnings report for ${shopName}`
                  : 'Your Zeam earnings breakdown'}
              </div>
              <h2>
                Here is exactly how you <span>earn</span> with Zeam
              </h2>
            </div>

            {/* Total */}
            <div className="total-card">
              <div className="total-label">Total Monthly Earnings</div>
              <div className="total-amount">{fmt(calc.total, sym)}</div>
              <div className="total-sub">per month, into your pocket</div>
            </div>

            {/* Annual */}
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
              {/* Payment commission */}
              <div className="bar-row">
                <div className="bar-top">
                  <div className="bar-label">
                    💳 Payment commission (1.5% of {fmt(calc.monthlyVol, sym)})
                  </div>
                  <div className="bar-amount" style={{ color: '#00B4D8' }}>
                    {fmt(calc.txn, sym)}
                  </div>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      background: 'linear-gradient(90deg,#00B4D888,#00B4D8)',
                      width: `${barWidth(calc.txn, barMax)}%`,
                    }}
                  />
                </div>
              </div>
              {/* Airtime */}
              <div className="bar-row">
                <div className="bar-top">
                  <div className="bar-label">📱 Airtime commission (1.5%)</div>
                  <div className="bar-amount" style={{ color: '#F4A261' }}>
                    {fmt(calc.air, sym)}
                  </div>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      background: 'linear-gradient(90deg,#F4A26188,#F4A261)',
                      width: `${barWidth(calc.air, barMax)}%`,
                    }}
                  />
                </div>
              </div>
              {/* Electricity */}
              <div className="bar-row">
                <div className="bar-top">
                  <div className="bar-label">
                    ⚡ Electricity commission (1.5%)
                  </div>
                  <div className="bar-amount" style={{ color: '#FFD166' }}>
                    {fmt(calc.elecComm, sym)}
                  </div>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      background: 'linear-gradient(90deg,#FFD16688,#FFD166)',
                      width: `${barWidth(calc.elecComm, barMax)}%`,
                    }}
                  />
                </div>
              </div>
              {/* Referrals */}
              <div className="bar-row">
                <div className="bar-top">
                  <div className="bar-label">
                    🤝 Sign-on bonuses ({ref} × R40)
                  </div>
                  <div className="bar-amount" style={{ color: '#06D6A0' }}>
                    {fmt(calc.refEarn, sym)}
                  </div>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      background: 'linear-gradient(90deg,#06D6A088,#06D6A0)',
                      width: `${barWidth(calc.refEarn, barMax)}%`,
                    }}
                  />
                </div>
              </div>
              {/* Volume bonus */}
              {calc.bonus > 0 && (
                <div className="bar-row">
                  <div className="bar-top">
                    <div className="bar-label">🏆 Monthly volume bonus</div>
                    <div className="bar-amount" style={{ color: '#EF476F' }}>
                      {fmt(calc.bonus, sym)}
                    </div>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        background:
                          'linear-gradient(90deg,#EF476F88,#EF476F)',
                        width: `${barWidth(calc.bonus, barMax)}%`,
                      }}
                    />
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
              <div className="section-subtitle">
                Process more payments, earn bigger monthly bonuses
              </div>
              {RATES.bonusTiers
                .filter((t) => t.bonus > 0)
                .map((t, i) => {
                  const reached = calc.monthlyVol >= t.min;
                  const p =
                    t.max === Infinity
                      ? 100
                      : Math.min(
                          ((calc.monthlyVol - t.min) / (t.max - t.min)) * 100,
                          100
                        );
                  const label =
                    t.max === Infinity
                      ? `${sym}${(t.min / 1000).toFixed(0)}K+/month`
                      : `${sym}${(t.min / 1000).toFixed(0)}K – ${sym}${(t.max / 1000).toFixed(0)}K/month`;
                  return (
                    <div
                      key={i}
                      className={`tier-item ${reached ? 'reached' : ''}`}
                    >
                      <div className="tier-top">
                        <div
                          className={`tier-name ${reached ? 'reached' : ''}`}
                        >
                          {reached ? '✅' : '🔒'} {label}
                        </div>
                        <div
                          className={`tier-bonus ${reached ? 'reached' : ''}`}
                        >
                          +{sym}
                          {t.bonus.toLocaleString()} bonus
                        </div>
                      </div>
                      <div className="tier-bar-track">
                        <div
                          className={`tier-bar-fill ${reached ? 'reached' : ''}`}
                          style={{
                            width: `${Math.max(p, 0).toFixed(1)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              {calc.monthlyVol < 50001 && (
                <div className="tier-hint">
                  You need {fmt(50001 - calc.monthlyVol, sym)} more in monthly
                  volume to unlock your first bonus!
                </div>
              )}
            </div>

            {/* Real life */}
            <div className="real-life-card">
              <div className="real-life-title">
                What {fmt(calc.total, sym)} means for you
              </div>
              <div className="real-life-item">
                <div className="real-life-emoji">🏠</div>
                <div>
                  <div className="real-life-text-title">Extra rent money</div>
                  <div className="real-life-text-desc">
                    Covers {Math.max(Math.floor(calc.total / 3500), 0)} months
                    of rent (avg {sym}3,500/mo)
                  </div>
                </div>
              </div>
              <div className="real-life-item">
                <div className="real-life-emoji">🎓</div>
                <div>
                  <div className="real-life-text-title">School fees</div>
                  <div className="real-life-text-desc">
                    Pays for {Math.max(Math.floor(calc.total / 2000), 0)}{' '}
                    children&apos;s school fees
                  </div>
                </div>
              </div>
              <div className="real-life-item">
                <div className="real-life-emoji">📦</div>
                <div>
                  <div className="real-life-text-title">Stock top-up</div>
                  <div className="real-life-text-desc">
                    Adds {fmt(calc.total, sym)} to your monthly restocking
                    budget
                  </div>
                </div>
              </div>
              <div className="real-life-item">
                <div className="real-life-emoji">💊</div>
                <div>
                  <div className="real-life-text-title">Family healthcare</div>
                  <div className="real-life-text-desc">
                    Covers family medical costs with{' '}
                    {fmt(Math.max(0, calc.total - 1500), sym)} left over
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="cta-grid">
              <button className="btn-secondary" onClick={showInputs}>
                ← Adjust numbers
              </button>
              <button
                className="btn-primary"
                style={{ padding: '14px' }}
                onClick={handleSignup}
                disabled={signupStatus === 'loading'}
              >
                {signupStatus === 'loading'
                  ? 'Submitting...'
                  : signupStatus === 'success'
                    ? '✅ Submitted!'
                    : 'Sign me up! 🚀'}
              </button>
            </div>
            {signupStatus === 'success' && (
              <div className="signup-toast success">
                🎉 Your details have been submitted! The Zeam team will be in touch.
              </div>
            )}
            {signupStatus === 'error' && (
              <div className="signup-toast error">
                Something went wrong. Please try again.
              </div>
            )}
            <div className="disclaimer">
              Estimates based on standard Zeam merchant commission rates (1.5%
              on all transactions, R40 per sign-on). Actual earnings depend on
              transaction volumes and product availability in your area. ·
              Zeam.money
            </div>
          </div>
        )}
      </div>
    </>
  );
}
