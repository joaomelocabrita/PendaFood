"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

const healthOptions = ["Well", "Mild", "Moderate", "Severe"];
const stoolOptions = ["Not logged", "Formed", "Loose", "Watery", "Constipated"];
const mealTypes = ["breakfast", "lunch", "dinner"] as const;
type MealType = typeof mealTypes[number];
type Meal = { id: string; meal_type: MealType; food_name: string; portion: string | null; eaten_at: string; symptoms_after: string | null; notes: string | null };

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
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [foodName, setFoodName] = useState("");
  const [portion, setPortion] = useState("");
  const [mealNotes, setMealNotes] = useState("");
  const [symptomsAfter, setSymptomsAfter] = useState("");
  const [meals, setMeals] = useState<Meal[]>([]);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      setSignedIn(Boolean(user));
      if (user) await loadToday(user.id);
      setLoading(false);
    });
  }, []);

  async function loadToday(userId: string) {
    const start = new Date(today + "T00:00:00").toISOString();
    const end = new Date(today + "T23:59:59.999").toISOString();
    const { data } = await createClient().from("meal_logs").select("*").eq("user_id", userId).gte("eaten_at", start).lte("eaten_at", end).order("eaten_at", { ascending: false });
    setMeals((data as Meal[]) || []);
  }

  async function saveCheckin() {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/auth"; return; }
    setMessage("Saving…");
    const { error } = await supabase.from("daily_logs").upsert({
      user_id: auth.user.id, log_date: today, health_status: healthStatus, stool_type: stoolType,
      pain_score: pain, urgency_score: urgency, energy_score: energy, water_glasses: water, notes: notes || null
    }, { onConflict: "user_id,log_date" });
    setMessage(error ? error.message : "Today's private check-in was saved.");
  }

  async function addMeal() {
    const name = foodName.trim();
    if (!name) { setMessage("Add at least one food before saving the meal."); return; }
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/auth"; return; }
    setMessage("Saving meal…");
    const { error } = await supabase.from("meal_logs").insert({
      user_id: auth.user.id, meal_type: mealType, food_name: name,
      portion: portion.trim() || null, symptoms_after: symptomsAfter.trim() || null, notes: mealNotes.trim() || null
    });
    if (error) { setMessage(error.message); return; }
    setFoodName(""); setPortion(""); setMealNotes(""); setSymptomsAfter("");
    await loadToday(auth.user.id);
    setMessage("Meal saved privately.");
  }

  async function deleteMeal(id: string) {
    const { error } = await createClient().from("meal_logs").delete().eq("id", id);
    if (error) { setMessage(error.message); return; }
    setMeals(current => current.filter(meal => meal.id !== id));
  }

  async function signOut() {
    await createClient().auth.signOut();
    setSignedIn(false);
    window.location.href = "/auth";
  }

  if (loading) return <main><p>Loading…</p></main>;

  return <main>
    <header>
      <h1>PendaFood</h1>
      <p className="muted">A simple daily companion for food, symptoms, stool, and habits.</p>
      {signedIn ? <button onClick={signOut}>Sign out</button> : <a href="/auth">Sign in</a>}
    </header>

    <section className="card">
      <h2>Today's gut check-in</h2>
      <p className="muted">Quick observations, not a diagnosis.</p>
      <div className="grid">
        <label>Overall health<select value={healthStatus} onChange={e => setHealthStatus(e.target.value)}>{healthOptions.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Stool today<select value={stoolType} onChange={e => setStoolType(e.target.value)}>{stoolOptions.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Energy (1–5)<input type="number" min="1" max="5" value={energy} onChange={e => setEnergy(Number(e.target.value))} /></label>
        <label>Water glasses<input type="number" min="0" max="30" value={water} onChange={e => setWater(Number(e.target.value))} /></label>
        <label>Pain (0–10)<input type="number" min="0" max="10" value={pain} onChange={e => setPain(Number(e.target.value))} /></label>
        <label>Urgency (0–3)<input type="number" min="0" max="3" value={urgency} onChange={e => setUrgency(Number(e.target.value))} /></label>
      </div>
      <label>Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything you want to remember about today" rows={3} /></label>
      <button onClick={saveCheckin}>{signedIn ? "Save today's check-in" : "Sign in to save"}</button>
    </section>

    <section className="card">
      <h2>Log a meal</h2>
      <p className="muted">For now, add one food or meal description per entry. We will add structured food search and multi-food meals next.</p>
      <div className="grid">
        <label>Meal<select value={mealType} onChange={e => setMealType(e.target.value as MealType)}>{mealTypes.map(type => <option key={type}>{type}</option>)}</select></label>
        <label>Food or meal<input value={foodName} onChange={e => setFoodName(e.target.value)} placeholder="e.g. oatmeal with banana" /></label>
        <label>Portion (optional)<input value={portion} onChange={e => setPortion(e.target.value)} placeholder="e.g. 1 bowl" /></label>
        <label>Symptoms after (optional)<input value={symptomsAfter} onChange={e => setSymptomsAfter(e.target.value)} placeholder="e.g. bloating" /></label>
      </div>
      <label>Meal notes<textarea value={mealNotes} onChange={e => setMealNotes(e.target.value)} rows={2} placeholder="Preparation, ingredients, or anything useful" /></label>
      <button onClick={addMeal}>{signedIn ? "Save meal" : "Sign in to save"}</button>
    </section>

    <section className="card">
      <h2>Today's meals</h2>
      {meals.length === 0 ? <p className="muted">Nothing logged yet.</p> : <ul>{meals.map(meal => <li key={meal.id}><strong>{meal.meal_type}</strong>: {meal.food_name}{meal.portion ? " · " + meal.portion : ""} {meal.symptoms_after ? " · symptoms: " + meal.symptoms_after : ""} <button onClick={() => deleteMeal(meal.id)}>Delete</button></li>)}</ul>}
    </section>

    {message && <p role="status">{message}</p>}

    <section className="card">
      <h2>Privacy</h2>
      <p className="muted">Private health records are stored behind your account and Row Level Security. No real health records or secrets belong in this public repository.</p>
    </section>
  </main>;
}
