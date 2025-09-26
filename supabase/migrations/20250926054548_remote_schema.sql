create table "public"."exercise_entries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "exercise_name" text not null,
    "duration" integer not null,
    "date" date not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."exercise_entries" enable row level security;

create table "public"."journal_entries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "content" text not null,
    "mood_emoji" text not null,
    "tags" text[] default '{}'::text[],
    "date" date not null default CURRENT_DATE,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."journal_entries" enable row level security;

create table "public"."meal_entries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "meal_name" text not null,
    "meal_type" text not null,
    "calories" integer not null,
    "protein" numeric(6,2) default 0,
    "carbs" numeric(6,2) default 0,
    "fat" numeric(6,2) default 0,
    "date" date not null default CURRENT_DATE,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."meal_entries" enable row level security;

create table "public"."mood_entries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "mood_value" integer not null,
    "mood_emoji" text not null,
    "notes" text,
    "date" date not null default CURRENT_DATE,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."mood_entries" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "first_name" text not null,
    "last_name" text not null,
    "date_of_birth" date,
    "gender" text,
    "marketing_consent" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."profiles" enable row level security;

create table "public"."sleep_entries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "bedtime" time without time zone not null,
    "wake_time" time without time zone not null,
    "sleep_quality" integer,
    "sleep_duration" interval generated always as (
CASE
    WHEN (wake_time >= bedtime) THEN (wake_time - bedtime)
    ELSE ((wake_time + '24:00:00'::interval) - bedtime)
END) stored,
    "date" date not null default CURRENT_DATE,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."sleep_entries" enable row level security;

create table "public"."stretches_entries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "stretch_name" text not null,
    "duration" integer not null,
    "date" date not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."stretches_entries" enable row level security;

create table "public"."water_entries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "cups_consumed" integer not null default 0,
    "daily_goal" integer not null default 8,
    "date" date not null default CURRENT_DATE,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."water_entries" enable row level security;

create table "public"."weight_entries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "weight" numeric(5,2) not null,
    "body_fat_percentage" numeric(4,2),
    "waist_measurement" numeric(5,2),
    "chest_measurement" numeric(5,2),
    "hip_measurement" numeric(5,2),
    "date" date not null default CURRENT_DATE,
    "created_at" timestamp with time zone default now()
);


alter table "public"."weight_entries" enable row level security;

CREATE UNIQUE INDEX completed_exercises_pkey ON public.exercise_entries USING btree (id);

CREATE UNIQUE INDEX completed_stretches_pkey ON public.stretches_entries USING btree (id);

CREATE UNIQUE INDEX journal_entries_pkey ON public.journal_entries USING btree (id);

CREATE UNIQUE INDEX meal_entries_pkey ON public.meal_entries USING btree (id);

CREATE UNIQUE INDEX mood_entries_pkey ON public.mood_entries USING btree (id);

CREATE UNIQUE INDEX mood_entries_user_id_date_key ON public.mood_entries USING btree (user_id, date);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX sleep_entries_pkey ON public.sleep_entries USING btree (id);

CREATE UNIQUE INDEX sleep_entries_user_id_date_key ON public.sleep_entries USING btree (user_id, date);

CREATE UNIQUE INDEX water_entries_pkey ON public.water_entries USING btree (id);

CREATE UNIQUE INDEX water_entries_user_id_date_key ON public.water_entries USING btree (user_id, date);

CREATE UNIQUE INDEX weight_entries_pkey ON public.weight_entries USING btree (id);

alter table "public"."exercise_entries" add constraint "completed_exercises_pkey" PRIMARY KEY using index "completed_exercises_pkey";

alter table "public"."journal_entries" add constraint "journal_entries_pkey" PRIMARY KEY using index "journal_entries_pkey";

alter table "public"."meal_entries" add constraint "meal_entries_pkey" PRIMARY KEY using index "meal_entries_pkey";

alter table "public"."mood_entries" add constraint "mood_entries_pkey" PRIMARY KEY using index "mood_entries_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."sleep_entries" add constraint "sleep_entries_pkey" PRIMARY KEY using index "sleep_entries_pkey";

alter table "public"."stretches_entries" add constraint "completed_stretches_pkey" PRIMARY KEY using index "completed_stretches_pkey";

alter table "public"."water_entries" add constraint "water_entries_pkey" PRIMARY KEY using index "water_entries_pkey";

alter table "public"."weight_entries" add constraint "weight_entries_pkey" PRIMARY KEY using index "weight_entries_pkey";

