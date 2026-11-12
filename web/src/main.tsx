import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ShowroomPage } from './components/showroom/ShowroomPage';
import './index.css';

// Seule URL hors interface interne : le lien showroom d'un client (ADR 0010).
// Tout chemin /showroom… reste côté client, même mal formé (lien tronqué,
// ponctuation ajoutée par un mail) : jamais de repli sur le dashboard interne
const SHOWROOM = /^\/showroom(?:\/|$)/;
// Jeton de `secrets.token_urlsafe` : base64 URL, 100 caractères au plus (API)
const TOKEN = /^\/showroom\/([A-Za-z0-9_-]{1,100})\/?$/;

function rootView() {
  const { pathname } = window.location;
  if (!SHOWROOM.test(pathname)) return <App />;
  return <ShowroomPage token={TOKEN.exec(pathname)?.[1] ?? null} />;
}

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable dans index.html');

createRoot(root).render(<StrictMode>{rootView()}</StrictMode>);
