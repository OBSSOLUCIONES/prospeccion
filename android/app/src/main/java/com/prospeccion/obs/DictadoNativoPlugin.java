package com.prospeccion.obs;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

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

    @Override
    public void load() {
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
        speechIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        speechIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        speechIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "es-MX");
        speechIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        speechIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);

        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) {}
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}
            @Override public void onEvent(int eventType, Bundle params) {}

            @Override
            public void onError(int error) {
                JSObject ret = new JSObject();
                ret.put("code", error);
                notifyListeners("dictadoError", ret);

                if (escuchandoActivo && error != SpeechRecognizer.ERROR_CLIENT) {
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        if (escuchandoActivo) escucharInterno();
                    }, 300);
                }
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                emitirResultados(partialResults, "dictadoParcial");
            }

            @Override
            public void onResults(Bundle results) {
                emitirResultados(results, "dictadoFinal");

                if (escuchandoActivo) {
                    new Handler(Looper.getMainLooper()).postDelayed(() -> {
                        if (escuchandoActivo) escucharInterno();
                    }, 200);
                }
            }

            private void emitirResultados(Bundle bundle, String evento) {
                ArrayList<String> matches = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && !matches.isEmpty()) {
                    JSObject ret = new JSObject();
                    ret.put("texto", matches.get(0));
                    notifyListeners(evento, ret);
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
        escuchandoActivo = true;
        escucharInterno();
        call.resolve();
    }

    @PermissionCallback
    private void permisoCallback(PluginCall call) {
        if (getPermissionState("microfono") == PermissionState.GRANTED) {
            escuchandoActivo = true;
            escucharInterno();
            call.resolve();
        } else {
            call.reject("Permiso de micrófono denegado por el usuario");
        }
    }

    @PluginMethod
    public void detener(PluginCall call) {
        escuchandoActivo = false;
        getActivity().runOnUiThread(() -> {
            if (speechRecognizer != null) {
                try { speechRecognizer.stopListening(); } catch (Exception ignored) {}
                try { speechRecognizer.cancel(); } catch (Exception ignored) {}
            }
        });
        call.resolve();
    }

    private void escucharInterno() {
        if (getActivity() == null) return;
        getActivity().runOnUiThread(() -> {
            if (speechRecognizer != null && escuchandoActivo) {
                try {
                    speechRecognizer.startListening(speechIntent);
                } catch (Exception e) {
                    JSObject ret = new JSObject();
                    ret.put("code", -1);
                    ret.put("mensaje", e.getMessage());
                    notifyListeners("dictadoError", ret);
                }
            }
        });
    }

    @Override
    protected void handleOnDestroy() {
        escuchandoActivo = false;
        if (speechRecognizer != null) {
            try { speechRecognizer.destroy(); } catch (Exception ignored) {}
            speechRecognizer = null;
        }
        super.handleOnDestroy();
    }
}