alter table "public"."exercise_entries" add constraint "completed_exercises_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."exercise_entries" validate constraint "completed_exercises_user_id_fkey";

alter table "public"."journal_entries" add constraint "journal_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."journal_entries" validate constraint "journal_entries_user_id_fkey";

alter table "public"."meal_entries" add constraint "meal_entries_meal_type_check" CHECK ((meal_type = ANY (ARRAY['breakfast'::text, 'lunch'::text, 'dinner'::text, 'snack'::text]))) not valid;

alter table "public"."meal_entries" validate constraint "meal_entries_meal_type_check";

alter table "public"."meal_entries" add constraint "meal_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."meal_entries" validate constraint "meal_entries_user_id_fkey";

alter table "public"."mood_entries" add constraint "mood_entries_mood_value_check" CHECK (((mood_value >= 1) AND (mood_value <= 5))) not valid;

alter table "public"."mood_entries" validate constraint "mood_entries_mood_value_check";

alter table "public"."mood_entries" add constraint "mood_entries_user_id_date_key" UNIQUE using index "mood_entries_user_id_date_key";

alter table "public"."mood_entries" add constraint "mood_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."mood_entries" validate constraint "mood_entries_user_id_fkey";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_gender_check" CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text, 'prefer-not-to-say'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_gender_check";

alter table "public"."profiles" add constraint "profiles_id_fkey1" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey1";

alter table "public"."sleep_entries" add constraint "sleep_entries_sleep_quality_check" CHECK (((sleep_quality >= 1) AND (sleep_quality <= 5))) not valid;

alter table "public"."sleep_entries" validate constraint "sleep_entries_sleep_quality_check";

alter table "public"."sleep_entries" add constraint "sleep_entries_user_id_date_key" UNIQUE using index "sleep_entries_user_id_date_key";

alter table "public"."sleep_entries" add constraint "sleep_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."sleep_entries" validate constraint "sleep_entries_user_id_fkey";

alter table "public"."stretches_entries" add constraint "completed_stretches_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."stretches_entries" validate constraint "completed_stretches_user_id_fkey";

alter table "public"."water_entries" add constraint "water_entries_user_id_date_key" UNIQUE using index "water_entries_user_id_date_key";

alter table "public"."water_entries" add constraint "water_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."water_entries" validate constraint "water_entries_user_id_fkey";

alter table "public"."weight_entries" add constraint "weight_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."weight_entries" validate constraint "weight_entries_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;$function$
;

create policy "Users can delete their own exercise entries"
on "public"."exercise_entries"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert their own exercise entries"
on "public"."exercise_entries"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can view their own exercise entries"
on "public"."exercise_entries"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can delete their own journal entries "
on "public"."journal_entries"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own journal entries"
on "public"."journal_entries"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own journal entries"
on "public"."journal_entries"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own journal entries"
on "public"."journal_entries"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can delete their own meal entries"
on "public"."meal_entries"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own meal entries"
on "public"."meal_entries"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own meal entries "
on "public"."meal_entries"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own meal entries"
on "public"."meal_entries"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can delete their own mood entries"
on "public"."mood_entries"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own mood entries"
on "public"."mood_entries"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own mood entries"
on "public"."mood_entries"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own mood entries"
on "public"."mood_entries"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own profile"
on "public"."profiles"
as permissive
for insert
to authenticated
with check (true);


create policy "Users can update their own profile"
on "public"."profiles"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = id));


create policy "Users can view their own profile"
on "public"."profiles"
as permissive
for select
to authenticated
using ((auth.uid() = id));


create policy "Users can delete their own sleep entries"
on "public"."sleep_entries"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own sleep entries"
on "public"."sleep_entries"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own sleep entries"
on "public"."sleep_entries"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own sleep entries"
on "public"."sleep_entries"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can delete their own stretches entries"
on "public"."stretches_entries"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own stretches entries"
on "public"."stretches_entries"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can view their own stretches entries"
on "public"."stretches_entries"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can delete their own water entries"
on "public"."water_entries"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own water entries "
on "public"."water_entries"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own water entries"
on "public"."water_entries"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own water entries"
on "public"."water_entries"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Users can delete their own weight entries "
on "public"."weight_entries"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can insert their own weight entries"
on "public"."weight_entries"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own weight entries"
on "public"."weight_entries"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own weight entries"
on "public"."weight_entries"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


CREATE TRIGGER journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER water_entries_updated_at BEFORE UPDATE ON public.water_entries FOR EACH ROW EXECUTE FUNCTION handle_updated_at();



