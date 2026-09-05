const symptoms = ["Well", "Mild", "Moderate", "Severe"];
const stoolOptions = ["Not logged", "Formed", "Loose", "Watery", "Constipated"];

export default function Home() {
  return (
    <main>
      <h1>PendaFood</h1>
      <p className="muted">A simple daily companion for food, symptoms, stool, and habits.</p>

      <section className="card">
        <h2>Today</h2>
        <p className="muted">Prototype only — nothing is stored yet.</p>
        <div className="grid">
          <label>Overall health
            <select defaultValue="Well">
              {symptoms.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>Stool today
            <select defaultValue="Not logged">
              {stoolOptions.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>Energy (1–5)
            <input type="number" min="1" max="5" defaultValue="3" />
          </label>
          <label>Water glasses
            <input type="number" min="0" max="30" defaultValue="0" />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Today’s plan</h2>
        <div className="grid">
          <button>Log breakfast</button>
          <button>Log lunch</button>
          <button>Log dinner</button>
          <button>Log symptoms</button>
        </div>
      </section>

      <section className="card">
        <h2>Safety by design</h2>
        <p className="muted">
          PendaFood will store health entries privately in Supabase with Row Level Security.
          Public food knowledge will be separated from private user records, and no secrets or real health data belong in this repository.
        </p>
      </section>
    </main>
  );
}
