package com.prospeccion.obs;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.widget.Toast;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

@CapacitorPlugin(
    name = "DictadoNativo",
    permissions = {
        @Permission(
            alias = "microfono",
            strings = { Manifest.permission.RECORD_AUDIO }
        )
    }
)
public class DictadoNativoPlugin extends Plugin {

    private SpeechRecognizer speechRecognizer;
    private Intent speechIntent;
    private boolean escuchandoActivo = false;
    private boolean deteniendoManualmente = false;
    private boolean cicloEnCurso = false;
    private String ultimoTextoEmitido = "";
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Runnable reinicioPendiente = null;

    private String traducirError(int code) {
        switch (code) {
            case SpeechRecognizer.ERROR_AUDIO: return "AUDIO (fallo grabando)";
            case SpeechRecognizer.ERROR_CLIENT: return "CLIENT (sesion chocada - normal)";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "PERMISOS INSUFICIENTES";
            case SpeechRecognizer.ERROR_NETWORK: return "RED (sin internet)";
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "RED TIMEOUT";
            case SpeechRecognizer.ERROR_NO_MATCH: return "SIN COINCIDENCIA";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "MOTOR OCUPADO";
            case SpeechRecognizer.ERROR_SERVER: return "SERVIDOR GOOGLE FALLO";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "SIN HABLA";
            case SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED: return "IDIOMA NO SOPORTADO";
            case SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE: return "IDIOMA NO DISPONIBLE";
            default: return "DESCONOCIDO (" + code + ")";
        }
    }

    private void cancelarReinicioPendiente() {
        if (reinicioPendiente != null) {
            mainHandler.removeCallbacks(reinicioPendiente);
            reinicioPendiente = null;
        }
    }

    private void programarReinicio(int delayMs) {
        cancelarReinicioPendiente();
        reinicioPendiente = () -> {
            reinicioPendiente = null;
            if (escuchandoActivo && !deteniendoManualmente) {
                escucharInterno();
            }
        };
        mainHandler.postDelayed(reinicioPendiente, delayMs);
    }

    @Override
    public void load() {
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            Toast.makeText(getContext(),
                "⚠️ MOTOR DE VOZ NO DISPONIBLE en esta tablet. Instala la app 'Google' desde Play Store.",
                Toast.LENGTH_LONG).show();
        }

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
        speechIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        speechIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        speechIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-MX");
        speechIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
        speechIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);

        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override
            public void onReadyForSpeech(Bundle params) {
                cicloEnCurso = true;
            }

            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}
            @Override public void onEvent(int eventType, Bundle params) {}

            @Override
            public void onError(int error) {
                cicloEnCurso = false;

                // ERROR_CLIENT es normal cuando detenemos manualmente o cuando el motor reinicia
                // No lo mostramos como error visible al usuario
                if (error == SpeechRecognizer.ERROR_CLIENT) {
                    if (escuchandoActivo && !deteniendoManualmente) {
                        // Reinicio silencioso con espera prudente
                        programarReinicio(800);
                    }
                    return;
                }

                // ERROR_SPEECH_TIMEOUT y ERROR_NO_MATCH son normales (nadie habló)
                // Tampoco los mostramos al usuario
                if (error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT || error == SpeechRecognizer.ERROR_NO_MATCH) {
                    if (escuchandoActivo && !deteniendoManualmente) {
                        programarReinicio(300);
                    }
                    return;
                }

                // Errores graves SÍ los mostramos
                String descripcion = traducirError(error);
                Toast.makeText(getContext(), "❌ " + descripcion, Toast.LENGTH_LONG).show();

                JSObject ret = new JSObject();
                ret.put("code", error);
                ret.put("mensaje", descripcion);
                notifyListeners("dictadoError", ret);

                // Solo reintentar en errores recuperables
                boolean debeReintentar = escuchandoActivo
                    && !deteniendoManualmente
                    && error != SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS
                    && error != SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED
                    && error != SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE
                    && error != SpeechRecognizer.ERROR_NETWORK
                    && error != SpeechRecognizer.ERROR_SERVER;

                if (debeReintentar) {
                    programarReinicio(1000);
                } else {
                    escuchandoActivo = false;
                }
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                // Ignoramos parciales para evitar duplicación
            }

            @Override
            public void onResults(Bundle results) {
                cicloEnCurso = false;

                ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && !matches.isEmpty()) {
                    String textoFinal = matches.get(0).trim();
                    if (!textoFinal.isEmpty() && !textoFinal.equalsIgnoreCase(ultimoTextoEmitido)) {
                        ultimoTextoEmitido = textoFinal;
                        JSObject ret = new JSObject();
                        ret.put("texto", textoFinal);
                        notifyListeners("dictadoFinal", ret);
                    }
                }

                // Reinicio controlado con delay prudente
                if (escuchandoActivo && !deteniendoManualmente) {
                    programarReinicio(500);
                }
            }
        });
    }

    @PluginMethod
    public void iniciar(PluginCall call) {
        if (getPermissionState("microfono") != PermissionState.GRANTED) {
            requestPermissionForAlias("microfono", call, "permisoCallback");
            return;
        }
        ultimoTextoEmitido = "";
        deteniendoManualmente = false;
        escuchandoActivo = true;
        cancelarReinicioPendiente();
        escucharInterno();
        call.resolve();
    }

    @PermissionCallback
    private void permisoCallback(PluginCall call) {
        if (getPermissionState("microfono") == PermissionState.GRANTED) {
            ultimoTextoEmitido = "";
            deteniendoManualmente = false;
            escuchandoActivo = true;
            cancelarReinicioPendiente();
            escucharInterno();
            call.resolve();
        } else {
            call.reject("Permiso de micrófono denegado por el usuario");
        }
    }

    @PluginMethod
    public void detener(PluginCall call) {
        escuchandoActivo = false;
        deteniendoManualmente = true;
        cancelarReinicioPendiente();

        getActivity().runOnUiThread(() -> {
            if (speechRecognizer != null) {
                try { speechRecognizer.stopListening(); } catch (Exception ignored) {}
            }
        });

        // Esperar un poco y luego cancelar para asegurar cierre limpio
        mainHandler.postDelayed(() -> {
            getActivity().runOnUiThread(() -> {
                if (speechRecognizer != null) {
                    try { speechRecognizer.cancel(); } catch (Exception ignored) {}
                }
            });
            ultimoTextoEmitido = "";
            deteniendoManualmente = false;
        }, 150);

        call.resolve();
    }

    private void escucharInterno() {
        if (getActivity() == null) return;
        if (!escuchandoActivo || deteniendoManualmente) return;
        if (cicloEnCurso) return; // Evitar doble arranque

        getActivity().runOnUiThread(() -> {
            if (speechRecognizer != null && escuchandoActivo && !deteniendoManualmente) {
                try {
                    cicloEnCurso = true;
                    speechRecognizer.startListening(speechIntent);
                } catch (Exception e) {
                    cicloEnCurso = false;
                    Toast.makeText(getContext(), "❌ Error inicio: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    JSObject ret = new JSObject();
                    ret.put("code", -1);
                    ret.put("mensaje", e.getMessage());
                    notifyListeners("dictadoError", ret);
                    escuchandoActivo = false;
                }
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        escuchandoActivo = false;
        deteniendoManualmente = true;
        cancelarReinicioPendiente();
        if (speechRecognizer != null) {
            try { speechRecognizer.destroy(); } catch (Exception ignored) {}
            speechRecognizer = null;
        }
        super.handleOnDestroy();
    }
}