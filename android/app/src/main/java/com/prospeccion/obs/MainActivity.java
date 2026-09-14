package com.prospeccion.obs;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DictadoNativoPlugin.class);
        super.onCreate(savedInstanceState);
    }
}