"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

const healthOptions = ["Well", "Mild", "Moderate", "Severe"];
const stoolOptions = ["Not logged", "Formed", "Loose", "Watery", "Constipated"];
const mealTypes = ["breakfast", "lunch", "dinner"] as const;
type MealType = typeof mealTypes[number];
type Meal = { id: string; meal_type: MealType; food_name: string; portion: string | null; eaten_at: string; symptoms_after: string | null; notes: string | null };
type Food = { id: string; name: string; category: string; default_portion: string | null; preparation_note: string | null };
type Preference = { food_id: string; preference: string; tolerance: string; notes: string | null };

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
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [customFood, setCustomFood] = useState("");
  const [portion, setPortion] = useState("");
  const [mealNotes, setMealNotes] = useState("");
  const [symptomsAfter, setSymptomsAfter] = useState("");
  const [meals, setMeals] = useState<Meal[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [preferences, setPreferences] = useState<Record<string, Preference>>({});
  const [foodSearch, setFoodSearch] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      setSignedIn(Boolean(user));
      const { data: catalog } = await supabase.from("food_catalog").select("id,name,category,default_portion,preparation_note").order("name");
      setFoods((catalog as Food[]) || []);
      if (user) {
        await loadToday(user.id);
        const { data: prefs } = await supabase.from("user_food_preferences").select("*").eq("user_id", user.id);
        setPreferences(Object.fromEntries(((prefs as Preference[]) || []).map(p => [p.food_id, p])));
      }
      setLoading(false);
    });
  }, []);

  async function loadToday(userId: string) {
    const start = new Date(today + "T00:00:00").toISOString();
    const end = new Date(today + "T23:59:59.999").toISOString();
    const { data } = await createClient().from("meal_logs").select("*").eq("user_id", userId).gte("eaten_at", start).lte("eaten_at", end).order("eaten_at", { ascending: false });
    setMeals((data as Meal[]) || []);
  }

  function toggleFood(id: string) {
    setSelectedFoodIds(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  }

  async function saveCheckin() {
    const supabase = createClient(); const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/auth"; return; }
    setMessage("Saving…");
    const { error } = await supabase.from("daily_logs").upsert({ user_id: auth.user.id, log_date: today, health_status: healthStatus, stool_type: stoolType, pain_score: pain, urgency_score: urgency, energy_score: energy, water_glasses: water, notes: notes || null }, { onConflict: "user_id,log_date" });
    setMessage(error ? error.message : "Today's private check-in was saved.");
  }

  async function addMeal() {
    const selectedNames = foods.filter(f => selectedFoodIds.includes(f.id)).map(f => f.name);
    const custom = customFood.split(",").map(x => x.trim()).filter(Boolean);
    const names = [...selectedNames, ...custom];
    if (!names.length) { setMessage("Choose a food or add a custom food before saving."); return; }
    const supabase = createClient(); const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { window.location.href = "/auth"; return; }
    setMessage("Saving meal…");
    const { error } = await supabase.from("meal_logs").insert({ user_id: auth.user.id, meal_type: mealType, food_name: names.join(", "), portion: portion.trim() || null, symptoms_after: symptomsAfter.trim() || null, notes: mealNotes.trim() || null });
    if (error) { setMessage(error.message); return; }
    setSelectedFoodIds([]); setCustomFood(""); setPortion(""); setMealNotes(""); setSymptomsAfter("");
    await loadToday(auth.user.id); setMessage("Meal saved privately.");
  }

  async function savePreference(foodId: string, preference: string, tolerance?: string) {
    const { data: auth } = await createClient().auth.getUser();
    if (!auth.user) { window.location.href = "/auth"; return; }
    const previous = preferences[foodId];
    const next = { food_id: foodId, preference, tolerance: tolerance || previous?.tolerance || "unknown" };
    const { error } = await createClient().from("user_food_preferences").upsert({ user_id: auth.user.id, ...next }, { onConflict: "user_id,food_id" });
    if (error) { setMessage(error.message); return; }
    setPreferences(current => ({ ...current, [foodId]: { ...next, notes: null } }));
  }

  async function deleteMeal(id: string) {
    const { error } = await createClient().from("meal_logs").delete().eq("id", id);
    if (error) { setMessage(error.message); return; }
    setMeals(current => current.filter(meal => meal.id !== id));
  }

  async function signOut() { await createClient().auth.signOut(); setSignedIn(false); window.location.href = "/auth"; }

  if (loading) return <main><p>Loading your private dashboard…</p></main>;

  const visibleFoods = foods.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase()) || f.category.toLowerCase().includes(foodSearch.toLowerCase()));
  const availableFoods = visibleFoods.filter(f => preferences[f.id]?.preference !== "unavailable" && preferences[f.id]?.preference !== "avoid");

  return <main>
    <header>
      <h1>PendaFood</h1>
      <p className="muted">Food, symptoms, stool and habits — kept simple and private.</p>
      {signedIn ? <button onClick={signOut}>Sign out</button> : <a href="/auth">Sign in</a>}
    </header>

    <section className="card">
      <h2>Today's gut check-in</h2>
      <div className="grid">
        <label>Overall health<select value={healthStatus} onChange={e => setHealthStatus(e.target.value)}>{healthOptions.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Stool today<select value={stoolType} onChange={e => setStoolType(e.target.value)}>{stoolOptions.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Energy (1–5)<input type="number" min="1" max="5" value={energy} onChange={e => setEnergy(Number(e.target.value))} /></label>
        <label>Water glasses<input type="number" min="0" max="30" value={water} onChange={e => setWater(Number(e.target.value))} /></label>
        <label>Pain (0–10)<input type="number" min="0" max="10" value={pain} onChange={e => setPain(Number(e.target.value))} /></label>
        <label>Urgency (0–3)<input type="number" min="0" max="3" value={urgency} onChange={e => setUrgency(Number(e.target.value))} /></label>
      </div>
      <label>Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything useful to remember" rows={3} /></label>
      <button onClick={saveCheckin}>{signedIn ? "Save today's check-in" : "Sign in to save"}</button>
    </section>

    <section className="card">
      <h2>Build a meal</h2>
      <p className="muted">Select several foods below, then save them together as breakfast, lunch or dinner.</p>
      <div className="grid">
        <label>Meal<select value={mealType} onChange={e => setMealType(e.target.value as MealType)}>{mealTypes.map(type => <option key={type}>{type}</option>)}</select></label>
        <label>Search foods<input value={foodSearch} onChange={e => setFoodSearch(e.target.value)} placeholder="Search the catalog" /></label>
      </div>
      <div className="food-list">
        {availableFoods.map(food => <label key={food.id} className="food-option"><input type="checkbox" checked={selectedFoodIds.includes(food.id)} onChange={() => toggleFood(food.id)} /> <strong>{food.name}</strong> <span className="muted">({food.category}{food.default_portion ? " · " + food.default_portion : ""})</span></label>)}
      </div>
      <label>Custom foods (optional, comma separated)<input value={customFood} onChange={e => setCustomFood(e.target.value)} placeholder="e.g. sourdough toast, olive oil" /></label>
      <div className="grid">
        <label>Portion / serving notes<input value={portion} onChange={e => setPortion(e.target.value)} placeholder="e.g. 1 bowl each" /></label>
        <label>Symptoms after (optional)<input value={symptomsAfter} onChange={e => setSymptomsAfter(e.target.value)} placeholder="e.g. bloating" /></label>
      </div>
      <label>Meal notes<textarea value={mealNotes} onChange={e => setMealNotes(e.target.value)} rows={2} placeholder="Preparation or anything useful" /></label>
      <button onClick={addMeal}>{signedIn ? "Save this meal" : "Sign in to save"}</button>
    </section>

    <section className="card">
      <h2>My food preferences</h2>
      <p className="muted">These are personal settings, not medical recommendations. Foods marked avoid or unavailable are hidden from meal selection.</p>
      <div className="food-list">
        {visibleFoods.map(food => {
          const pref = preferences[food.id];
          return <div key={food.id} className="food-option"><strong>{food.name}</strong> <span className="muted">{pref ? " · " + pref.preference + " · " + pref.tolerance : ""}</span>
            <div>
              <button onClick={() => savePreference(food.id, "like")}>Like</button>
              <button onClick={() => savePreference(food.id, "dislike")}>Dislike</button>
              <button onClick={() => savePreference(food.id, "unavailable")}>Unavailable</button>
              <button onClick={() => savePreference(food.id, "avoid")}>Avoid</button>
              <button onClick={() => savePreference(food.id, pref?.preference || "neutral", "tolerated")}>Tolerated</button>
              <button onClick={() => savePreference(food.id, pref?.preference || "neutral", "uncertain")}>Unsure</button>
              <button onClick={() => savePreference(food.id, pref?.preference || "neutral", "problematic")}>Problematic</button>
            </div>
          </div>;
        })}
      </div>
    </section>

    <section className="card">
      <h2>Today's meals</h2>
      {meals.length === 0 ? <p className="muted">Nothing logged yet.</p> : <ul>{meals.map(meal => <li key={meal.id}><strong>{meal.meal_type}</strong>: {meal.food_name}{meal.portion ? " · " + meal.portion : ""}{meal.symptoms_after ? " · symptoms: " + meal.symptoms_after : ""} <button onClick={() => deleteMeal(meal.id)}>Delete</button></li>)}</ul>}
    </section>

    {message && <p role="status">{message}</p>}
    <section className="card"><h2>Privacy</h2><p className="muted">Your health records and preferences are private to your account. Public catalog data contains no user health information.</p></section>
  </main>;
}
