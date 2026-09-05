"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

const healthOptions = ["Well", "Mild", "Moderate", "Severe"];
const stoolOptions = ["Not logged", "Formed", "Loose", "Watery", "Constipated"];

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [healthStatus, setHealthStatus] = useState("Well");
  const [stoolType, setStoolType] = useState("Not logged");
  const [energy, setEnergy] = useState(3);
  const [water, setWater] = useState(0);
  const [pain, setPain] = useState(0);
  const [urgency, setUrgency] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user));
      setLoading(false);
    });
  }, []);

  async function saveCheckin() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/auth"; return; }

    setMessage("Saving…");
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("daily_logs").upsert({
      user_id: auth.user.id,
      log_date: today,
      health_status: healthStatus,
      stool_type: stoolType,
      pain_score: pain,
      urgency_score: urgency,
      energy_score: energy,
      water_glasses: water,
      notes: notes || null
    }, { onConflict: "user_id,log_date" });

    setMessage(error ? error.message : "Today's private check-in was saved.");
  }

  async function signOut() {
    await createClient().auth.signOut();
    setSignedIn(false);
    window.location.href = "/auth";
  }

  if (loading) return <main><p>Loading…</p></main>;

  return (
    <main>
      <header>
        <h1>PendaFood</h1>
        <p className="muted">A simple daily companion for food, symptoms, stool, and habits.</p>
        {signedIn ? <button onClick={signOut}>Sign out</button> : <a href="/auth">Sign in</a>}
      </header>

      <section className="card">
        <h2>Today's gut check-in</h2>
        <p className="muted">Quick observations, not a diagnosis. Save what is useful and leave the rest blank.</p>
        <div className="grid">
          <label>Overall health
            <select value={healthStatus} onChange={e => setHealthStatus(e.target.value)}>
              {healthOptions.map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>Stool today
            <select value={stoolType} onChange={e => setStoolType(e.target.value)}>
              {stoolOptions.map(value => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>Energy (1–5)
            <input type="number" min="1" max="5" value={energy} onChange={e => setEnergy(Number(e.target.value))} />
          </label>
          <label>Water glasses
            <input type="number" min="0" max="30" value={water} onChange={e => setWater(Number(e.target.value))} />
          </label>
          <label>Pain (0–10)
            <input type="number" min="0" max="10" value={pain} onChange={e => setPain(Number(e.target.value))} />
          </label>
          <label>Urgency (0–3)
            <input type="number" min="0" max="3" value={urgency} onChange={e => setUrgency(Number(e.target.value))} />
          </label>
        </div>
        <label>Notes
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything you want to remember about today" rows={3} />
        </label>
        <button onClick={saveCheckin}>{signedIn ? "Save today's check-in" : "Sign in to save"}</button>
        {message && <p role="status">{message}</p>}
      </section>

      <section className="card">
        <h2>Next</h2>
        <div className="grid">
          <button disabled>Log breakfast — next build</button>
          <button disabled>Log lunch — next build</button>
          <button disabled>Log dinner — next build</button>
          <button disabled>Habits — next build</button>
        </div>
      </section>

      <section className="card">
        <h2>Privacy</h2>
        <p className="muted">Private health records are stored behind your account and Row Level Security. No real health records or secrets belong in this public repository.</p>
      </section>
    </main>
  );
}
