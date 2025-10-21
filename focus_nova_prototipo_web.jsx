import React, { useState, useEffect, useRef } from "react";

// FocusNova - Single-file React component prototype
// - Tailwind classes used for styling
// - Modes: Pomodoro (Bloques de Enfoque), Misión (Gamificado), Entorno Limpio, Mentor (IA Coach)
// - LocalStorage persistence for tasks and stats

export default function FocusNova() {
  const MODES = [
    { id: "pomodoro", name: "Bloques de Enfoque", color: "bg-red-500" },
    { id: "mission", name: "Misión del Día", color: "bg-green-500" },
    { id: "clean", name: "Entorno Limpio", color: "bg-blue-500" },
    { id: "mentor", name: "Mentor Personal", color: "bg-purple-500" },
  ];

  // App state
  const [mode, setMode] = useState(() => localStorage.getItem("fn_mode") || "pomodoro");
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem("fn_tasks") || "[]"));
  const [taskText, setTaskText] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(50);
  const [secondsLeft, setSecondsLeft] = useState(pomodoroMinutes * 60);
  const [running, setRunning] = useState(false);
  const [points, setPoints] = useState(() => Number(localStorage.getItem("fn_points") || 0));
  const [stats, setStats] = useState(() => JSON.parse(localStorage.getItem("fn_stats") || "{}"));
  const [mentorMessages, setMentorMessages] = useState([
    { id: 1, from: "mentor", text: "Buen día, Diego 👋 ¿Qué modalidad querés usar hoy?" },
  ]);
  const timerRef = useRef(null);

  // Helpers
  useEffect(() => {
    localStorage.setItem("fn_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("fn_mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("fn_points", String(points));
  }, [points]);

  useEffect(() => {
    localStorage.setItem("fn_stats", JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    setSecondsLeft(pomodoroMinutes * 60);
  }, [pomodoroMinutes]);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            setRunning(false);
            onTimerComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function addTask() {
    if (!taskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: taskText.trim(),
      done: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((t) => [newTask, ...t]);
    setTaskText("");
  }

  function toggleTaskDone(id) {
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
    const task = tasks.find((x) => x.id === id);
    if (task && !task.done) {
      setPoints((p) => p + 10);
      setStats((s) => {
        const today = new Date().toISOString().slice(0, 10);
        return { ...s, [today]: (s[today] || 0) + 1 };
      });
    }
  }

  function removeTask(id) {
    setTasks((t) => t.filter((x) => x.id !== id));
  }

  function startTimer() {
    if (secondsLeft <= 0) setSecondsLeft(pomodoroMinutes * 60);
    setRunning(true);
  }
  function pauseTimer() {
    clearInterval(timerRef.current);
    setRunning(false);
  }
  function resetTimer() {
    clearInterval(timerRef.current);
    setRunning(false);
    setSecondsLeft(pomodoroMinutes * 60);
  }

  function onTimerComplete() {
    // award points if a task was selected and we're in pomodoro mode
    if (mode === "pomodoro" && selectedTaskId) {
      setPoints((p) => p + 15);
      setTasks((t) => t.map((x) => (x.id === selectedTaskId ? { ...x, done: true } : x)));
    }
    // quick notification (visual)
    setMentorMessages((m) => [
      ...m,
      { id: Date.now(), from: "system", text: "Temporizador completado ✅. Tomá 10 minutos de descanso." },
    ]);
  }

  // Mentor chat quick reply simulation
  function mentorAsk(question) {
    const userMsg = { id: Date.now() + "u", from: "user", text: question };
    setMentorMessages((m) => [...m, userMsg]);
    // simple canned replies to simulate coach
    setTimeout(() => {
      const reply = {
        id: Date.now() + "m",
        from: "mentor",
        text:
          question.toLowerCase().includes("distrag") || question.toLowerCase().includes("procrast")
            ? "Tranquilo. Simplifica: elegí UNA tarea y trabajala 25 minutos sin interrupciones. Yo te aviso cuando termine."
            : "Perfecto. ¿Querés que arme un bloque de 50 minutos para esa tarea?",
      };
      setMentorMessages((m) => [...m, reply]);
    }, 800);
  }

  // Small UI helpers
  function formatTime(sec) {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // Quick switch when entering clean mode
  useEffect(() => {
    if (mode === "clean") {
      // auto-select first incomplete task
      const first = tasks.find((t) => !t.done);
      if (first) setSelectedTaskId(first.id);
    }
  }, [mode, tasks]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">FocusNova</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Elegí la modalidad y empezá el día con foco.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 dark:text-gray-300">Puntos: <span className="font-semibold">{points}</span></div>
            <div className="text-xs text-gray-500">Tema</div>
            <button
              onClick={() => document.documentElement.classList.toggle("dark")}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-800"
            >
              ☾
            </button>
          </div>
        </header>

        {/* Mode selector */}
        <nav className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`p-3 rounded-lg flex flex-col items-start gap-1 shadow-sm hover:shadow-md transition ${
                mode === m.id ? "ring-2 ring-offset-2 ring-indigo-400" : "bg-white dark:bg-gray-800"
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${m.color}`}></div>
              <div className="text-sm font-medium">{m.name}</div>
              <div className="text-xs text-gray-400">{m.id === "pomodoro" ? "Temporizador" : m.id === "mission" ? "Gamificado" : m.id === "clean" ? "1 tarea" : "Coach"}</div>
            </button>
          ))}
        </nav>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: tasks */}
          <section className="col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex gap-3 mb-3">
              <input
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className="flex-1 p-2 rounded border border-gray-200 dark:border-gray-700 bg-transparent"
                placeholder="Agregar tarea... (Ej: Terminar propuesta para cliente)"
              />
              <button onClick={addTask} className="px-4 py-2 rounded bg-indigo-600 text-white">Agregar</button>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold">Tareas</h3>
              <p className="text-sm text-gray-500">Mantené la lista corta y priorizá 3 por día.</p>
            </div>

            <ul className="space-y-2">
              {tasks.length === 0 && <li className="text-sm text-gray-500">No hay tareas aún — agregá la primera.</li>}
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between p-2 rounded border border-transparent hover:border-gray-200">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTaskDone(t.id)} />
                    <div>
                      <div className={`font-medium ${t.done ? "line-through text-gray-400" : ""}`}>{t.text}</div>
                      <div className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedTaskId(t.id)}
                      className={`px-2 py-1 text-xs rounded ${selectedTaskId === t.id ? "bg-indigo-100" : "bg-gray-100"}`}
                    >
                      Seleccionar
                    </button>
                    <button onClick={() => removeTask(t.id)} className="px-2 py-1 text-xs rounded bg-red-100">Borrar</button>
                  </div>
                </li>
              ))}
            </ul>

            {/* Mode specific main area */}
            <div className="mt-6">
              {mode === "pomodoro" && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Bloques de Enfoque</h3>
                  <p className="text-sm text-gray-500 mb-3">Elegí duración y tarea, presioná iniciar y trabajá sin interrupciones.</p>

                  <div className="flex gap-3 items-center mb-3">
                    <label className="text-sm">Duración:</label>
                    <select value={pomodoroMinutes} onChange={(e) => setPomodoroMinutes(Number(e.target.value))} className="p-2 rounded bg-gray-100">
                      <option value={25}>25 min</option>
                      <option value={50}>50 min</option>
                      <option value={90}>90 min</option>
                    </select>

                    <div className="text-sm">Tarea seleccionada: <span className="font-semibold">{tasks.find(x=>x.id===selectedTaskId)?.text || '—'}</span></div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-mono">{formatTime(secondsLeft)}</div>
                    <div className="flex flex-col gap-2">
                      {!running && <button onClick={startTimer} className="px-4 py-2 rounded bg-green-500 text-white">Iniciar</button>}
                      {running && <button onClick={pauseTimer} className="px-4 py-2 rounded bg-yellow-400">Pausar</button>}
                      <button onClick={resetTimer} className="px-4 py-2 rounded bg-gray-200">Reiniciar</button>
                    </div>
                  </div>
                </div>
              )}

              {mode === "mission" && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Misión del Día</h3>
                  <p className="text-sm text-gray-500 mb-3">Transformá tareas en misiones y ganá puntos al completar.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tasks.map((t) => (
                      <div key={t.id} className="p-3 rounded border bg-white dark:bg-gray-700 flex justify-between items-center">
                        <div>
                          <div className={`font-medium ${t.done ? "line-through text-gray-400" : ""}`}>{t.text}</div>
                          <div className="text-xs text-gray-400">{t.done ? "Completada" : "En espera"}</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => toggleTaskDone(t.id)} className="px-3 py-1 rounded bg-indigo-600 text-white text-sm">Completar +10</button>
                          <div className="text-xs text-gray-400">Pts: 10</div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {mode === "clean" && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Entorno Limpio</h3>
                  <p className="text-sm text-gray-500 mb-3">Solo una tarea visible a la vez — hacela y listo.</p>

                  <div className="p-6 rounded bg-gray-50 dark:bg-gray-800 text-center">
                    {selectedTaskId ? (
                      <>
                        <div className="text-lg font-medium mb-2">{tasks.find(x=>x.id===selectedTaskId)?.text}</div>
                        <button onClick={() => toggleTaskDone(selectedTaskId)} className="px-4 py-2 rounded bg-green-500 text-white mr-2">Completada</button>
                        <button onClick={() => {
                          // go to next incomplete task
                          const next = tasks.find(x=>!x.done && x.id!==selectedTaskId);
                          if(next) setSelectedTaskId(next.id);
                        }} className="px-4 py-2 rounded bg-gray-200">Siguiente</button>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400">No hay tareas seleccionadas.</div>
                    )}
                  </div>
                </div>
              )}

              {mode === "mentor" && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Mentor Personal</h3>
                  <p className="text-sm text-gray-500 mb-3">Un coach amigable que te da empujones y recordatorios suaves.</p>

                  <div className="border rounded p-3 bg-white dark:bg-gray-700">
                    <div className="h-48 overflow-auto mb-3 space-y-2">
                      {mentorMessages.map((m) => (
                        <div key={m.id} className={`p-2 rounded ${m.from === "mentor" ? "bg-purple-50 dark:bg-purple-900" : "bg-gray-100 dark:bg-gray-800"}`}>
                          <div className="text-sm">{m.text}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input id="mentor_input" className="flex-1 p-2 rounded bg-gray-100" placeholder="Escribí al mentor... (Ej: Me distraigo)" onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                          mentorAsk(e.target.value);
                          e.target.value = '';
                        }
                      }} />
                      <button onClick={() => {
                        const input = document.getElementById('mentor_input');
                        if(input && input.value.trim()) { mentorAsk(input.value.trim()); input.value = '' }
                      }} className="px-3 py-2 rounded bg-indigo-600 text-white">Enviar</button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </section>

          {/* Right column: quick stats + tips */}
          <aside className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col gap-4">
            <div>
              <h4 className="font-semibold">Resumen rápido</h4>
              <div className="text-sm text-gray-500">Tareas: {tasks.length} • Completadas: {tasks.filter(t=>t.done).length}</div>
            </div>

            <div>
              <h4 className="font-semibold">Consejo</h4>
              <div className="text-sm text-gray-500">Si te cuesta terminar una tarea, reducíla a 15-25 minutos y arrancá. El momentum hará el resto.</div>
            </div>

            <div>
              <h4 className="font-semibold">Estadísticas</h4>
              <div className="text-sm text-gray-500">{Object.keys(stats).length === 0 ? 'Sin registros aún' : Object.entries(stats).map(([d,c]) => (<div key={d} className="text-xs">{d}: {c} tareas</div>))}</div>
            </div>

            <div className="mt-2">
              <button onClick={() => { localStorage.clear(); setTasks([]); setPoints(0); setStats({}); setMentorMessages([{ id: 1, from: 'mentor', text: 'Buen día, Diego 👋 ¿Qué modalidad querés usar hoy?' }]); }} className="w-full px-3 py-2 rounded bg-red-100 text-red-700">Reset prototipo</button>
            </div>
          </aside>
        </main>

        <footer className="mt-6 text-center text-xs text-gray-400">Prototipo FocusNova • Hecho para Diego</footer>
      </div>
    </div>
  );
}
