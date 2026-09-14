// src/lib/dictado.js
// Puente híbrido: usa el motor nativo de Android en APK, y Web Speech API en navegador.
import { registerPlugin, Capacitor } from '@capacitor/core';

const DictadoNativo = registerPlugin('DictadoNativo');
const esNativo = Capacitor.isNativePlatform();

let listenersListos = false;
let onTextoGlobal = null;
let onErrorGlobal = null;
let ultimoTextoEmitido = '';

async function asegurarListeners() {
  if (listenersListos || !esNativo) return;
  try {
    // Solo escuchamos dictadoFinal, NO dictadoParcial (causa duplicación)
    await DictadoNativo.addListener('dictadoFinal', (data) => {
      if (!data || !data.texto) return;
      const textoLimpio = String(data.texto).trim().toUpperCase();
      if (!textoLimpio) return;
      // Filtro anti-duplicado consecutivo
      if (textoLimpio === ultimoTextoEmitido) return;
      ultimoTextoEmitido = textoLimpio;
      if (onTextoGlobal) onTextoGlobal(textoLimpio);
    });
    await DictadoNativo.addListener('dictadoError', (data) => {
      if (onErrorGlobal) onErrorGlobal(data && data.code);
    });
    listenersListos = true;
  } catch (err) {
    console.warn('No se pudieron registrar listeners nativos:', err);
  }
}

export async function iniciarDictado({ onTexto, onError, onFin }) {
  ultimoTextoEmitido = '';
  if (esNativo) {
    try {
      onTextoGlobal = onTexto;
      onErrorGlobal = onError;
      await asegurarListeners();
      await DictadoNativo.iniciar();
      return {
        detener: async () => {
          try { await DictadoNativo.detener(); } catch (_) {}
          ultimoTextoEmitido = '';
          if (onFin) onFin();
        }
      };
    } catch (err) {
      console.warn('Dictado nativo falló, usando Web Speech:', err);
      return iniciarDictadoWeb({ onTexto, onError, onFin });
    }
  }
  return iniciarDictadoWeb({ onTexto, onError, onFin });
}

function iniciarDictadoWeb({ onTexto, onError, onFin }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    if (onError) onError('sin_soporte');
    return null;
  }

  const recognition = new SR();
  recognition.lang = 'es-MX';
  recognition.continuous = true;
  recognition.interimResults = false; // Solo resultados finales
  recognition.maxAlternatives = 1;

  let activo = true;
  let ultimoTextoWeb = '';

  recognition.onresult = (event) => {
    // Solo procesar el último resultado final (evita duplicación al acumular)
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        const texto = event.results[i][0].transcript.trim().toUpperCase();
        if (texto && texto !== ultimoTextoWeb) {
          ultimoTextoWeb = texto;
          if (onTexto) onTexto(texto);
        }
      }
    }
  };

  recognition.onerror = (e) => {
    if (e.error !== 'no-speech' && onError) onError(e.error);
  };

  recognition.onend = () => {
    if (activo) {
      try {
        recognition.start();
      } catch (_) {
        activo = false;
        if (onFin) onFin();
      }
    } else {
      if (onFin) onFin();
    }
  };

  try {
    recognition.start();
  } catch (err) {
    if (onError) onError('no_inicio');
    return null;
  }

  return {
    detener: () => {
      activo = false;
      try { recognition.stop(); } catch (_) {}
      ultimoTextoWeb = '';
    }
  };
}