import { spawn, type ChildProcess } from 'node:child_process';
import { createServer, type AddressInfo } from 'node:net';
import pg from 'pg';

const urlBase = process.env.TEST_DATABASE_URL;
if (!urlBase) {
  throw new Error('TEST_DATABASE_URL est requis : les tests ne doivent jamais toucher la vraie base.');
}

function portLibre(): Promise<number> {
  return new Promise((resolve) => {
    const s = createServer();
    s.listen(0, () => {
      const { port } = s.address() as AddressInfo;
      s.close(() => resolve(port));
    });
  });
}

export function courrielUnique() {
  return `test-${Date.now()}-${Math.floor(Math.random() * 100000)}@exemple.com`;
}

export async function requete(sql: string, params: unknown[] = []) {
  const client = new pg.Client({ connectionString: urlBase });
  await client.connect();
  try {
    return (await client.query(sql, params)).rows;
  } finally {
    await client.end();
  }
}

export async function startServer() {
  const port = await portLibre();
  const enfant: ChildProcess = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
    env: {
      ...process.env,
      DATABASE_URL: urlBase,
      PORT: String(port),
      JWT_SECRET: 'secret-de-test-seulement',
      NODE_ENV: 'test',
      INITIAL_ADMIN_NAME: '',
      INITIAL_ADMIN_EMAIL: '',
      INITIAL_ADMIN_PASSWORD: '',
    },
  });

  await new Promise<void>((resolve, reject) => {
    let sortie = '';
    const minuterie = setTimeout(() => reject(new Error(`Serveur trop long à démarrer :\n${sortie}`)), 30000);
    const lire = (morceau: string) => {
      sortie += morceau;
      if (sortie.includes('Parterre API pr')) {
        clearTimeout(minuterie);
        resolve();
      }
    };
    enfant.stdout!.setEncoding('utf8').on('data', lire);
    enfant.stderr!.setEncoding('utf8').on('data', lire);
    enfant.on('exit', () => reject(new Error(`Le serveur s'est arrêté :\n${sortie}`)));
  });

  const base = `http://localhost:${port}`;
  return {
    async request(methode: string, chemin: string, corps?: unknown, jeton?: string) {
      const entetes: Record<string, string> = {};
      if (corps) entetes['Content-Type'] = 'application/json';
      if (jeton) entetes.Authorization = `Bearer ${jeton}`;
      const reponse = await fetch(base + chemin, {
        method: methode,
        headers: entetes,
        body: corps ? JSON.stringify(corps) : undefined,
      });
      const texte = await reponse.text();
      let donnees: any;
      try {
        donnees = texte ? JSON.parse(texte) : undefined;
      } catch {
        donnees = texte;
      }
      return { status: reponse.status, donnees };
    },
    async close() {
      enfant.removeAllListeners('exit');
      enfant.kill();
    },
  };
}