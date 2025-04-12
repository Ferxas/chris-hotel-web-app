import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  where,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function MaintenancePage() {
  const [rooms, setRooms] = useState([]);
  const [reports, setReports] = useState({});
  const [onlyWithReports, setOnlyWithReports] = useState(false);

  useEffect(() => {
    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(roomData);
    });

    const unsubReports = onSnapshot(
      query(collection(db, 'problem_reports'), where('resolved', '==', false)),
      (snapshot) => {
        const grouped = {};
        snapshot.docs.forEach((doc) => {
          const report = { id: doc.id, ...doc.data() };
          const roomKey = report.roomNumber;
          if (!grouped[roomKey]) grouped[roomKey] = [];
          grouped[roomKey].push(report);
        });
        setReports(grouped);
      }
    );

    return () => {
      unsubRooms();
      unsubReports();
    };
  }, []);

  const getPriorityColor = (desc) => {
    const d = desc.toLowerCase();
    if (d.includes('urgente') || d.includes('fuga') || d.includes('peligro') || d.includes('inundación')) return 'border-red-500';
    if (d.includes('no funciona') || d.includes('falla')) return 'border-yellow-400';
    if (d.includes('pintura') || d.includes('estético')) return 'border-gray-400';
    return 'border-gray-300';
  };

  const resolveReport = async (reportId, report) => {
    const comment = prompt('¿Comentario de resolución (opcional)?');
    const name = prompt('¿Nombre de quien resolvió?');

    try {
      const ref = doc(db, 'problem_reports', reportId);

      await updateDoc(ref, {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: name || '—',
        resolutionComment: comment || '',
      });

      // Nuevo: Guardar en historial de mantenimientos
      await addDoc(collection(db, 'maintenance_logs'), {
        roomNumber: report.roomNumber,
        description: report.description,
        imageUrl: report.imageUrl || null,
        resolvedBy: name || '—',
        comment: comment || '',
        resolvedAt: Timestamp.now(),
      });
    } catch (err) {
      alert('Error al resolver: ' + err.message);
    }
  };

  const exportReports = (type = 'csv') => {
    const allReports = [];

    Object.entries(reports).forEach(([room, list]) => {
      list.forEach((r) => {
        allReports.push({
          Habitación: room,
          Descripción: r.description,
          Empleado: r.employeeName || '—',
          Fecha: r.reportedAt?.seconds
            ? new Date(r.reportedAt.seconds * 1000).toLocaleString()
            : '—',
          Prioridad: getPriorityColor(r.description).replace('border-', '').toUpperCase(),
        });
      });
    });

    if (allReports.length === 0) return alert('No hay reportes activos para exportar');

    if (type === 'csv') {
      const csv = Papa.unparse(allReports);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `reportes_${Date.now()}.csv`);
    } else {
      const worksheet = XLSX.utils.json_to_sheet(allReports);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reportes');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `reportes_${Date.now()}.xlsx`);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">🔧 Panel de Mantenimiento</h1>

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={onlyWithReports}
            onChange={(e) => setOnlyWithReports(e.target.checked)}
          />
          Mostrar solo habitaciones con reportes
        </label>

        <button
          onClick={() => exportReports('csv')}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📥 Exportar CSV
        </button>
        <button
          onClick={() => exportReports('excel')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          📊 Exportar Excel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms
          .filter((r) => !onlyWithReports || reports[r.number])
          .map((room) => {
            const roomReports = reports[room.number] || [];
            const priority = roomReports[0]?.description
              ? getPriorityColor(roomReports[0].description)
              : 'border-gray-300';

            return (
              <div
                key={room.id}
                className={`bg-white border-l-4 ${priority} shadow p-4 rounded`}
              >
                <h2 className="text-lg font-semibold mb-1">Hab. {room.number}</h2>

                {roomReports.length === 0 ? (
                  <p className="text-sm text-gray-500">Sin reportes</p>
                ) : (
                  roomReports.map((report) => (
                    <div
                      key={report.id}
                      className="mb-4 border-t pt-2 text-sm text-gray-700"
                    >
                      <p>{report.description}</p>
                      {report.imageUrl && (
                        <img
                          src={report.imageUrl}
                          alt="Problema"
                          className="w-full h-40 object-cover rounded my-2"
                        />
                      )}
                      <button
                        onClick={() => resolveReport(report.id, report)}
                        className="text-xs bg-green-100 hover:bg-green-200 px-2 py-1 rounded"
                      >
                        Marcar como resuelto
                      </button>
                    </div>
                  ))
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}