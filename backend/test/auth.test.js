import "./env.js";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { startServer, viderTables } from "./helpers.js";
import { fermerPool } from "../src/repository/db.js";

let api;

before(async () => {
  await viderTables();
  api = await startServer();
});

after(async () => {
  await api.close();
  await fermerPool();
});

test("inscription réussie renvoie 201 et jamais le mot de passe", async () => {
  const { status, donnees } = await api.request("POST", "/api/auth/inscription", {
    nomComplet: "Sophie Martin",
    email: "sophie@mail.com",
    motDePasse: "demo1234",
  });

  assert.equal(status, 201);
  assert.equal(donnees.email, "sophie@mail.com");
  assert.equal(donnees.role, "spectateur");
  assert.equal(donnees.motDePasse, undefined);
  assert.equal(donnees.motDePasseHash, undefined);
});

test("inscription avec un rôle envoyé par le client est ignorée — le compte reste spectateur", async () => {
  const { donnees } = await api.request("POST", "/api/auth/inscription", {
    nomComplet: "Tentative Gestionnaire",
    email: "tentative@mail.com",
    motDePasse: "demo1234",
    role: "gestionnaire",
  });

  assert.equal(donnees.role, "spectateur");
});

test("inscription avec un courriel déjà utilisé renvoie 409", async () => {
  const { status } = await api.request("POST", "/api/auth/inscription", {
    nomComplet: "Sophie Encore",
    email: "sophie@mail.com", // déjà créé dans le premier test
    motDePasse: "autreMotDePasse",
  });

  assert.equal(status, 409);
});

test("inscription avec un mot de passe trop court renvoie 400", async () => {
  const { status } = await api.request("POST", "/api/auth/inscription", {
    nomComplet: "Court",
    email: "court@mail.com",
    motDePasse: "abc",
  });

  assert.equal(status, 400);
});

test("connexion avec le bon mot de passe renvoie 200 et pose un cookie de session", async () => {
  const { status, donnees, entetes } = await api.request("POST", "/api/auth/connexion", {
    email: "sophie@mail.com",
    motDePasse: "demo1234",
  });

  assert.equal(status, 200);
  assert.equal(donnees.email, "sophie@mail.com");
  assert.ok(entetes.get("set-cookie")?.includes("session_siegevif="));
});

test("connexion avec un mauvais mot de passe renvoie 401", async () => {
  const { status } = await api.request("POST", "/api/auth/connexion", {
    email: "sophie@mail.com",
    motDePasse: "pasLeBonMotDePasse",
  });

  assert.equal(status, 401);
});

test("connexion avec un courriel inexistant renvoie 401 (même message, pour ne pas révéler qui est inscrit)", async () => {
  const { status, donnees } = await api.request("POST", "/api/auth/connexion", {
    email: "personne@mail.com",
    motDePasse: "demo1234",
  });

  assert.equal(status, 401);
  assert.equal(donnees.message, "Courriel ou mot de passe incorrect.");
});

test("/api/auth/moi sans cookie renvoie 401", async () => {
  const { status } = await api.request("GET", "/api/auth/moi");
  assert.equal(status, 401);
});
