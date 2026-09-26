-- PendaFood privacy-first schema.
create table if not exists public.meal_templates (
  id text primary key,
  name text not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner')),
  description text not null,
  food_ids text[] not null default '{}',
  substitution_note text,
  source_name text not null,
  source_url text,
  is_active boolean not null default true
);
alter table public.meal_templates enable row level security;
drop policy if exists "meal templates are readable by everyone" on public.meal_templates;
create policy "meal templates are readable by everyone" on public.meal_templates for select using (is_active = true);

insert into public.meal_templates (id,name,meal_type,description,food_ids,substitution_note,source_name) values
('oats-banana-yogurt','Soft oats with banana','breakfast','Cooked oats with banana; add a tolerated lactose-free yoghurt if desired.',ARRAY['oats','banana'],'Swap banana for blueberries if that better matches your preferences.','PendaFood starter templates'),
('egg-potato-spinach','Eggs with potato and spinach','breakfast','Eggs with cooked potato and wilted spinach.',ARRAY['egg','potato','spinach'],'Swap spinach for cooked carrot or courgette.','PendaFood starter templates'),
('rice-chicken-carrot','Chicken rice bowl','lunch','Rice with simply cooked chicken and cooked carrot.',ARRAY['rice','chicken','carrot'],'Swap chicken for turkey or white fish.','PendaFood starter templates'),
('fish-potato-carrot','White fish with potato','lunch','Baked white fish with potato and cooked carrot.',ARRAY['white_fish','potato','carrot'],'Swap white fish for chicken or turkey.','PendaFood starter templates'),
('turkey-rice-courgette','Turkey rice bowl','dinner','Simply cooked turkey with rice and courgette.',ARRAY['turkey','rice','courgette'],'Swap courgette for carrot or spinach.','PendaFood starter templates'),
('chicken-potato-spinach','Chicken with potato and spinach','dinner','Simply cooked chicken with potato and cooked spinach.',ARRAY['chicken','potato','spinach'],'Swap spinach for courgette or carrot.','PendaFood starter templates')
on conflict (id) do nothing;
