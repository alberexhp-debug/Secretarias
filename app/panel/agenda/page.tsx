"use client";

import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface Appointment {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  channel: string;
  status: string;
  notes: string;
  contact: { id: string; name: string } | null;
}

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-800 border-green-200",
  email: "bg-blue-100 text-blue-800 border-blue-200",
  phone: "bg-purple-100 text-purple-800 border-purple-200",
  manual: "bg-gray-100 text-gray-800 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No se presentó",
};

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [loading, setLoading] = useState(true);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [newAppt, setNewAppt] = useState({
    title: "", description: "", startTime: "", endTime: "", channel: "manual", notes: "",
  });

  useEffect(() => {
    loadAppointments();
  }, [currentDate]);

  async function loadAppointments() {
    setLoading(true);
    const params = new URLSearchParams({
      month: String(currentDate.getMonth() + 1),
      year: String(currentDate.getFullYear()),
    });
    const res = await fetch(`/api/panel/appointments?${params}`);
    const data = await res.json();
    setAppointments(data.appointments || []);
    setLoading(false);
  }

  async function createAppointment() {
    await fetch("/api/panel/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAppt),
    });
    setShowNewAppt(false);
    setNewAppt({ title: "", description: "", startTime: "", endTime: "", channel: "manual", notes: "" });
    loadAppointments();
  }

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const dayAppointments = selectedDay
    ? appointments.filter((a) => isSameDay(new Date(a.startTime), selectedDay))
    : [];

  const visibleAppointments = view === "list" ? appointments : dayAppointments;

  const daysWithAppts = new Set(
    appointments.map((a) => format(new Date(a.startTime), "yyyy-MM-dd"))
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
        <div className="flex gap-2">
          <button onClick={() => setView("calendar")} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === "calendar" ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}>
            📅 Calendario
          </button>
          <button onClick={() => setView("list")} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${view === "list" ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}>
            📋 Lista
          </button>
          <button onClick={() => setShowNewAppt(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            + Nueva cita
          </button>
        </div>
      </div>

      {view === "calendar" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 text-gray-400 hover:text-gray-600">←</button>
              <h2 className="font-semibold text-gray-900 capitalize">
                {format(currentDate, "MMMM yyyy", { locale: es })}
              </h2>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 text-gray-400 hover:text-gray-600">→</button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Day padding */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: (startOfMonth(currentDate).getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {monthDays.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const hasAppts = daysWithAppts.has(dateStr);
                const selected = selectedDay && isSameDay(day, selectedDay);
                const today = isToday(day);
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDay(day)}
                    className={`aspect-square flex flex-col items-center justify-center rounded-full text-sm relative ${
                      selected ? "bg-indigo-600 text-white" : today ? "bg-indigo-50 text-indigo-600 font-semibold" : isSameMonth(day, currentDate) ? "text-gray-700 hover:bg-gray-100" : "text-gray-300"
                    }`}
                  >
                    {format(day, "d")}
                    {hasAppts && !selected && (
                      <span className="absolute bottom-0.5 w-1 h-1 bg-indigo-400 rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day appointments */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              {selectedDay ? format(selectedDay, "EEEE d 'de' MMMM", { locale: es }) : "Selecciona un día"}
            </h3>
            {dayAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <div className="text-3xl mb-2">📅</div>
                <p>Sin citas este día</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayAppointments.map((appt) => <AppointmentCard key={appt.id} appt={appt} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Cargando...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <div className="text-3xl mb-2">📅</div>
              <p className="font-medium text-gray-600">Sin citas este mes</p>
            </div>
          ) : (
            appointments.map((appt) => <AppointmentCard key={appt.id} appt={appt} />)
          )}
        </div>
      )}

      {/* New appointment modal */}
      {showNewAppt && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Nueva cita</h3>
            <input
              placeholder="Título de la cita"
              value={newAppt.title}
              onChange={(e) => setNewAppt({ ...newAppt, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Inicio</label>
                <input
                  type="datetime-local"
                  value={newAppt.startTime}
                  onChange={(e) => setNewAppt({ ...newAppt, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fin</label>
                <input
                  type="datetime-local"
                  value={newAppt.endTime}
                  onChange={(e) => setNewAppt({ ...newAppt, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>
            </div>
            <textarea
              placeholder="Notas (opcional)..."
              value={newAppt.notes}
              onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNewAppt(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">
                Cancelar
              </button>
              <button onClick={createAppointment} disabled={!newAppt.title || !newAppt.startTime} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                Crear cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appt }: { appt: Appointment }) {
  return (
    <div className={`bg-white rounded-xl border p-4 ${CHANNEL_COLORS[appt.channel] || "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 truncate">{appt.title}</h4>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{STATUS_LABELS[appt.status]}</span>
          </div>
          {appt.contact && <p className="text-sm text-gray-500">{appt.contact.name}</p>}
          <p className="text-xs text-gray-400 mt-1">
            {format(new Date(appt.startTime), "HH:mm")} — {format(new Date(appt.endTime), "HH:mm")}
          </p>
        </div>
        <span className="text-xs text-gray-400">
          {format(new Date(appt.startTime), "d MMM", { locale: es })}
        </span>
      </div>
      {appt.notes && <p className="text-xs text-gray-400 mt-2 bg-gray-50 px-2 py-1 rounded-lg">{appt.notes}</p>}
    </div>
  );
}
