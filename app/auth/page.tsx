"use client";
import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function AuthPage(){
 const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState("");
 async function submit(e:FormEvent, mode:"signin"|"signup"){ e.preventDefault(); setMessage("Working…");
  const supabase=createClient();
  const result=mode==="signin" ? await supabase.auth.signInWithPassword({email,password}) : await supabase.auth.signUp({email,password});
  setMessage(result.error ? result.error.message : mode==="signup" ? "Check your email to confirm your account." : "Signed in successfully.");
 }
 return <main><h1>Welcome to PendaFood</h1><p>Your health entries stay tied to your private account.</p><form><input aria-label="Email" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/><input aria-label="Password" type="password" placeholder="Password (8+ characters)" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} required/><button onClick={e=>submit(e,"signin")}>Sign in</button><button onClick={e=>submit(e,"signup")}>Create account</button></form><p>{message}</p></main>
}
