const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();
const db = admin.firestore();

exports.sendPushOnMessage = functions.firestore
  .document('device_tokens/{deviceId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (!after.customMessage || before.customMessage?.sentAt?.seconds === after.customMessage?.sentAt?.seconds) {
      return null;
    }

    const token = after.token;
    const msg = after.customMessage.text;

    if (!token || !msg) return null;

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: token,
          sound: 'default',
          title: '📩 Nuevo mensaje',
          body: msg,
        }),
      });

      console.log(`✅ Notificación enviada a ${context.params.deviceId}`);
    } catch (err) {
      console.error('❌ Error enviando notificación:', err.message);
    }

    return null;
  });