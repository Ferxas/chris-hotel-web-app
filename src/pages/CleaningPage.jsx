import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function CleaningPage() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'cleaning_logs'), orderBy('startedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(data);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    let filtered = [...logs];

    if (roomSearch.trim()) {
      filtered = filtered.filter((log) =>
        log.roomNumber.toString().includes(roomSearch.trim())
      );
    }

    if (employeeSearch.trim()) {
      filtered = filtered.filter((log) =>
        (log.employeeName || '').toLowerCase().includes(employeeSearch.trim().toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, roomSearch, employeeSearch]);

  const formatDate = (ts) => {
    if (!ts || !ts.seconds) return '—';
    return format(new Date(ts.seconds * 1000), "dd MMM yyyy - HH:mm", { locale: es });
  };

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return alert('No hay datos para exportar');

    const data = filteredLogs.map(log => ({
      Habitación: log.roomNumber,
      Empleado: log.employeeName || '—',
      Inicio: formatDate(log.startedAt),
      Fin: formatDate(log.endedAt),
      Duración: `${log.durationMinutes} min`,
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `limpiezas_${Date.now()}.csv`);
  };

  const exportToExcel = () => {
    if (filteredLogs.length === 0) return alert('No hay datos para exportar');

    const data = filteredLogs.map(log => ({
      Habitación: log.roomNumber,
      Empleado: log.employeeName || '—',
      Inicio: formatDate(log.startedAt),
      Fin: formatDate(log.endedAt),
      Duración: `${log.durationMinutes} min`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Limpiezas");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `limpiezas_${Date.now()}.xlsx`);
  };

  const editCleaning = async (log) => {
    const name = prompt('Editar nombre del empleado:', log.employeeName || '');
    const duration = prompt('Editar duración (minutos):', log.durationMinutes);

    if (!name && !duration) return;

    try {
      await updateDoc(doc(db, 'cleaning_logs', log.id), {
        employeeName: name?.trim() || null,
        durationMinutes: parseInt(duration) || log.durationMinutes,
      });
    } catch (err) {
      alert('Error al editar: ' + err.message);
    }
  };

  const deleteCleaning = async (logId) => {
    const confirm = window.confirm('¿Seguro que deseas eliminar esta limpieza?');
    if (!confirm) return;

    try {
      await deleteDoc(doc(db, 'cleaning_logs', logId));
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🧽 Historial de Limpiezas</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Buscar por habitación"
          value={roomSearch}
          onChange={(e) => setRoomSearch(e.target.value)}
          className="border p-2 rounded w-52"
        />
        <input
          type="text"
          placeholder="Buscar por empleado"
          value={employeeSearch}
          onChange={(e) => setEmployeeSearch(e.target.value)}
          className="border p-2 rounded w-52"
        />
        <span className="text-sm text-gray-500">
          Mostrando {filteredLogs.length} limpieza(s)
        </span>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📥 Exportar CSV
        </button>
        <button
          onClick={exportToExcel}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          📊 Exportar Excel
        </button>
      </div>

      {filteredLogs.length === 0 && (
        <p className="text-gray-500">No se encontraron limpiezas con los filtros actuales.</p>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100 text-left text-sm">
              <th className="p-3">Hab.</th>
              <th className="p-3">Empleado</th>
              <th className="p-3">Inicio</th>
              <th className="p-3">Fin</th>
              <th className="p-3">Duración</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="p-3 font-semibold">{log.roomNumber}</td>
                <td className="p-3">{log.employeeName || '—'}</td>
                <td className="p-3">{formatDate(log.startedAt)}</td>
                <td className="p-3">{formatDate(log.endedAt)}</td>
                <td className="p-3">{log.durationMinutes} min</td>
                <td className="p-3 flex gap-2">
                  <button
                    className="text-xs bg-yellow-100 hover:bg-yellow-200 px-2 py-1 rounded"
                    onClick={() => editCleaning(log)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
                    onClick={() => deleteCleaning(log.id)}
                  >
                    🗑️ Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}