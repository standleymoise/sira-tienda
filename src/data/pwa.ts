// App instalable (PWA): íconos PNG generados al compilar a partir del ícono de tienda.config.ts.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tienda } from '../../tienda.config';

export const iconos = {
  'icono-192': { tam: 192, maskable: false },
  'icono-512': { tam: 512, maskable: false },
  // «maskable»: Android lo recorta en círculo o gota; el dibujo va al 70 % sobre el color de fondo.
  'maskable-512': { tam: 512, maskable: true },
  // iPhone / iPad (pantalla de inicio).
  'apple-180': { tam: 180, maskable: true },
} as const;
export type NombreIcono = keyof typeof iconos;

/** PNG cuadrado del ícono de la app. */
export async function iconoPng(nombre: NombreIcono): Promise<Uint8Array> {
  const { default: sharp } = await import('sharp');
  const { tam, maskable } = iconos[nombre];
  const origen = await readFile(join(process.cwd(), 'public', tienda.app.icono.replace(/^\//, '')));
  const interior = maskable ? Math.round(tam * 0.7) : tam;
  const dibujo = await sharp(origen, { density: 512 })
    .resize(interior, interior, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  if (!maskable) return new Uint8Array(dibujo);
  const borde = Math.round((tam - interior) / 2);
  const salida = await sharp({
    create: { width: tam, height: tam, channels: 4, background: tienda.app.fondoIcono },
  })
    .composite([{ input: dibujo, top: borde, left: borde }])
    .png()
    .toBuffer();
  return new Uint8Array(salida);
}
