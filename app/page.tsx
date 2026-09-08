"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

const healthOptions = ["Well", "Mild", "Moderate", "Severe"];
const stoolOptions = ["Not logged", "Formed", "Loose", "Watery", "Constipated"];
const mealTypes = ["breakfast", "lunch", "dinner"] as const;
type MealType = typeof mealTypes[number];
type Meal = { id:string; meal_type:MealType; food_name:string; eaten_at:string; portion:string|null; symptoms_after:string|null };
type Food = { id:string; name:string; category:string; default_portion:string|null };
type Preference = { food_id:string; preference:string; tolerance:string };

function scoreFood(food:Food, recent:string[], pref?:Preference) {
  let score = recent.includes(food.name.toLowerCase()) ? 0 : 100;
  if (pref?.preference === "like") score += 20;
  if (pref?.tolerance === "tolerated") score += 15;
  if (pref?.preference === "dislike") score -= 25;
  if (pref?.tolerance === "problematic") score -= 50;
  return score;
}

export default function Home() {
 const [loading,setLoading]=useState(true),[signedIn,setSignedIn]=useState(false),[message,setMessage]=useState("");
 const [foods,setFoods]=useState<Food[]>([]),[preferences,setPreferences]=useState<Record<string,Preference>>({}),[recentMeals,setRecentMeals]=useState<Meal[]>([]),[meals,setMeals]=useState<Meal[]>([]);
 const [healthStatus,setHealthStatus]=useState("Well"),[stoolType,setStoolType]=useState("Not logged"),[energy,setEnergy]=useState(3),[water,setWater]=useState(0),[pain,setPain]=useState(0),[urgency,setUrgency]=useState(0),[notes,setNotes]=useState("");
 const [mealType,setMealType]=useState<MealType>("breakfast"),[selectedFoodIds,setSelectedFoodIds]=useState<string[]>([]),[customFood,setCustomFood]=useState(""),[portion,setPortion]=useState(""),[mealNotes,setMealNotes]=useState(""),[symptomsAfter,setSymptomsAfter]=useState(""),[foodSearch,setFoodSearch]=useState("");
 const today=new Date().toISOString().slice(0,10);

 useEffect(()=>{(async()=>{const s=createClient();const {data:{user}}=await s.auth.getUser();setSignedIn(!!user);
  const {data:catalog}=await s.from("food_catalog").select("id,name,category,default_portion").order("name");setFoods((catalog as Food[])||[]);
  if(user){await loadToday(user.id);await loadHistory(user.id);const {data:p}=await s.from("user_food_preferences").select("food_id,preference,tolerance").eq("user_id",user.id);setPreferences(Object.fromEntries(((p as Preference[])||[]).map(x=>[x.food_id,x])));}
  setLoading(false);})();},[]);

 async function loadToday(userId:string){const s=createClient();const start=new Date(today+"T00:00:00").toISOString(),end=new Date(today+"T23:59:59.999").toISOString();const {data}=await s.from("meal_logs").select("*").eq("user_id",userId).gte("eaten_at",start).lte("eaten_at",end).order("eaten_at",{ascending:false});setMeals((data as Meal[])||[]);}
 async function loadHistory(userId:string){const since=new Date(Date.now()-7*86400000).toISOString();const {data}=await createClient().from("meal_logs").select("*").eq("user_id",userId).gte("eaten_at",since).order("eaten_at",{ascending:false});setRecentMeals((data as Meal[])||[]);}

 const recentFoods=recentMeals.flatMap(m=>m.food_name.toLowerCase().split(",").map(x=>x.trim()));
 const usable=foods.filter(f=>!["avoid","unavailable"].includes(preferences[f.id]?.preference||"")).sort((a,b)=>scoreFood(b,recentFoods,preferences[b.id])-scoreFood(a,recentFoods,preferences[a.id]));
 const suggestions=mealTypes.map(type=>({type,foods:usable.slice(type==="breakfast"?0:type==="lunch"?3:6,type==="breakfast"?3:type==="lunch"?6:9)}));

 function toggleFood(id:string){setSelectedFoodIds(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id]);}
 async function saveCheckin(){const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){location.href="/auth";return;}setMessage("Saving…");const {error}=await s.from("daily_logs").upsert({user_id:user.id,log_date:today,health_status:healthStatus,stool_type:stoolType,pain_score:pain,urgency_score:urgency,energy_score:energy,water_glasses:water,notes:notes||null},{onConflict:"user_id,log_date"});setMessage(error?error.message:"Today's private check-in was saved.");}
 async function addMeal(){const names=[...foods.filter(f=>selectedFoodIds.includes(f.id)).map(f=>f.name),...customFood.split(",").map(x=>x.trim()).filter(Boolean)];if(!names.length){setMessage("Choose a food or add a custom food.");return;}const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){location.href="/auth";return;}const {error}=await s.from("meal_logs").insert({user_id:user.id,meal_type:mealType,food_name:names.join(", "),portion:portion||null,symptoms_after:symptomsAfter||null,notes:mealNotes||null});if(error){setMessage(error.message);return;}setSelectedFoodIds([]);setCustomFood("");setPortion("");setMealNotes("");setSymptomsAfter("");await loadToday(user.id);await loadHistory(user.id);setMessage("Meal saved privately.");}
 async function savePreference(foodId:string,preference:string,tolerance?:string){const s=createClient();const {data:{user}}=await s.auth.getUser();if(!user){location.href="/auth";return;}const prev=preferences[foodId];const next={food_id:foodId,preference,tolerance:tolerance||prev?.tolerance||"unknown"};const {error}=await s.from("user_food_preferences").upsert({user_id:user.id,...next},{onConflict:"user_id,food_id"});if(error){setMessage(error.message);return;}setPreferences(x=>({...x,[foodId]:next}));}
 async function deleteMeal(id:string){const {error}=await createClient().from("meal_logs").delete().eq("id",id);if(error){setMessage(error.message);return;}setMeals(x=>x.filter(m=>m.id!==id));setRecentMeals(x=>x.filter(m=>m.id!==id));}
 async function signOut(){await createClient().auth.signOut();location.href="/auth";}
 if(loading)return <main><p>Loading your private dashboard…</p></main>;
 const visible=usable.filter(f=>f.name.toLowerCase().includes(foodSearch.toLowerCase())||f.category.toLowerCase().includes(foodSearch.toLowerCase()));

 return <main><header><h1>PendaFood</h1><p className="muted">Food, symptoms, stool and habits — kept simple and private.</p>{signedIn?<button onClick={signOut}>Sign out</button>:<a href="/auth">Sign in</a>}</header>
 <section className="card"><h2>7-day meal ideas</h2><p className="muted">Suggestions prioritise foods you have not logged in the last 7 days, while respecting your unavailable/avoid settings. This is variety guidance, not medical advice.</p>
 <div className="grid">{suggestions.map(s=><div key={s.type}><h3>{s.type}</h3>{s.foods.map(f=><div key={f.id}><strong>{f.name}</strong>{recentFoods.includes(f.name.toLowerCase())&&<span className="muted"> · recently eaten</span>}</div>)}<button onClick={()=>{setMealType(s.type);setSelectedFoodIds(s.foods.map(f=>f.id));window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});}}>Use these foods</button></div>)}</div></section>
 <section className="card"><h2>Today's gut check-in</h2><div className="grid"><label>Overall health<select value={healthStatus} onChange={e=>setHealthStatus(e.target.value)}>{healthOptions.map(x=><option key={x}>{x}</option>)}</select></label><label>Stool today<select value={stoolType} onChange={e=>setStoolType(e.target.value)}>{stoolOptions.map(x=><option key={x}>{x}</option>)}</select></label><label>Energy (1–5)<input type="number" min="1" max="5" value={energy} onChange={e=>setEnergy(+e.target.value)}/></label><label>Water glasses<input type="number" min="0" max="30" value={water} onChange={e=>setWater(+e.target.value)}/></label><label>Pain (0–10)<input type="number" min="0" max="10" value={pain} onChange={e=>setPain(+e.target.value)}/></label><label>Urgency (0–3)<input type="number" min="0" max="3" value={urgency} onChange={e=>setUrgency(+e.target.value)}/></label></div><label>Notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}/></label><button onClick={saveCheckin}>Save today's check-in</button></section>
 <section className="card"><h2>Build a meal</h2><div className="grid"><label>Meal<select value={mealType} onChange={e=>setMealType(e.target.value as MealType)}>{mealTypes.map(x=><option key={x}>{x}</option>)}</select></label><label>Search foods<input value={foodSearch} onChange={e=>setFoodSearch(e.target.value)} placeholder="Search foods"/></label></div><div className="food-list">{visible.map(f=><label key={f.id} className="food-option"><input type="checkbox" checked={selectedFoodIds.includes(f.id)} onChange={()=>toggleFood(f.id)}/><strong>{f.name}</strong><span className="muted"> ({f.category})</span></label>)}</div><label>Custom foods<input value={customFood} onChange={e=>setCustomFood(e.target.value)} placeholder="Comma separated"/></label><div className="grid"><label>Portion<input value={portion} onChange={e=>setPortion(e.target.value)}/></label><label>Symptoms after<input value={symptomsAfter} onChange={e=>setSymptomsAfter(e.target.value)}/></label></div><label>Meal notes<textarea value={mealNotes} onChange={e=>setMealNotes(e.target.value)} rows={2}/></label><button onClick={addMeal}>Save this meal</button></section>
 <section className="card"><h2>My food preferences</h2>{foods.map(f=>{const p=preferences[f.id];return <div className="food-option" key={f.id}><strong>{f.name}</strong><span className="muted">{p?" · "+p.preference+" · "+p.tolerance:""}</span><div><button onClick={()=>savePreference(f.id,"like")}>Like</button><button onClick={()=>savePreference(f.id,"unavailable")}>Unavailable</button><button onClick={()=>savePreference(f.id,"avoid")}>Avoid</button><button onClick={()=>savePreference(f.id,p?.preference||"neutral","tolerated")}>Tolerated</button><button onClick={()=>savePreference(f.id,p?.preference||"neutral","problematic")}>Problematic</button></div></div>})}</section>
 <section className="card"><h2>Today's meals</h2>{meals.length?<ul>{meals.map(m=><li key={m.id}><strong>{m.meal_type}</strong>: {m.food_name} <button onClick={()=>deleteMeal(m.id)}>Delete</button></li>)}</ul>:<p className="muted">Nothing logged yet.</p>}</section>{message&&<p role="status">{message}</p>}<section className="card"><h2>Privacy</h2><p className="muted">Your health records and preferences remain private to your account.</p></section></main>;
}
