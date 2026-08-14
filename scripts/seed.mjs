import bcrypt from "bcryptjs";
import postgres from "postgres";

const DEMO_EMAIL = "demo@crosstracker.app";
const DEMO_PASSWORD = "password123";

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error("Set DIRECT_URL (or DATABASE_URL) in .env first.");
}

const sql = postgres(url, { prepare: false });

console.log(`Seeding ${DEMO_EMAIL} …`);

await sql`delete from users where email = ${DEMO_EMAIL}`;

const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

const [user] = await sql`
  insert into users (email, password_hash)
  values (${DEMO_EMAIL}, ${passwordHash})
  returning id
`;

const categoryRows = await sql`
  insert into categories (user_id, name)
  values (${user.id}, 'Marketing'), (${user.id}, 'Payroll')
  returning id, name
`;
const categoryId = Object.fromEntries(
  categoryRows.map((row) => [row.name, row.id]),
);

await sql`
  insert into plans (user_id, category_id, month, amount_cents)
  values ${sql([
    [user.id, categoryId.Marketing, "2026-01", 500_000],
    [user.id, categoryId.Payroll, "2026-01", 2_000_000],
    [user.id, categoryId.Marketing, "2026-02", 500_000],
    [user.id, categoryId.Payroll, "2026-02", 2_000_000],
  ])}
`;

await sql`
  insert into actuals (user_id, category_id, month, amount_cents, note)
  values ${sql([
    [user.id, categoryId.Marketing, "2026-01", 480_000, "January ads invoice"],
    [user.id, categoryId.Payroll, "2026-01", 2_050_000, null],
    [user.id, categoryId.Payroll, "2026-02", 1_980_000, null],
  ])}
`;

const [counts] = await sql`
  select
    (select count(*) from categories where user_id = ${user.id}) as categories,
    (select count(*) from plans where user_id = ${user.id}) as plans,
    (select count(*) from actuals where user_id = ${user.id}) as actuals
`;

console.log(
  `Seeded: 1 user, ${counts.categories} categories, ${counts.plans} plans, ${counts.actuals} actuals.`,
);
console.log(`Log in with ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

await sql.end();
