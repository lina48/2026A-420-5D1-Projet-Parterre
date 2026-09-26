// env.js — importé en PREMIER par chaque fichier de test, avant tout
// le reste, pour que src/repository/db.js lise la bonne base de
// données de test au moment où il ouvre sa connexion.
process.env.DATABASE_URL ??= "postgres://postgres:postgres@localhost:5432/siegevif_test";
process.env.SESSION_SECRET ??= "secret-de-test-seulement";
