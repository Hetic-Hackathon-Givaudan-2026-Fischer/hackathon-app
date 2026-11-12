interface CrosshairProps {
  visible: boolean;
}

/** Viseur au centre de l'écran, pendant la visite. */
export function Crosshair({ visible }: CrosshairProps) {
  return (
    <div
      aria-hidden
      className={`absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200 ${visible ? 'opacity-85' : 'opacity-0'}`}
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-ivory" />
      <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ivory" />
    </div>
  );
}
