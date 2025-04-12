import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
} from 'firebase/firestore';

export default function ReportsPage() {
    const [reports, setReports] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        const q = query(
            collection(db, 'problem_reports'),
            orderBy('reportedAt', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setReports(data);
        });

        return () => unsub();
    }, []);

    useEffect(() => {
        let temp = [...reports];

        if (search.trim()) {
            temp = temp.filter((r) =>
                r.roomNumber.toString().includes(search.trim())
            );
        }

        if (filterStatus === 'resolved') {
            temp = temp.filter((r) => r.resolved);
        } else if (filterStatus === 'pending') {
            temp = temp.filter((r) => !r.resolved);
        }

        setFiltered(temp);
    }, [reports, search, filterStatus]);

    const toggleResolve = async (reportId, currentStatus) => {
        try {
            const ref = doc(db, 'problem_reports', reportId);
            await updateDoc(ref, {
                resolved: !currentStatus,
                resolvedAt: !currentStatus ? new Date() : null,
            });
        } catch (err) {
            alert('Error al actualizar el estado: ' + err.message);
        }
    };


    const editDescription = async (reportId, currentDescription) => {
        const newDesc = prompt('Editar descripción:', currentDescription);
        if (newDesc === null || newDesc.trim() === '') return;

        try {
            await updateDoc(doc(db, 'problem_reports', reportId), {
                description: newDesc.trim(),
            });
        } catch (err) {
            alert('Error al editar: ' + err.message);
        }
    };

    const deleteReport = async (reportId) => {
        const confirm = window.confirm('¿Seguro que deseas eliminar este reporte? Esta acción no se puede deshacer.');
        if (!confirm) return;

        try {
            await deleteDoc(doc(db, 'problem_reports', reportId));
        } catch (err) {
            alert('Error al eliminar: ' + err.message);
        }
    };

    const getColor = (desc) => {
        if (!desc) return 'border-gray-300';
        const d = desc.toLowerCase();
        if (d.includes('urgente') || d.includes('fuga') || d.includes('peligro') || d.includes('inundación')) return 'border-red-500';
        if (d.includes('no funciona') || d.includes('falla')) return 'border-yellow-400';
        if (d.includes('pintura') || d.includes('estético')) return 'border-gray-400';
        return 'border-gray-200';
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">📋 Reportes de Problemas</h1>

            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6 items-center">
                <input
                    type="text"
                    placeholder="Buscar por habitación..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border p-2 rounded w-52"
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border p-2 rounded"
                >
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="resolved">Resueltos</option>
                </select>
                <span className="text-sm text-gray-500">
                    Mostrando {filtered.length} reporte(s)
                </span>
            </div>

            {/* Reportes */}
            {filtered.length === 0 && (
                <p className="text-gray-500">No se encontraron reportes con los filtros actuales.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((report) => (
                    <div
                        key={report.id}
                        className={`bg-white shadow rounded p-4 border-l-4 ${getColor(report.description)}`}
                    >
                        <h2 className="text-lg font-semibold mb-1">
                            Habitación {report.roomNumber}
                        </h2>
                        <p className="text-sm text-gray-600 mb-1">
                            {report.description || 'Sin descripción'}
                        </p>
                        {report.employeeName && (
                            <p className="text-xs text-gray-400 mb-1">
                                Reportado por: {report.employeeName}
                            </p>
                        )}
                        {report.imageUrl && (
                            <img
                                src={report.imageUrl}
                                alt="Evidencia"
                                className="w-full h-48 object-cover rounded mb-2"
                            />
                        )}

                        <div className="flex flex-wrap gap-2 mt-2">
                            <button
                                className={`text-sm ${report.resolved
                                        ? 'bg-gray-100 hover:bg-gray-200'
                                        : 'bg-green-100 hover:bg-green-200'
                                    } px-3 py-1 rounded`}
                                onClick={() => toggleResolve(report.id, report.resolved)}
                            >
                                {report.resolved ? '❌ Marcar como NO resuelto' : '✅ Marcar como resuelto'}
                            </button>

                            <button
                                className="text-sm bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded"
                                onClick={() => editDescription(report.id, report.description)}
                            >
                                ✏️ Editar
                            </button>

                            <button
                                className="text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
                                onClick={() => deleteReport(report.id)}
                            >
                                🗑️ Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}