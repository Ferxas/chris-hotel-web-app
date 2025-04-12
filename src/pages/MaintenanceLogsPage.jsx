import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function MaintenanceLogsPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'maintenance_logs'), orderBy('resolvedAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLogs(data);
    });

    return () => unsub();
  }, []);

  const formatDate = (ts) => {
    if (!ts || !ts.seconds) return '—';
    return format(new Date(ts.seconds * 1000), "dd MMM yyyy - HH:mm", { locale: es });
  };

  const exportLogs = (type = 'csv') => {
    if (logs.length === 0) return alert('No hay datos para exportar');

    const data = logs.map(log => ({
      Habitación: log.roomNumber,
      Descripción: log.description,
      ResueltoPor: log.resolvedBy || '—',
      Comentario: log.comment || '',
      Fecha: formatDate(log.resolvedAt),
    }));

    if (type === 'csv') {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `historial_mantenimientos_${Date.now()}.csv`);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Historial');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `historial_mantenimientos_${Date.now()}.xlsx`);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">📘 Historial de Mantenimientos</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => exportLogs('csv')}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📥 Exportar CSV
        </button>
        <button
          onClick={() => exportLogs('excel')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          📊 Exportar Excel
        </button>
      </div>

      {logs.length === 0 ? (
        <p className="text-gray-500">No hay mantenimientos registrados aún.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-white shadow rounded p-4 border-l-4 border-gray-400"
            >
              <h2 className="text-lg font-semibold">Hab. {log.roomNumber}</h2>
              <p className="text-sm text-gray-600 mb-1">{log.description}</p>
              <p className="text-xs text-gray-500 mb-1">
                Resuelto por: {log.resolvedBy || '—'}
              </p>
              {log.comment && (
                <p className="text-xs italic text-gray-500 mb-1">
                  Comentario: {log.comment}
                </p>
              )}
              <p className="text-xs text-gray-500 mb-2">
                Fecha: {formatDate(log.resolvedAt)}
              </p>
              {log.imageUrl && (
                <img
                  src={log.imageUrl}
                  alt="Evidencia"
                  className="w-full h-40 object-cover rounded"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}