-- Comptes de démonstration — un par rôle, chargés automatiquement au
-- démarrage (exigence du sprint 1 : « comptes de démonstration...
-- chargés automatiquement, un par rôle »). Mot de passe pour les deux :
-- demo1234
--
-- Les hachages ci-dessous sont réels (calculés avec la même fonction
-- crypto.scrypt que src/motDePasse.js) — pas des valeurs inventées.
-- ON CONFLICT : rejouable sans danger si le conteneur redémarre sans
-- recréer le volume.
INSERT INTO utilisateur (nom, courriel, mot_de_passe_hash, role) VALUES
  ('Sophie Martin', 'sophie@mail.com',
   '1acd9d77516225c287213bd2b4c79518:ea597b99d0931dc0d4f93c850afac2bd879f412f784b0e32c62f7d1e0859f05cfeab9691746af3e8f6dd07f44b4c2dc7bf4f8241ecffc3f351f6151cb5ffd7aa',
   'spectateur'),
  ('Marc Gérant', 'gestionnaire@mail.com',
   'd54911d65964baa14fe22f49d737d3b2:afa0d257679e5c1cc35acfb8ab712f874363af3012d0419a2edf272ce6998693732093ca41a8923a89e5663399f757c4df45e9145a301464419db966bcc7d9e5',
   'gestionnaire')
ON CONFLICT (courriel) DO NOTHING;
