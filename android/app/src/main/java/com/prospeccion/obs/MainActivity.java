package com.prospeccion.obs;

import android.os.Bundle;
import android.webkit.WebStorage;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DictadoNativoPlugin.class);
        super.onCreate(savedInstanceState);

        try {
            WebView webView = this.getBridge().getWebView();
            if (webView != null) {
                // Limpieza agresiva de cachés nativos del WebView
                webView.clearCache(true);
                webView.clearHistory();
                WebStorage.getInstance().deleteAllData();
            }
        } catch (Exception e) {
            android.util.Log.w("PROSPECCION_OBS", "Error limpiando cache: " + e.getMessage());
        }
    }
}