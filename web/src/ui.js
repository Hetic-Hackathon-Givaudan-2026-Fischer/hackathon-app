export function createUI() {
  const root = document.getElementById('hud');

  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML = `
    <p class="eyebrow">G.F.T.E.</p>
    <h1>Givaudan Flavor Trends Experience</h1>
    <span class="rule"></span>
    <p class="tagline">Le goût, composé avec précision.</p>
    <p class="hint">Cliquez pour entrer</p>
    <p class="keys">ZQSD / WASD pour marcher · souris pour regarder · clic pour scanner (moins de 3 m) · reclic pour ranger la tablette · Échap pour sortir</p>
  `;

  const crosshair = document.createElement('div');
  crosshair.className = 'crosshair';

  root.append(overlay, crosshair);

  return {
    setPlaying(playing) {
      overlay.classList.toggle('hidden', playing);
      crosshair.classList.toggle('visible', playing);
      if (!playing) crosshair.classList.remove('reading');
    },
    setReading(reading) {
      crosshair.classList.toggle('reading', reading);
    },
  };
}
