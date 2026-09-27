/**
 * Local E2E checks against a running `npm start` and a throwaway Postgres.
 *
 *   BASE_URL=http://localhost:3000 DATABASE_URL=... AUTH_SECRET=... node scripts/verify-deploy.mjs
 */
import { PrismaClient } from "@prisma/client";

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const prisma = new PrismaClient();
const results = [];

function pass(name, detail) {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail) {
  results.push({ name, ok: false, detail });
  console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function storeCookies(jar, response) {
  const raw = response.headers.getSetCookie?.() ?? [];
  const fallback = response.headers.get("set-cookie");
  const list = raw.length ? raw : fallback ? [fallback] : [];
  for (const line of list) {
    const pair = line.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq < 1) continue;
    jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  }
}

async function jsonFetch(path, init = {}, jar) {
  const headers = { ...(init.headers || {}) };
  if (jar) headers.cookie = cookieHeader(jar);
  const res = await fetch(`${BASE}${path}`, { ...init, headers, redirect: "manual" });
  if (jar) storeCookies(jar, res);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body, text };
}

async function credentialsLogin(email, password) {
  const jar = new Map();
  const csrf = await jsonFetch("/api/auth/csrf", {}, jar);
  const token = csrf.body?.csrfToken;
  if (!token) throw new Error(`no csrf: ${csrf.text}`);
  const form = new URLSearchParams({
    csrfToken: token,
    email,
    password,
    callbackUrl: `${BASE}/dashboard`,
    json: "true",
  });
  const login = await jsonFetch(
    "/api/auth/callback/credentials",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    },
    jar
  );
  return { jar, login };
}

async function main() {
  const stamp = Date.now();
  const memberEmail = `verify.member.${stamp}@example.com`;
  const adminEmail = "francestho@gmail.com";
  const memberPassword = "VerifyPass1";
  const adminPassword = "AdminPass1";

  // a. Register + tokenVersion column
  const register = await jsonFetch("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Verify Member",
      email: memberEmail,
      password: memberPassword,
      track: "CAREER",
    }),
  });
  if (register.res.status === 201 && register.body?.id) {
    pass("a.register", `${register.res.status} id=${register.body.id}`);
  } else {
    fail("a.register", `${register.res.status} ${register.text}`);
  }

  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'tokenVersion'
  `);
  if (Array.isArray(cols) && cols.length === 1) {
    pass("a.tokenVersion_column", "User.tokenVersion exists");
  } else {
    fail("a.tokenVersion_column", JSON.stringify(cols));
  }

  // b. Credentials login
  const memberLogin = await credentialsLogin(memberEmail, memberPassword);
  const sessionCookies = [...memberLogin.jar.keys()].filter((k) =>
    /session-token|authjs\.session/i.test(k)
  );
  if (sessionCookies.length > 0 || [200, 302].includes(memberLogin.login.res.status)) {
    pass(
      "b.credentials_login",
      `status=${memberLogin.login.res.status} cookies=${sessionCookies.join(",") || "see-redirect"}`
    );
  } else {
    fail("b.credentials_login", `${memberLogin.login.res.status} ${memberLogin.login.text}`);
  }

  // c. Mobile token + revocation
  const mobile = await jsonFetch("/api/mobile/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: memberEmail, password: memberPassword }),
  });
  const token = mobile.body?.token;
  const before = await jsonFetch("/api/mobile/auth/me", {
    headers: { authorization: `Bearer ${token}` },
  });
  if (mobile.res.status === 200 && token && before.res.status === 200) {
    pass("c.mobile_token_issued", "login + /me 200");
  } else {
    fail("c.mobile_token_issued", `login=${mobile.res.status} me=${before.res.status}`);
  }

  const member = await prisma.user.findUnique({
    where: { email: memberEmail },
    select: { id: true, tokenVersion: true },
  });
  if (member) {
    await prisma.user.update({
      where: { id: member.id },
      data: { tokenVersion: { increment: 1 } },
    });
  }
  const after = await jsonFetch("/api/mobile/auth/me", {
    headers: { authorization: `Bearer ${token}` },
  });
  if (after.res.status === 401) {
    pass("c.revocation", "/me is 401 after tokenVersion bump");
  } else {
    fail("c.revocation", `${after.res.status} ${after.text}`);
  }

  // c2. Web session revocation — same tokenVersion bump must kill the Auth.js cookie
  const staleWeb = await jsonFetch("/api/user/persona", {}, memberLogin.jar);
  const freshWeb = await credentialsLogin(memberEmail, memberPassword);
  const freshPersona = await jsonFetch("/api/user/persona", {}, freshWeb.jar);
  if (staleWeb.res.status === 401 && freshPersona.res.status === 200) {
    pass("c.web_revocation", "stale cookie 401; fresh login 200");
  } else {
    fail(
      "c.web_revocation",
      `stale=${staleWeb.res.status} fresh=${freshPersona.res.status} ${staleWeb.text}`
    );
  }

  // d. Admin route + audit
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });
  if (!existingAdmin) {
    await jsonFetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "Frances",
        email: adminEmail,
        password: adminPassword,
        track: "CAREER",
      }),
    });
  } else {
    const { default: bcrypt } = await import("bcryptjs");
    await prisma.user.update({
      where: { email: adminEmail },
      data: { passwordHash: await bcrypt.hash(adminPassword, 12) },
      select: { id: true },
    });
  }

  const adminLogin = await credentialsLogin(adminEmail, adminPassword);
  const stats = await jsonFetch("/api/admin/stats", {}, adminLogin.jar);
  if (stats.res.status === 200) {
    pass("d.admin_stats", "GET /api/admin/stats 200");
  } else {
    fail("d.admin_stats", `${stats.res.status} ${stats.text}`);
  }

  const auditBefore = await prisma.adminAuditLog.count();
  if (member) {
    const patch = await jsonFetch(
      "/api/admin/users",
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: member.id, company: "Verify Co" }),
      },
      adminLogin.jar
    );
    const auditAfter = await prisma.adminAuditLog.count();
    const row = await prisma.adminAuditLog.findFirst({
      where: { action: "user.update", targetUserId: member.id },
      orderBy: { createdAt: "desc" },
    });
    if (patch.res.status === 200 && auditAfter > auditBefore && row) {
      pass("d.admin_audit", `AdminAuditLog ${row.action} ${row.id}`);
    } else {
      fail(
        "d.admin_audit",
        `patch=${patch.res.status} before=${auditBefore} after=${auditAfter} ${patch.text}`
      );
    }
  } else {
    fail("d.admin_audit", "member row missing");
  }

  // e. Demo guard in production
  const demoEmail = "starter.fresh@demo.com";
  await prisma.user.upsert({
    where: { email: demoEmail },
    create: {
      email: demoEmail,
      name: "Demo",
      passwordHash: "x",
    },
    update: { passwordHash: "x" },
  });
  const demoLogin = await jsonFetch("/api/mobile/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: demoEmail, password: "VerifyPass1" }),
  });
  if (demoLogin.res.status === 401) {
    pass("e.demo_guard", "production mobile login refused @demo.com");
  } else {
    fail("e.demo_guard", `${demoLogin.res.status} ${demoLogin.text}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  await prisma.$disconnect();
  if (failed.length) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
