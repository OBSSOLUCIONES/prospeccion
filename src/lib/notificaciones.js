// src/lib/notificaciones.js
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const esNativo = Capacitor.isNativePlatform();
const CANAL_ID = 'obs-recordatorios-obras';

export async function inicializarNotificaciones() {
  if (!esNativo) return false;
  try {
    await LocalNotifications.createChannel({
      id: CANAL_ID,
      name: 'Recordatorios de Obras',
      description: 'Avisos de obras frías y visitas programadas',
      importance: 4,
      visibility: 1,
      vibration: true
    });

    const permiso = await LocalNotifications.requestPermissions();
    return permiso.display === 'granted';
  } catch (err) {
    console.warn('Error inicializando notificaciones:', err);
    return false;
  }
}

export async function programarRecordatorioObrasFrias(obrasFrias) {
  if (!esNativo) return false;
  try {
    const pendientes = await LocalNotifications.getPending();
    if (pendientes.notifications.length > 0) {
      await LocalNotifications.cancel(pendientes);
    }

    if (!obrasFrias || obrasFrias.length === 0) return true;

    // Programar para mañana a las 9:00 AM
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    manana.setHours(9, 0, 0, 0);

    const primerNombre = obrasFrias[0]?.nombre || 'una obra';
    const extra = obrasFrias.length > 1 ? ` y ${obrasFrias.length - 1} más` : '';

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1001,
          title: `❄️ ${obrasFrias.length} obra${obrasFrias.length > 1 ? 's' : ''} fría${obrasFrias.length > 1 ? 's' : ''} por visitar`,
          body: `Sin supervisar más de 12 días: ${primerNombre}${extra}`,
          channelId: CANAL_ID,
          schedule: { at: manana },
          sound: null,
          smallIcon: 'ic_stat_icon_config_sample'
        }
      ]
    });

    return true;
  } catch (err) {
    console.warn('Error programando recordatorio:', err);
    return false;
  }
}

export async function cancelarRecordatorios() {
  if (!esNativo) return;
  try {
    const pendientes = await LocalNotifications.getPending();
    if (pendientes.notifications.length > 0) {
      await LocalNotifications.cancel(pendientes);
    }
  } catch (err) {
    console.warn('Error cancelando recordatorios:', err);
  }
}