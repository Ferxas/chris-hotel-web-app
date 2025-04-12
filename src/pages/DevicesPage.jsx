import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [editing, setEditing] = useState({});
  const [messages, setMessages] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'device_tokens'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDevices(data);
    });

    return () => unsub();
  }, []);

  const handleChange = (id, field, value) => {
    setEditing(prev => ({
      ...prev,
      [id]: {
        ...(devices.find(d => d.id === id) || {}),
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleMessageChange = (id, value) => {
    setMessages(prev => ({ ...prev, [id]: value }));
  };

  const sendMessage = async (id) => {
    const message = messages[id]?.trim();
    if (!message) return alert('⚠️ El mensaje no puede estar vacío');

    try {
      await updateDoc(doc(db, 'device_tokens', id), {
        customMessage: {
          text: message,
          sentAt: new Date(),
        },
      });

      alert('✅ Mensaje enviado al dispositivo');
      setMessages(prev => ({ ...prev, [id]: '' }));
    } catch (err) {
      alert('Error al enviar mensaje: ' + err.message);
    }
  };

  const saveChanges = async (id) => {
    if (!editing[id]) return;
    try {
      const ref = doc(db, 'device_tokens', id);
      await updateDoc(ref, editing[id]);
      alert('✅ Cambios guardados correctamente');
      setEditing(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      alert('Error al guardar cambios: ' + err.message);
    }
  };

  const formatDate = (ts) => {
    if (!ts?.seconds) return '—';
    return format(new Date(ts.seconds * 1000), "dd MMM yyyy - HH:mm", { locale: es });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">📲 Dispositivos Conectados</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded">
          <thead className="bg-gray-100 text-sm">
            <tr>
              <th className="p-3 text-left">Empleado</th>
              <th className="p-3 text-left">Token</th>
              <th className="p-3 text-left">Disponible</th>
              <th className="p-3 text-left">Registrado</th>
              <th className="p-3 text-left">Mensaje</th>
              <th className="p-3 text-left">Último mensaje</th>
              <th className="p-3 text-left">Acción</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => {
              const isEditing = editing[device.id];
              const edited = editing[device.id] || {};
              const lastMessageDate = device.customMessage?.sentAt;

              return (
                <tr key={device.id} className="border-t align-top">
                  <td className="p-3">
                    <input
                      type="text"
                      value={isEditing ? edited.name : device.name || ''}
                      onChange={(e) => handleChange(device.id, 'name', e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-40"
                    />
                  </td>
                  <td className="p-3 text-xs break-words">{device.token}</td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={
                        isEditing
                          ? edited.available ?? device.available
                          : device.available ?? true
                      }
                      onChange={(e) =>
                        handleChange(device.id, 'available', e.target.checked)
                      }
                    />
                  </td>
                  <td className="p-3 text-sm">{formatDate(device.createdAt)}</td>
                  <td className="p-3">
                    <textarea
                      rows={2}
                      placeholder="Escribe un mensaje"
                      value={messages[device.id] || ''}
                      onChange={(e) => handleMessageChange(device.id, e.target.value)}
                      className="border rounded p-2 text-sm w-full mb-1"
                    />
                    <button
                      onClick={() => sendMessage(device.id)}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Enviar mensaje
                    </button>
                  </td>
                  <td className="p-3 text-xs text-gray-600">
                    {lastMessageDate ? formatDate(lastMessageDate) : '—'}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => saveChanges(device.id)}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}