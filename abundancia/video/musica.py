#!/usr/bin/env python3
"""Música de «Riquezas y colores»: cama ambiental tranquila y consonante, sintetizada solo con numpy.

    python3 musica.py            -> salida/musica.wav (44,1 kHz, estéreo, 16 bits)

Re mayor. Acordes de senos y triángulos suaves con ataque y caída lentos, un bordón grave en re,
campanas escasas en cada cambio de escena, anchura estéreo moderada, reverberación por convolución,
fundido de entrada de 3 s y de salida de 4 s. Dura exactamente lo que la película: lee los tiempos de
salida/tiempos.json, que escribe guion.cjs a partir de pelicula.html. Todo es determinista (semilla fija).
"""
import json
import os
import wave

import numpy as np

SR = 44100
AQUI = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(AQUI, 'salida', 'tiempos.json'), encoding='utf-8') as f:
    _t = json.load(f)
DUR = float(_t['duracion'])
T = [float(x) for x in _t['tiempos']]
N = int(round(DUR * SR))
rng = np.random.default_rng(1856)


def hz(midi):
    return 440.0 * 2.0 ** ((midi - 69) / 12.0)


def triangulo(fase, armonicos=(3, 5, 7)):
    """Triángulo de banda limitada, sin el fundamental (se suma aparte como seno)."""
    y = np.zeros_like(fase)
    for k in armonicos:
        y += ((-1) ** ((k - 1) // 2)) * np.sin(k * fase) / (k * k)
    return y


def paneo(p):
    """Paneo de potencia constante, p entre -1 (izquierda) y 1 (derecha)."""
    a = (p + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


def voz_pad(bus, midi, t0, t1, amp, ataque=2.8, caida=3.6, pan=0.0, ancho=0.55, cents=3.5, color=0.30):
    """Nota larga: dos copias apenas desafinadas, una a cada lado."""
    i0 = max(0, int(t0 * SR))
    i1 = min(N, int((t1 + caida) * SR))
    if i1 <= i0:
        return
    x = np.arange(i1 - i0) / SR
    sost = t1 - t0
    env = (0.5 - 0.5 * np.cos(np.pi * np.clip(x / ataque, 0, 1))) * (0.5 + 0.5 * np.cos(np.pi * np.clip((x - sost) / caida, 0, 1)))
    f = hz(midi)
    for lado, signo in ((-1, -1.0), (1, 1.0)):
        ff = f * 2.0 ** (signo * cents / 1200.0)
        fase = 2 * np.pi * ff * x + rng.uniform(0, 2 * np.pi)
        lfo = 1.0 + 0.07 * np.sin(2 * np.pi * rng.uniform(0.07, 0.13) * x + rng.uniform(0, 2 * np.pi))
        s = (np.sin(fase) + color * triangulo(fase)) * env * lfo * amp * 0.5
        gl, gr = paneo(np.clip(pan + lado * ancho, -1, 1))
        bus[0, i0:i1] += s * gl
        bus[1, i0:i1] += s * gr


def campana(bus, midi, t0, amp, pan=0.0, tau=1.7):
    """Campana suave: parciales casi armónicos que se apagan a distinto ritmo; con tres ecos alternos."""
    f = hz(midi)
    parciales = ((1.0, 1.0, 1.0), (2.0, 0.30, 0.55), (3.01, 0.10, 0.35), (4.18, 0.04, 0.22))
    for eco in range(4):
        t = t0 + eco * 0.43
        g = amp * (0.34 ** eco)
        i0 = int(t * SR)
        i1 = min(N, i0 + int(tau * 5 * SR))
        if i1 <= i0:
            continue
        x = np.arange(i1 - i0) / SR
        ataque = 0.5 - 0.5 * np.cos(np.pi * np.clip(x / 0.012, 0, 1))
        s = np.zeros_like(x)
        for razon, nivel, vida in parciales:
            s += nivel * np.sin(2 * np.pi * f * razon * x) * np.exp(-x / (tau * vida))
        s *= ataque * g
        gl, gr = paneo(np.clip(pan if eco == 0 else (0.6 if eco % 2 else -0.6), -1, 1))
        bus[0, i0:i1] += s * gl
        bus[1, i0:i1] += s * gr


def filtra(x, pasa_altos=None, pasa_bajos=None):
    """Filtro suave en el dominio de la frecuencia (fase cero)."""
    n = x.shape[-1]
    X = np.fft.rfft(x, axis=-1)
    fr = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(fr)
    if pasa_altos:
        g *= (fr / pasa_altos) ** 2 / (1 + (fr / pasa_altos) ** 2)
    if pasa_bajos:
        g *= 1 / (1 + (fr / pasa_bajos) ** 4)
    return np.fft.irfft(X * g, n=n, axis=-1)


def reverb(x, vida=0.85, largo=4.0, predelay=0.028):
    """Reverberación por convolución con una respuesta sintética: ruido que se apaga, distinto en cada canal."""
    m = int(largo * SR)
    t = np.arange(m) / SR
    ir = rng.standard_normal((2, m)) * np.exp(-t / vida) * (1 - np.exp(-t / 0.02))
    ir = filtra(ir, pasa_altos=180, pasa_bajos=3800)
    ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    pd = int(predelay * SR)
    nfft = 1 << int(np.ceil(np.log2(x.shape[1] + m + pd)))
    Y = np.fft.rfft(x, nfft, axis=1) * np.fft.rfft(ir, nfft, axis=1)
    y = np.fft.irfft(Y, nfft, axis=1)
    out = np.zeros_like(x)
    out[:, pd:] = y[:, : x.shape[1] - pd]
    return out


def db(v):
    return 20 * np.log10(max(v, 1e-12))


def main():
    pads = np.zeros((2, N))
    bordon = np.zeros((2, N))
    camp = np.zeros((2, N))

    # Un acorde por escena, todos dentro de re mayor (notas MIDI)
    acordes = [
        (50, 57, 64, 66),      # 1  título      Re add9
        (55, 59, 62, 66),      # 2  oro         Sol maj7
        (47, 54, 57, 62),      # 3  púrpura     Si m7
        (43, 50, 59, 66),      # 4  malva       Sol maj7 abierto
        (42, 50, 57, 64),      # 5  verde       Re/Fa#
        (52, 59, 62, 67),      # 6  rojo        Mi m7
        (43, 50, 57, 59),      # 7  Dhanteras   Sol add9
        (47, 57, 62, 66),      # 8  negro       Si m7
        (50, 57, 64, 66),      # 9  azul        Re add9
        (52, 59, 62, 67),      # 10 estudio     Mi m7
        (45, 52, 57, 62),      # 11 paleta      La sus4
        (50, 57, 62, 66, 69),  # 12 cierre      Re
    ]
    for i, notas in enumerate(acordes):
        t0 = max(0.0, T[i] - 1.6)
        t1 = (T[i + 1] if i + 1 < len(T) else DUR) - 0.6
        for k, m in enumerate(notas):
            grave = m < 52
            voz_pad(pads, m, t0, t1, amp=(0.20 if grave else 0.15) * (0.8 if len(notas) > 4 else 1.0), pan=(-0.25, 0.2, -0.1, 0.3, 0.0)[k % 5],
                    ancho=0.25 if grave else 0.6, color=0.18 if grave else 0.32)

    # Bordón: re grave con su quinta, casi inmóvil
    voz_pad(bordon, 38, 0.0, DUR - 4.0, amp=0.30, ataque=4.0, caida=4.0, ancho=0.12, cents=2.0, color=0.10)
    voz_pad(bordon, 45, 0.0, DUR - 4.0, amp=0.10, ataque=6.0, caida=4.0, ancho=0.2, cents=2.5, color=0.06)
    voz_pad(bordon, 26, 0.0, DUR - 4.0, amp=0.12, ataque=5.0, caida=4.0, ancho=0.0, cents=1.5, color=0.0)

    # Campanas: una por cambio de escena (dos o tres al principio y al final)
    toques = {
        0: [(81, 0.9, 0.8)],
        1: [(83, 0.0, 1.0)],
        2: [(78, 0.0, 1.0)],
        3: [(86, 0.0, 0.8)],
        4: [(81, 0.0, 1.0)],
        5: [(79, 0.0, 1.0)],
        6: [(83, 0.0, 1.0)],
        7: [(78, 0.0, 1.0)],
        8: [(76, 0.0, 1.0), (81, 0.5, 0.7)],
        9: [(79, 0.0, 1.0)],
        10: [(76, 0.0, 1.0)],
        11: [(74, 0.0, 1.0), (81, 0.6, 0.8), (86, 5.4, 0.7)],
    }
    for i, lista in toques.items():
        for k, (m, dt, nivel) in enumerate(lista):
            campana(camp, m, T[i] + 0.12 + dt, amp=0.16 * nivel, pan=(-0.3 if (i + k) % 2 else 0.3))

    seco = pads + bordon + camp
    humedo = reverb(pads * 0.9 + camp * 1.3 + bordon * 0.15)
    mezcla = seco * 0.72 + humedo * 0.55
    mezcla = filtra(mezcla, pasa_altos=24, pasa_bajos=9500)

    # Fundidos: 3 s de entrada, 4 s de salida
    t = np.arange(N) / SR
    fundido = (0.5 - 0.5 * np.cos(np.pi * np.clip(t / 3.0, 0, 1))) * (0.5 - 0.5 * np.cos(np.pi * np.clip((DUR - t) / 4.0, 0, 1)))
    mezcla *= fundido

    # Nivel: RMS cerca de -20 dBFS y pico como mucho en -1 dBFS (sin recorte)
    rms = np.sqrt(np.mean(mezcla ** 2))
    mezcla *= 10 ** (-20 / 20) / rms
    pico = np.abs(mezcla).max()
    techo = 10 ** (-1 / 20)
    if pico > techo:
        mezcla *= techo / pico

    tpdf = (rng.random(mezcla.shape) - rng.random(mezcla.shape)) / 32768.0
    pcm = np.round(np.clip(mezcla + tpdf, -1, 1) * 32767.0).astype('<i2')
    medida = pcm.astype(np.float64) / 32768.0

    salida = os.path.join(AQUI, 'salida', 'musica.wav')
    with wave.open(salida, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.T.reshape(-1).tobytes())

    print('archivo:', salida)
    print('duración: %.3f s · %d muestras · %d Hz · estéreo · 16 bits' % (N / SR, N, SR))
    print('pico: %.2f dBFS' % db(np.abs(medida).max()))
    print('RMS: %.2f dBFS' % db(np.sqrt(np.mean(medida ** 2))))
    print('muestras en el tope (recorte): %d' % int((np.abs(pcm) >= 32767).sum()))


if __name__ == '__main__':
    main()
