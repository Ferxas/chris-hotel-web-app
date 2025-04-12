import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editedNumber, setEditedNumber] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newState, setNewState] = useState('SE');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(data);
    });

    return () => unsub();
  }, []);

  const createRoom = async () => {
    if (!newNumber.trim()) return alert('Ingresa un número válido');
    try {
      await addDoc(collection(db, 'rooms'), {
        number: newNumber.trim(),
        state: newState,
        lastCleaned: null,
        lastMaintenance: null,
        createdAt: Timestamp.now(),
      });
      setNewNumber('');
      setNewState('SE');
    } catch (err) {
      alert('Error al crear habitación: ' + err.message);
    }
  };

  const updateRoomState = async (id, newState) => {
    try {
      const roomRef = doc(db, 'rooms', id);
      await updateDoc(roomRef, { state: newState });
    } catch (err) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const saveEdit = async (roomId) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, { number: editedNumber });
      setEditingRoomId(null);
    } catch (err) {
      alert('Error al editar número: ' + err.message);
    }
  };

  const deleteRoom = async (roomId) => {
    const confirm = window.confirm('¿Eliminar esta habitación?');
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'rooms', roomId));
    } catch (err) {
      alert('Error al eliminar habitación: ' + err.message);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : timestamp;
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  const registerManual = async (roomId, type) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const field = type === 'clean' ? 'lastCleaned' : 'lastMaintenance';
      await updateDoc(roomRef, { [field]: Timestamp.now() });
    } catch (err) {
      alert('Error al registrar: ' + err.message);
    }
  };

  const startEditing = (room) => {
    setEditingRoomId(room.id);
    setEditedNumber(room.number);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🛏️ Gestión de Habitaciones</h1>

      {/* Formulario para nueva habitación */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-2">➕ Nueva habitación</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <input
            type="text"
            placeholder="Número de habitación"
            className="border p-2 rounded w-48"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
          />
          <select
            value={newState}
            onChange={(e) => setNewState(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="SE">SE (Servicio)</option>
            <option value="CO">CO (Check-out)</option>
            <option value="CLEAN">CLEAN</option>
          </select>
          <button
            onClick={createRoom}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Crear habitación
          </button>
        </div>
      </div>

      {/* Lista de habitaciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`p-4 rounded shadow bg-white border-l-4 ${
              room.state === 'SE'
                ? 'border-yellow-400'
                : room.state === 'CO'
                ? 'border-red-400'
                : room.state === 'CLEAN'
                ? 'border-green-400'
                : 'border-gray-300'
            }`}
          >
            {editingRoomId === room.id ? (
              <div className="mb-2">
                <input
                  type="text"
                  value={editedNumber}
                  onChange={(e) => setEditedNumber(e.target.value)}
                  className="border p-1 text-sm rounded w-full"
                />
                <button
                  className="mt-1 text-sm bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded"
                  onClick={() => saveEdit(room.id)}
                >
                  Guardar
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold">
                  Habitación {room.number}
                </h2>
                <button
                  className="text-xs text-blue-500 underline mb-2"
                  onClick={() => startEditing(room)}
                >
                  Editar número
                </button>
              </>
            )}

            <p className="text-sm text-gray-600 mb-1">Estado: {room.state}</p>
            <p className="text-xs text-gray-500">
              🧼 Última limpieza: {formatDate(room.lastCleaned)}
            </p>
            <p className="text-xs text-gray-500 mb-2">
              🧰 Último mantenimiento: {formatDate(room.lastMaintenance)}
            </p>

            <div className="space-x-2 mb-2">
              <button
                className="text-sm px-2 py-1 bg-green-100 hover:bg-green-200 rounded"
                onClick={() => updateRoomState(room.id, 'CLEAN')}
              >
                CLEAN
              </button>
              <button
                className="text-sm px-2 py-1 bg-yellow-100 hover:bg-yellow-200 rounded"
                onClick={() => updateRoomState(room.id, 'SE')}
              >
                SE
              </button>
              <button
                className="text-sm px-2 py-1 bg-red-100 hover:bg-red-200 rounded"
                onClick={() => updateRoomState(room.id, 'CO')}
              >
                CO
              </button>
            </div>

            {/* Botones para registrar manualmente */}
            <div className="space-x-2 mb-2">
              <button
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                onClick={() => registerManual(room.id, 'clean')}
              >
                Registrar limpieza
              </button>
              <button
                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                onClick={() => registerManual(room.id, 'maintenance')}
              >
                Registrar mantenimiento
              </button>
            </div>

            <button
              className="text-xs text-red-600 underline"
              onClick={() => deleteRoom(room.id)}
            >
              Eliminar habitación
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}