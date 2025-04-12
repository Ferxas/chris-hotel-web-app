import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

export default function Dashboard() {
  const [roomCount, setRoomCount] = useState(0);
  const [cleanCount, setCleanCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);

  useEffect(() => {
    const unsubRooms = onSnapshot(collection(db, 'rooms'), snapshot => {
      const rooms = snapshot.docs.map(doc => doc.data());
      setRoomCount(rooms.length);
      setCleanCount(rooms.filter(r => r.state === 'CLEAN').length);
      setServiceCount(rooms.filter(r => r.state === 'SE' || r.state === 'CO').length);
    });

    const unsubReports = onSnapshot(
      query(collection(db, 'problem_reports'), where('resolved', '==', false)),
      snapshot => setPendingReports(snapshot.size)
    );

    return () => {
      unsubRooms();
      unsubReports();
    };
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Panel general del hotel</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Habitaciones" value={roomCount} />
        <Card title="En Limpieza" value={serviceCount} />
        <Card title="Limpias" value={cleanCount} />
        <Card title="Reportes Pendientes" value={pendingReports} color="text-red-600" />
      </div>
    </div>
  );
}

function Card({ title, value, color = 'text-blue-700' }) {
  return (
    <div className="bg-white shadow rounded p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}