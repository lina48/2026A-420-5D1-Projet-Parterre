import "./env.js";
import { test } from "node:test";
import assert from "node:assert/strict";
import { estCourrielValide, motDePasseAssezLong } from "../src/validation.js";

test("un courriel bien formé est valide", () => {
  assert.equal(estCourrielValide("sophie@mail.com"), true);
});

test("un courriel sans @ est invalide", () => {
  assert.equal(estCourrielValide("sophiemail.com"), false);
});

test("un courriel vide est invalide", () => {
  assert.equal(estCourrielValide(""), false);
});

test("un mot de passe de 8 caractères ou plus est accepté", () => {
  assert.equal(motDePasseAssezLong("demo1234"), true);
});

test("un mot de passe trop court est refusé", () => {
  assert.equal(motDePasseAssezLong("abc"), false);
});
