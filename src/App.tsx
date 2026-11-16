import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Pill,
  Calendar,
  ClipboardList,
  Mail,
  Plus,
  Check,
  Edit2,
  Trash2,
  Download,
  Clock,
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  FlaskConical,
  Stethoscope,
  Send,
  RotateCcw,
  X,
  ChevronRight,
  Info,
  Sparkles,
  HeartPulse,
  MapPin,
  LogOut
} from 'lucide-react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

// --- INITIAL SAMPLE DATA ---
const getRelativeDate = (daysOffset = 0, hours = 8, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
};

const TODAY_STR = new Date().toISOString().slice(0, 10);

const INITIAL_MEDICATIONS = [
  {
    id: 'med-1',
    name: 'Metformin XR',
    dosage: '500 mg',
    timing: 'Morning',
    instructions: 'Take immediately after breakfast with a full glass of water'
  },
  {
    id: 'med-2',
    name: 'Empagliflozin (Jardiance)',
    dosage: '10 mg',
    timing: 'Morning',
    instructions: 'Take once daily in the morning, with or without food'
  },
  {
    id: 'med-3',
    name: 'Sitagliptin',
    dosage: '50 mg',
    timing: 'Afternoon',
    instructions: 'Take 15 minutes before lunch'
  },
  {
    id: 'med-4',
    name: 'Atorvastatin',
    dosage: '20 mg',
    timing: 'Night',
    instructions: 'Take after dinner before bedtime'
  }
];

const INITIAL_SUGAR_LOGS = [
  {
    id: 'bs-1',
    value: 5.8,
    unit: 'mmol/L',
    type: 'Fasting',
    recordedAt: getRelativeDate(0, 7, 30),
    notes: 'Woke up feeling rested, light walk yesterday'
  },
  {
    id: 'bs-2',
    value: 7.9,
    unit: 'mmol/L',
    type: '2-Hours Post-Meal',
    recordedAt: getRelativeDate(0, 11, 15),
    notes: 'After oats, boiled egg, and green tea'
  },
  {
    id: 'bs-3',
    value: 112,
    unit: 'mg/dL',
    type: 'Before Meal',
    recordedAt: getRelativeDate(-1, 13, 0),
    notes: 'Before lunch'
  },
  {
    id: 'bs-4',
    value: 8.6,
    unit: 'mmol/L',
    type: '2-Hours Post-Meal',
    recordedAt: getRelativeDate(-2, 21, 0),
    notes: 'Had brown rice and grilled fish for dinner'
  },
  {
    id: 'bs-5',
    value: 6.1,
    unit: 'mmol/L',
    type: 'Fasting',
    recordedAt: getRelativeDate(-3, 7, 45),
    notes: 'Normal morning reading'
  },
  {
    id: 'bs-6',
    value: 9.8,
    unit: 'mmol/L',
    type: '2-Hours Post-Meal',
    recordedAt: getRelativeDate(-5, 15, 20),
    notes: 'Slightly high after restaurant lunch'
  },
  {
    id: 'bs-7',
    value: 5.4,
    unit: 'mmol/L',
    type: 'Fasting',
    recordedAt: getRelativeDate(-6, 7, 20),
    notes: 'Great fasting level'
  },
  {
    id: 'bs-8',
    value: 6.4,
    unit: 'mmol/L',
    type: 'Bedtime',
    recordedAt: getRelativeDate(-9, 22, 30),
    notes: 'Steady before sleep'
  }
];

const INITIAL_ACTION_ITEMS = [
  {
    id: 'act-1',
    category: 'med_to_buy',
    title: 'Accu-Chek Active Test Strips (Box of 50)',
    details: '2 boxes needed — running low (only 8 strips left)',
    targetDate: getRelativeDate(1).slice(0, 10),
    completed: false
  },
  {
    id: 'act-2',
    category: 'med_to_buy',
    title: 'Metformin XR 500mg (1 Month Strip)',
    details: '30 tablets for next month',
    targetDate: getRelativeDate(3).slice(0, 10),
    completed: false
  },
  {
    id: 'act-3',
    category: 'lab_test',
    title: 'HbA1c (Glycated Hemoglobin) & Fasting Lipid Profile',
    details: 'Strict 10-12 hours overnight fasting required. Water is allowed.',
    targetDate: getRelativeDate(4).slice(0, 10),
    completed: false
  },
  {
    id: 'act-4',
    category: 'lab_test',
    title: 'Serum Creatinine & Urine Microalbumin',
    details: 'Routine kidney function screening prior to endo visit',
    targetDate: getRelativeDate(4).slice(0, 10),
    completed: false
  }
];

const INITIAL_APPOINTMENTS = [
  {
    id: 'apt-1',
    doctorName: 'Dr. Farhana Rahman',
    specialty: 'Endocrinologist & Diabetologist',
    location: 'United Hospital, Gulshan, Dhaka (Room 402)',
    dateTime: getRelativeDate(6, 17, 30),
    notes: 'Bring 30-day blood sugar log CSV & latest HbA1c report. Ask about afternoon Sitagliptin timing.'
  },
  {
    id: 'apt-2',
    doctorName: 'Dr. Tanvir Ahmed',
    specialty: 'Ophthalmologist (Retina Check)',
    location: 'Bangladesh Eye Hospital, Dhanmondi',
    dateTime: getRelativeDate(18, 11, 0),
    notes: 'Annual diabetic dilated eye exam — arrange ride home.'
  }
];

const getInitialSettings = (userEmail?: string) => ({
  email: userEmail || 'patient.care@example.com',
  reminderTime: '08:00',
  timezone: 'Asia/Dhaka',
  enableDailyEmail: true,
  includeMeds: true,
  includeSugarPrompt: true,
  includeBuyList: true,
  includeLabTests: true,
  includeAppointments: true
});

// --- HELPER FUNCTIONS ---
const toMmol = (val: number | string, unit: string) =>
  unit === 'mmol/L' ? Number(val) : Number((Number(val) / 18.0182).toFixed(1));
const toMgdl = (val: number | string, unit: string) =>
  unit === 'mg/dL' ? Math.round(Number(val)) : Math.round(Number(val) * 18.0182);

const getGlucoseStatus = (value: number | string, unit: string, type: string) => {
  const mmol = toMmol(value, unit);
  if (mmol < 3.9) {
    return {
      label: 'Low (Hypo)',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      dot: 'bg-amber-500'
    };
  }
  const isPostMeal = type === '2-Hours Post-Meal' || type === 'Random';
  const highThreshold = isPostMeal ? 7.8 : 6.1;
  const elevatedThreshold = isPostMeal ? 10.0 : 7.0;

  if (mmol <= highThreshold) {
    return {
      label: 'In Target',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500'
    };
  }
  if (mmol <= elevatedThreshold) {
    return {
      label: 'Slightly Elevated',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      dot: 'bg-orange-500'
    };
  }
  return {
    label: 'High (Hyper)',
    color: 'bg-rose-100 text-rose-800 border-rose-200',
    dot: 'bg-rose-500'
  };
};

const formatDateTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatShortDate = (dateStr: string) => {
  if (!dateStr) return 'No target date';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// --- SVG TREND CHART COMPONENT ---
const GlucoseTrendChart = ({
  logs,
  displayUnit,
  daysRange
}: {
  logs: any[];
  displayUnit: string;
  daysRange: number;
}) => {
  const filteredLogs = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysRange);
    return [...logs]
      .filter((log) => new Date(log.recordedAt) >= cutoff)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  }, [logs, daysRange]);

  if (filteredLogs.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
        <Activity className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No blood sugar readings recorded in the last {daysRange} days.</p>
      </div>
    );
  }

  const values = filteredLogs.map((l) =>
    displayUnit === 'mmol/L' ? toMmol(l.value, l.unit) : toMgdl(l.value, l.unit)
  );

  const minTarget = displayUnit === 'mmol/L' ? 4.0 : 72;
  const maxTarget = displayUnit === 'mmol/L' ? 7.8 : 140;

  const rawMin = Math.min(...values, minTarget);
  const rawMax = Math.max(...values, maxTarget);
  const padding = (rawMax - rawMin) * 0.2 || (displayUnit === 'mmol/L' ? 1.5 : 25);
  const yMin = Math.max(0, rawMin - padding);
  const yMax = rawMax + padding;

  const width = 760;
  const height = 230;
  const padLeft = 46;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 34;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getX = (index: number) => {
    if (filteredLogs.length === 1) return padLeft + chartW / 2;
    return padLeft + (index / (filteredLogs.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    const ratio = (val - yMin) / (yMax - yMin || 1);
    return padTop + chartH - ratio * chartH;
  };

  const points = filteredLogs.map((log, i) => {
    const val = displayUnit === 'mmol/L' ? toMmol(log.value, log.unit) : toMgdl(log.value, log.unit);
    return {
      x: getX(i),
      y: getY(val),
      val,
      log
    };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${padTop + chartH} L ${points[0].x.toFixed(1)} ${padTop + chartH} Z`;

  const yHighTarget = getY(maxTarget);
  const yLowTarget = getY(minTarget);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[540px] h-auto select-none">
        <defs>
          <linearGradient id="glucoseArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Target Zone Band */}
        <rect
          x={padLeft}
          y={Math.max(padTop, yHighTarget)}
          width={chartW}
          height={Math.max(0, Math.min(padTop + chartH, yLowTarget) - Math.max(padTop, yHighTarget))}
          fill="#10b981"
          fillOpacity="0.08"
        />

        {/* Upper Target Line */}
        <line
          x1={padLeft}
          y1={yHighTarget}
          x2={width - padRight}
          y2={yHighTarget}
          stroke="#10b981"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <text x={width - padRight - 4} y={yHighTarget - 4} textAnchor="end" className="text-[10px] fill-emerald-700 font-medium">
          Target Max ({maxTarget} {displayUnit})
        </text>

        {/* Lower Target Line */}
        <line
          x1={padLeft}
          y1={yLowTarget}
          x2={width - padRight}
          y2={yLowTarget}
          stroke="#f59e0b"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Y-Axis Labels */}
        {[yMin, (yMin + yMax) / 2, yMax].map((tick, idx) => {
          const yPos = getY(tick);
          return (
            <g key={idx}>
              <line x1={padLeft} y1={yPos} x2={width - padRight} y2={yPos} stroke="#e2e8f0" strokeWidth="1" />
              <text x={padLeft - 8} y={yPos + 3} textAnchor="end" className="text-[11px] fill-slate-500">
                {displayUnit === 'mmol/L' ? tick.toFixed(1) : Math.round(tick)}
              </text>
            </g>
          );
        })}

        {/* Area & Line */}
        {points.length > 1 && <path d={areaD} fill="url(#glucoseArea)" />}
        {points.length > 1 && (
          <path d={pathD} fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Data Points */}
        {points.map((p, idx) => {
          const status = getGlucoseStatus(p.log.value, p.log.unit, p.log.type);
          const pointColor =
            status.label === 'In Target'
              ? '#0d9488'
              : status.label.includes('Low')
              ? '#f59e0b'
              : '#e11d48';

          const dateLabel = new Date(p.log.recordedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });

          return (
            <g key={p.log.id} className="group">
              <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke={pointColor} strokeWidth="2.5" />
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                className="text-[11px] font-semibold fill-slate-700"
              >
                {p.val}
              </text>
              {(filteredLogs.length <= 10 || idx % Math.ceil(filteredLogs.length / 8) === 0) && (
                <text x={p.x} y={height - 10} textAnchor="middle" className="text-[10px] fill-slate-500">
                  {dateLabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// --- MAIN APPLICATION ---
export default function App({ session }: { session?: Session }) {
  const userId = session?.user?.id || 'guest';
  const userEmail = session?.user?.email;

  // Navigation Tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Persistent States (Scoped per authenticated user ID)
  const [medications, setMedications] = useState(() => {
    try {
      const saved = localStorage.getItem(`gc_${userId}_medications`);
      return saved ? JSON.parse(saved) : INITIAL_MEDICATIONS;
    } catch {
      return INITIAL_MEDICATIONS;
    }
  });

  const [takenMedIdsToday, setTakenMedIdsToday] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`gc_${userId}_taken_${TODAY_STR}`);
      return saved ? JSON.parse(saved) : ['med-1'];
    } catch {
      return ['med-1'];
    }
  });

  const [sugarLogs, setSugarLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(`gc_${userId}_sugar_logs`);
      return saved ? JSON.parse(saved) : INITIAL_SUGAR_LOGS;
    } catch {
      return INITIAL_SUGAR_LOGS;
    }
  });

  const [actionItems, setActionItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`gc_${userId}_action_items`);
      return saved ? JSON.parse(saved) : INITIAL_ACTION_ITEMS;
    } catch {
      return INITIAL_ACTION_ITEMS;
    }
  });

  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem(`gc_${userId}_appointments`);
      return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(`gc_${userId}_settings`);
      return saved ? JSON.parse(saved) : getInitialSettings(userEmail);
    } catch {
      return getInitialSettings(userEmail);
    }
  });

  // Sync authenticated email if settings still has placeholder
  useEffect(() => {
    if (userEmail && settings.email === 'patient.care@example.com') {
      setSettings((prev: any) => ({ ...prev, email: userEmail }));
    }
  }, [userEmail, settings.email]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`gc_${userId}_medications`, JSON.stringify(medications));
  }, [medications, userId]);

  useEffect(() => {
    localStorage.setItem(`gc_${userId}_taken_${TODAY_STR}`, JSON.stringify(takenMedIdsToday));
  }, [takenMedIdsToday, userId]);

  useEffect(() => {
    localStorage.setItem(`gc_${userId}_sugar_logs`, JSON.stringify(sugarLogs));
  }, [sugarLogs, userId]);

  useEffect(() => {
    localStorage.setItem(`gc_${userId}_action_items`, JSON.stringify(actionItems));
  }, [actionItems, userId]);

  useEffect(() => {
    localStorage.setItem(`gc_${userId}_appointments`, JSON.stringify(appointments));
  }, [appointments, userId]);

  useEffect(() => {
    localStorage.setItem(`gc_${userId}_settings`, JSON.stringify(settings));
  }, [settings, userId]);

  // Toast Notification Banner
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const showToast = (message: string, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // --- BLOOD SUGAR STATE & HANDLERS ---
  const [preferredUnit, setPreferredUnit] = useState('mmol/L');
  const [chartDays, setChartDays] = useState(14);
  const [sugarForm, setSugarForm] = useState({
    value: '',
    unit: 'mmol/L',
    type: 'Fasting',
    recordedAt: new Date().toISOString().slice(0, 16),
    notes: ''
  });
  const [editingSugarId, setEditingSugarId] = useState<string | null>(null);
  const [editSugarForm, setEditSugarForm] = useState<any>(null);

  const handleAddSugarLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sugarForm.value || isNaN(Number(sugarForm.value))) return;
    const newEntry = {
      id: 'bs-' + Date.now(),
      value: Number(sugarForm.value),
      unit: sugarForm.unit,
      type: sugarForm.type,
      recordedAt: sugarForm.recordedAt || new Date().toISOString().slice(0, 16),
      notes: sugarForm.notes.trim()
    };
    setSugarLogs((prev: any[]) => [newEntry, ...prev]);
    setSugarForm((prev) => ({
      ...prev,
      value: '',
      notes: '',
      recordedAt: new Date().toISOString().slice(0, 16)
    }));
    showToast('Blood sugar reading logged successfully!');
  };

  const startEditingSugar = (log: any) => {
    setEditingSugarId(log.id);
    setEditSugarForm({ ...log });
  };

  const saveEditedSugar = () => {
    if (!editSugarForm || !editSugarForm.value || isNaN(Number(editSugarForm.value))) return;
    setSugarLogs((prev: any[]) =>
      prev.map((item) =>
        item.id === editingSugarId
          ? { ...editSugarForm, value: Number(editSugarForm.value) }
          : item
      )
    );
    setEditingSugarId(null);
    setEditSugarForm(null);
    showToast('Blood sugar record updated!');
  };

  const deleteSugarLog = (id: string) => {
    setSugarLogs((prev: any[]) => prev.filter((item) => item.id !== id));
    showToast('Reading deleted.', 'info');
  };

  const exportSugarCSV = () => {
    const sorted = [...sugarLogs].sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
    const headers = [
      'Date & Time',
      'Reading Type',
      'Original Value',
      'Unit',
      'Converted (mmol/L)',
      'Converted (mg/dL)',
      'Status',
      'Notes'
    ];
    const rows = sorted.map((log) => {
      const mmol = toMmol(log.value, log.unit);
      const mgdl = toMgdl(log.value, log.unit);
      const status = getGlucoseStatus(log.value, log.unit, log.type).label;
      return [
        `"${formatDateTime(log.recordedAt)}"`,
        `"${log.type}"`,
        log.value,
        log.unit,
        mmol,
        mgdl,
        `"${status}"`,
        `"${(log.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GlucoCare_BloodSugar_Report_${TODAY_STR}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report downloaded!');
  };

  // --- MEDICATION STATE & HANDLERS ---
  const [medForm, setMedForm] = useState({
    name: '',
    dosage: '',
    timing: 'Morning',
    instructions: ''
  });
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  const toggleMedTakenToday = (medId: string) => {
    setTakenMedIdsToday((prev) =>
      prev.includes(medId) ? prev.filter((id) => id !== medId) : [...prev, medId]
    );
  };

  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medForm.name.trim()) return;
    if (editingMedId) {
      setMedications((prev: any[]) =>
        prev.map((m) => (m.id === editingMedId ? { ...medForm, id: editingMedId } : m))
      );
      setEditingMedId(null);
      showToast('Medication schedule updated!');
    } else {
      setMedications((prev: any[]) => [...prev, { ...medForm, id: 'med-' + Date.now() }]);
      showToast('Daily medication added!');
    }
    setMedForm({ name: '', dosage: '', timing: 'Morning', instructions: '' });
  };

  const startEditMedication = (med: any) => {
    setEditingMedId(med.id);
    setMedForm({
      name: med.name,
      dosage: med.dosage,
      timing: med.timing,
      instructions: med.instructions
    });
  };

  const deleteMedication = (id: string) => {
    setMedications((prev: any[]) => prev.filter((m) => m.id !== id));
    setTakenMedIdsToday((prev) => prev.filter((mId) => mId !== id));
    showToast('Medication removed.', 'info');
  };

  // --- ACTION ITEMS (MEDS TO BUY & LAB TESTS) ---
  const [buyForm, setBuyForm] = useState({ title: '', details: '', targetDate: '' });
  const [labForm, setLabForm] = useState({ title: '', details: '', targetDate: '' });

  const addActionItem = (category: string, form: any, resetFn: Function) => (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setActionItems((prev: any[]) => [
      {
        id: 'act-' + Date.now(),
        category,
        title: form.title.trim(),
        details: form.details.trim(),
        targetDate: form.targetDate,
        completed: false
      },
      ...prev
    ]);
    resetFn({ title: '', details: '', targetDate: '' });
    showToast(category === 'med_to_buy' ? 'Added to Pharmacy Buy List!' : 'Lab test instruction added!');
  };

  const toggleActionItem = (id: string) => {
    setActionItems((prev: any[]) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const deleteActionItem = (id: string) => {
    setActionItems((prev: any[]) => prev.filter((item) => item.id !== id));
    showToast('Item deleted.', 'info');
  };

  // --- APPOINTMENTS STATE & HANDLERS ---
  const [aptForm, setAptForm] = useState({
    doctorName: '',
    specialty: '',
    location: '',
    dateTime: '',
    notes: ''
  });
  const [editingAptId, setEditingAptId] = useState<string | null>(null);

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptForm.doctorName.trim() || !aptForm.dateTime) return;
    if (editingAptId) {
      setAppointments((prev: any[]) =>
        prev.map((a) => (a.id === editingAptId ? { ...aptForm, id: editingAptId } : a))
      );
      setEditingAptId(null);
      showToast('Appointment updated!');
    } else {
      setAppointments((prev: any[]) => [...prev, { ...aptForm, id: 'apt-' + Date.now() }]);
      showToast('Doctor appointment scheduled!');
    }
    setAptForm({ doctorName: '', specialty: '', location: '', dateTime: '', notes: '' });
  };

  const startEditAppointment = (apt: any) => {
    setEditingAptId(apt.id);
    setAptForm({
      doctorName: apt.doctorName,
      specialty: apt.specialty,
      location: apt.location,
      dateTime: apt.dateTime,
      notes: apt.notes
    });
  };

  const deleteAppointment = (id: string) => {
    setAppointments((prev: any[]) => prev.filter((a) => a.id !== id));
    showToast('Appointment cancelled.', 'info');
  };

  // --- EMAIL PREVIEW & DEMO RESET ---
  const [showEmailModal, setShowEmailModal] = useState(false);

  const resetDemoData = () => {
    setMedications(INITIAL_MEDICATIONS);
    setTakenMedIdsToday(['med-1']);
    setSugarLogs(INITIAL_SUGAR_LOGS);
    setActionItems(INITIAL_ACTION_ITEMS);
    setAppointments(INITIAL_APPOINTMENTS);
    setSettings(getInitialSettings(userEmail));
    showToast('Demo data restored to default!');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // --- DERIVED METRICS ---
  const sortedSugarLogs = useMemo(
    () =>
      [...sugarLogs].sort(
        (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
      ),
    [sugarLogs]
  );

  const todaySugarLogs = useMemo(
    () => sortedSugarLogs.filter((l) => l.recordedAt.startsWith(TODAY_STR)),
    [sortedSugarLogs]
  );

  const latestReading = sortedSugarLogs[0];
  const pendingBuyItems = actionItems.filter((i: any) => i.category === 'med_to_buy' && !i.completed);
  const pendingLabTests = actionItems.filter((i: any) => i.category === 'lab_test' && !i.completed);
  const upcomingAppointments = useMemo(
    () =>
      [...appointments]
        .filter((a) => new Date(a.dateTime).getTime() >= Date.now() - 86400000)
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    [appointments]
  );

  const medsProgress =
    medications.length > 0 ? Math.round((takenMedIdsToday.length / medications.length) * 100) : 0;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HeartPulse },
    { id: 'glucose', label: 'Blood Sugar', icon: Activity },
    { id: 'medications', label: 'Daily Meds', icon: Pill },
    { id: 'tasks', label: 'Tests & Visits', icon: ClipboardList },
    { id: 'settings', label: 'Email Alerts', icon: Mail }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r border-slate-200 sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight">GlucoCare</h1>
            <p className="text-xs text-teal-600 font-medium">& MedTrack Daily</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-teal-50 text-teal-700 shadow-xs border border-teal-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.id === 'tasks' && pendingBuyItems.length + pendingLabTests.length > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                    {pendingBuyItems.length + pendingLabTests.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2.5">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Daily Digest Status</span>
              <span
                className={`font-semibold ${
                  settings.enableDailyEmail ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {settings.enableDailyEmail ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-700 truncate">{settings.email}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Scheduled at {settings.reminderTime} ({settings.timezone})
            </p>
          </div>

          <button
            onClick={() => setShowEmailModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <Mail className="w-3.5 h-3.5" />
            Preview Daily Email
          </button>

          {session && (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-semibold rounded-xl transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
            <HeartPulse className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-base">GlucoCare</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
          >
            <Mail className="w-3.5 h-3.5" />
            Digest
          </button>
          {session && (
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-1.5 bg-slate-100 text-slate-600 hover:text-rose-600 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 md:pb-10">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                {activeTab === 'dashboard' && 'Daily Health Overview'}
                {activeTab === 'glucose' && 'Blood Sugar Log & Trends'}
                {activeTab === 'medications' && 'Daily Medication Schedule'}
                {activeTab === 'tasks' && 'Meds to Buy, Lab Tests & Visits'}
                {activeTab === 'settings' && 'Automated Daily Email Reminders'}
              </h2>
            </div>

            {/* Unit Switcher */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500 font-medium">Display Unit:</span>
              <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5">
                {['mmol/L', 'mg/dL'].map((u) => (
                  <button
                    key={u}
                    onClick={() => {
                      setPreferredUnit(u);
                      setSugarForm((prev) => ({ ...prev, unit: u }));
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      preferredUnit === u
                        ? 'bg-white text-teal-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* =========================================================
              VIEW 1: DASHBOARD
             ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Meds Progress */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Today's Meds</span>
                    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                      <Pill className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {takenMedIdsToday.length}/{medications.length}
                    </span>
                    <span className="text-xs text-slate-500">taken ({medsProgress}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${medsProgress}%` }}
                    />
                  </div>
                </div>

                {/* Card 2: Latest Blood Sugar */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Latest Glucose</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Activity className="w-4 h-4" />
                    </div>
                  </div>
                  {latestReading ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-slate-900">
                          {preferredUnit === 'mmol/L'
                            ? toMmol(latestReading.value, latestReading.unit)
                            : toMgdl(latestReading.value, latestReading.unit)}
                        </span>
                        <span className="text-xs font-medium text-slate-500">{preferredUnit}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-xs text-slate-500">{latestReading.type}</span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                            getGlucoseStatus(latestReading.value, latestReading.unit, latestReading.type)
                              .color
                          }`}
                        >
                          {
                            getGlucoseStatus(latestReading.value, latestReading.unit, latestReading.type)
                              .label
                          }
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">No readings logged yet</p>
                  )}
                </div>

                {/* Card 3: Action Items */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Pending Tasks</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900">
                      {pendingBuyItems.length + pendingLabTests.length}
                    </span>
                    <span className="text-xs text-slate-500">items pending</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2.5">
                    {pendingBuyItems.length} to buy • {pendingLabTests.length} lab tests
                  </p>
                </div>

                {/* Card 4: Next Appointment */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Next Visit</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                  </div>
                  {upcomingAppointments[0] ? (
                    <>
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {upcomingAppointments[0].doctorName}
                      </p>
                      <p className="text-xs text-indigo-600 font-medium mt-1">
                        {formatDateTime(upcomingAppointments[0].dateTime)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-400">No upcoming visits</p>
                  )}
                </div>
              </div>

              {/* Main Two-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 Cols: Today's Medication Checklist */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">Today's Medication Checklist</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tap a medication to mark your daily dose as taken
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('medications')}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                      Manage <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {medications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        No daily medications configured yet.
                      </div>
                    ) : (
                      medications.map((med: any) => {
                        const isTaken = takenMedIdsToday.includes(med.id);
                        return (
                          <div
                            key={med.id}
                            onClick={() => toggleMedTakenToday(med.id)}
                            className={`p-4 flex items-start gap-3.5 cursor-pointer transition select-none ${
                              isTaken ? 'bg-teal-50/40' : 'hover:bg-slate-50'
                            }`}
                          >
                            <button
                              type="button"
                              className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition ${
                                isTaken
                                  ? 'bg-teal-600 border-teal-600 text-white'
                                  : 'border-slate-300 bg-white hover:border-teal-500'
                              }`}
                            >
                              {isTaken && <Check className="w-4 h-4 stroke-[2.5]" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`font-semibold text-sm ${
                                    isTaken ? 'line-through text-slate-400' : 'text-slate-900'
                                  }`}
                                >
                                  {med.name}
                                </span>
                                <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                  {med.dosage}
                                </span>
                                <span className="text-xs font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md">
                                  {med.timing}
                                </span>
                              </div>
                              {med.instructions && (
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {med.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right 5 Cols: Quick Blood Sugar Logger */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">Quick Blood Sugar Log</h3>
                      <p className="text-xs text-slate-500">Record a current or past reading</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('glucose')}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      Full History
                    </button>
                  </div>

                  <form onSubmit={handleAddSugarLog} className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Glucose Value
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          placeholder={sugarForm.unit === 'mmol/L' ? 'e.g. 6.2' : 'e.g. 112'}
                          value={sugarForm.value}
                          onChange={(e) => setSugarForm({ ...sugarForm, value: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Unit</label>
                        <select
                          value={sugarForm.unit}
                          onChange={(e) => setSugarForm({ ...sugarForm, unit: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="mmol/L">mmol/L</option>
                          <option value="mg/dL">mg/dL</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Reading Type
                        </label>
                        <select
                          value={sugarForm.type}
                          onChange={(e) => setSugarForm({ ...sugarForm, type: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="Fasting">Fasting</option>
                          <option value="Before Meal">Before Meal</option>
                          <option value="2-Hours Post-Meal">2-Hours Post-Meal</option>
                          <option value="Bedtime">Bedtime</option>
                          <option value="Random">Random</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Date & Time
                        </label>
                        <input
                          type="datetime-local"
                          value={sugarForm.recordedAt}
                          onChange={(e) =>
                            setSugarForm({ ...sugarForm, recordedAt: e.target.value })
                          }
                          className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Optional meal or symptom notes..."
                        value={sugarForm.notes}
                        onChange={(e) => setSugarForm({ ...sugarForm, notes: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      Save Blood Sugar Entry
                    </button>
                  </form>

                  {/* Today's Mini Readings List */}
                  {todaySugarLogs.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Logged Today</p>
                      <div className="space-y-2">
                        {todaySugarLogs.slice(0, 3).map((log: any) => {
                          const status = getGlucoseStatus(log.value, log.unit, log.type);
                          return (
                            <div
                              key={log.id}
                              className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg"
                            >
                              <div>
                                <span className="font-bold text-slate-800">
                                  {preferredUnit === 'mmol/L'
                                    ? `${toMmol(log.value, log.unit)} mmol/L`
                                    : `${toMgdl(log.value, log.unit)} mg/dL`}
                                </span>
                                <span className="text-slate-500 ml-2">{log.type}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${status.color}`}>
                                {status.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Action Reminders & Upcoming Doctor Visits */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Meds to Buy & Lab Tests */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">Action Required: Buy & Lab Tests</h3>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {[...pendingBuyItems, ...pendingLabTests].slice(0, 4).map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <button
                          onClick={() => toggleActionItem(item.id)}
                          className="mt-0.5 w-5 h-5 rounded-md border border-slate-300 bg-white hover:border-teal-600 flex items-center justify-center shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                item.category === 'med_to_buy'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {item.category === 'med_to_buy' ? 'Buy Med' : 'Lab Test'}
                            </span>
                            <span className="text-sm font-semibold text-slate-800 truncate">
                              {item.title}
                            </span>
                          </div>
                          {item.details && (
                            <p className="text-xs text-slate-500 mt-1">{item.details}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {pendingBuyItems.length + pendingLabTests.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">
                        All shopping items and lab tests are completed!
                      </p>
                    )}
                  </div>
                </div>

                {/* Upcoming Doctor Visits */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900">Upcoming Doctor Appointments</h3>
                    <button
                      onClick={() => setActiveTab('tasks')}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      Schedule
                    </button>
                  </div>
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 2).map((apt: any) => (
                      <div
                        key={apt.id}
                        className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-sm text-slate-900">{apt.doctorName}</p>
                            <p className="text-xs text-indigo-700 font-medium">{apt.specialty}</p>
                          </div>
                          <span className="text-xs font-semibold bg-white text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg">
                            {formatDateTime(apt.dateTime)}
                          </span>
                        </div>
                        {apt.location && (
                          <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {apt.location}
                          </p>
                        )}
                        {apt.notes && (
                          <p className="text-xs text-slate-500 mt-1.5 bg-white/80 p-2 rounded-lg border border-indigo-100/70">
                            <span className="font-semibold text-slate-700">Prep/Questions:</span>{' '}
                            {apt.notes}
                          </p>
                        )}
                      </div>
                    ))}
                    {upcomingAppointments.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-6">
                        No upcoming doctor appointments scheduled.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 2: BLOOD SUGAR LOG, BACKLOG & ANALYTICS
             ========================================================= */}
          {activeTab === 'glucose' && (
            <div className="space-y-6">
              {/* Trend Chart Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-teal-600" />
                      Blood Glucose Trend ({preferredUnit})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Green shaded band represents standard target range
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {[7, 14, 30].map((d) => (
                      <button
                        key={d}
                        onClick={() => setChartDays(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          chartDays === d
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d} Days
                      </button>
                    ))}
                    <button
                      onClick={exportSugarCSV}
                      className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                  </div>
                </div>

                <GlucoseTrendChart
                  logs={sugarLogs}
                  displayUnit={preferredUnit}
                  daysRange={chartDays}
                />
              </div>

              {/* Log New or Backlogged Entry Form */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <h3 className="font-bold text-slate-900 mb-1">
                  Log Blood Sugar Reading (Supports Backlogging Past Dates)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Select any past date and time to backlog older glucometer readings.
                </p>

                <form
                  onSubmit={handleAddSugarLog}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Value</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder={sugarForm.unit === 'mmol/L' ? '6.4' : '115'}
                      value={sugarForm.value}
                      onChange={(e) => setSugarForm({ ...sugarForm, value: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Unit</label>
                    <select
                      value={sugarForm.unit}
                      onChange={(e) => setSugarForm({ ...sugarForm, unit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="mmol/L">mmol/L</option>
                      <option value="mg/dL">mg/dL</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Reading Type
                    </label>
                    <select
                      value={sugarForm.type}
                      onChange={(e) => setSugarForm({ ...sugarForm, type: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="Fasting">Fasting</option>
                      <option value="Before Meal">Before Meal</option>
                      <option value="2-Hours Post-Meal">2-Hours Post-Meal</option>
                      <option value="Bedtime">Bedtime</option>
                      <option value="Random">Random</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Date & Time (Backlog)
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={sugarForm.recordedAt}
                      onChange={(e) => setSugarForm({ ...sugarForm, recordedAt: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                    <input
                      type="text"
                      placeholder="Meal or activity..."
                      value={sugarForm.notes}
                      onChange={(e) => setSugarForm({ ...sugarForm, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Add Entry
                    </button>
                  </div>
                </form>
              </div>

              {/* Historical Log Table with Inline Editing */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">
                    Historical Test Results ({sortedSugarLogs.length} Records)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Click Edit on any row to modify past test results
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Result ({preferredUnit})</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Notes</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {sortedSugarLogs.map((log: any) => {
                        const isEditing = editingSugarId === log.id;
                        const status = getGlucoseStatus(log.value, log.unit, log.type);
                        const convertedVal =
                          preferredUnit === 'mmol/L'
                            ? `${toMmol(log.value, log.unit)} mmol/L`
                            : `${toMgdl(log.value, log.unit)} mg/dL`;

                        if (isEditing && editSugarForm) {
                          return (
                            <tr key={log.id} className="bg-teal-50/50">
                              <td className="py-2.5 px-3">
                                <input
                                  type="datetime-local"
                                  value={editSugarForm.recordedAt}
                                  onChange={(e) =>
                                    setEditSugarForm({
                                      ...editSugarForm,
                                      recordedAt: e.target.value
                                    })
                                  }
                                  className="px-2 py-1.5 rounded-lg border border-teal-300 text-xs bg-white"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <select
                                  value={editSugarForm.type}
                                  onChange={(e) =>
                                    setEditSugarForm({ ...editSugarForm, type: e.target.value })
                                  }
                                  className="px-2 py-1.5 rounded-lg border border-teal-300 text-xs bg-white"
                                >
                                  <option value="Fasting">Fasting</option>
                                  <option value="Before Meal">Before Meal</option>
                                  <option value="2-Hours Post-Meal">2-Hours Post-Meal</option>
                                  <option value="Bedtime">Bedtime</option>
                                  <option value="Random">Random</option>
                                </select>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={editSugarForm.value}
                                    onChange={(e) =>
                                      setEditSugarForm({
                                        ...editSugarForm,
                                        value: e.target.value
                                      })
                                    }
                                    className="w-20 px-2 py-1.5 rounded-lg border border-teal-300 text-xs bg-white"
                                  />
                                  <select
                                    value={editSugarForm.unit}
                                    onChange={(e) =>
                                      setEditSugarForm({ ...editSugarForm, unit: e.target.value })
                                    }
                                    className="px-2 py-1.5 rounded-lg border border-teal-300 text-xs bg-white"
                                  >
                                    <option value="mmol/L">mmol/L</option>
                                    <option value="mg/dL">mg/dL</option>
                                  </select>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-xs text-slate-400">Auto-updating</td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  value={editSugarForm.notes}
                                  onChange={(e) =>
                                    setEditSugarForm({ ...editSugarForm, notes: e.target.value })
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg border border-teal-300 text-xs bg-white"
                                />
                              </td>
                              <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-1.5">
                                <button
                                  onClick={saveEditedSugar}
                                  className="px-2.5 py-1 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingSugarId(null);
                                    setEditSugarForm(null);
                                  }}
                                  className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300"
                                >
                                  Cancel
                                </button>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 text-xs font-medium text-slate-700 whitespace-nowrap">
                              {formatDateTime(log.recordedAt)}
                            </td>
                            <td className="py-3 px-4 text-xs font-medium text-slate-700">
                              {log.type}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                              {convertedVal}
                              {log.unit !== preferredUnit && (
                                <span className="block text-[10px] font-normal text-slate-400">
                                  (Logged: {log.value} {log.unit})
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.color}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                {status.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate">
                              {log.notes || '—'}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                              <button
                                onClick={() => startEditingSugar(log)}
                                title="Edit reading"
                                className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteSugarLog(log.id)}
                                title="Delete reading"
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 3: DAILY MEDICATIONS MANAGER
             ========================================================= */}
          {activeTab === 'medications' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 4 Cols: Add/Edit Medication Form */}
              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit">
                <h3 className="font-bold text-slate-900 mb-1">
                  {editingMedId ? 'Edit Daily Medication' : 'Add Daily Medication'}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Set dosage, timing, and food instructions for your daily reminders.
                </p>

                <form onSubmit={handleSaveMedication} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Medication Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Metformin XR"
                      value={medForm.name}
                      onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Dosage
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 500 mg"
                        value={medForm.dosage}
                        onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Time of Day
                      </label>
                      <select
                        value={medForm.timing}
                        onChange={(e) => setMedForm({ ...medForm, timing: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value="Morning">Morning</option>
                        <option value="Afternoon">Afternoon</option>
                        <option value="Evening">Evening</option>
                        <option value="Night">Night</option>
                        <option value="Before Meals">Before Meals</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Special Instructions
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g., Take after breakfast with water. Avoid skipping meals."
                      value={medForm.instructions}
                      onChange={(e) => setMedForm({ ...medForm, instructions: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      {editingMedId ? 'Update Medication' : 'Save Medication'}
                    </button>
                    {editingMedId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMedId(null);
                          setMedForm({ name: '', dosage: '', timing: 'Morning', instructions: '' });
                        }}
                        className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Right 8 Cols: Active Medications List */}
              <div className="lg:col-span-8 space-y-4">
                {['Morning', 'Afternoon', 'Evening', 'Night', 'Before Meals'].map((slot) => {
                  const slotMeds = medications.filter((m: any) => m.timing === slot);
                  if (slotMeds.length === 0) return null;
                  return (
                    <div
                      key={slot}
                      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
                    >
                      <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-100 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          {slot} Schedule
                        </h4>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {slotMeds.map((med: any) => (
                          <div
                            key={med.id}
                            className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{med.name}</span>
                                {med.dosage && (
                                  <span className="text-xs font-semibold bg-teal-50 text-teal-700 px-2.5 py-0.5 rounded-full">
                                    {med.dosage}
                                  </span>
                                )}
                              </div>
                              {med.instructions && (
                                <p className="text-xs text-slate-600 mt-1.5">{med.instructions}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => startEditMedication(med)}
                                className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteMedication(med.id)}
                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 4: MEDS TO BUY, LAB TESTS & DOCTOR APPOINTMENTS
             ========================================================= */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {/* Top Grid: Pharmacy Buy List & Lab Tests */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Meds & Supplies to Buy */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Meds & Supplies to Buy</h3>
                      <p className="text-xs text-slate-500">
                        Pharmacy shopping checklist included in your morning email
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={addActionItem('med_to_buy', buyForm, setBuyForm)}
                    className="space-y-2.5 mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-100"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Medication or supply name (e.g., Insulin Pen Needles)"
                      value={buyForm.title}
                      onChange={(e) => setBuyForm({ ...buyForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Quantity / Pharmacy notes"
                        value={buyForm.details}
                        onChange={(e) => setBuyForm({ ...buyForm, details: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition"
                      >
                        Add Item
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2 flex-1">
                    {actionItems
                      .filter((i: any) => i.category === 'med_to_buy')
                      .map((item: any) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition ${
                            item.completed
                              ? 'bg-slate-50 border-slate-100 opacity-60'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div
                            onClick={() => toggleActionItem(item.id)}
                            className="flex items-start gap-3 cursor-pointer flex-1"
                          >
                            <button
                              type="button"
                              className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                item.completed
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {item.completed && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <div>
                              <p
                                className={`text-sm font-semibold ${
                                  item.completed ? 'line-through text-slate-400' : 'text-slate-900'
                                }`}
                              >
                                {item.title}
                              </p>
                              {item.details && (
                                <p className="text-xs text-slate-500 mt-0.5">{item.details}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteActionItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Column 2: Diagnostic Lab Tests & Prep Instructions */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">Lab Tests & Prep Instructions</h3>
                      <p className="text-xs text-slate-500">
                        Track upcoming blood work & fasting instructions
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={addActionItem('lab_test', labForm, setLabForm)}
                    className="space-y-2.5 mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-100"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Test name (e.g., HbA1c, Fasting Blood Glucose)"
                      value={labForm.title}
                      onChange={(e) => setLabForm({ ...labForm, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Prep instructions (e.g. 12hr fasting)"
                        value={labForm.details}
                        onChange={(e) => setLabForm({ ...labForm, details: e.target.value })}
                        className="sm:col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                      <input
                        type="date"
                        value={labForm.targetDate}
                        onChange={(e) => setLabForm({ ...labForm, targetDate: e.target.value })}
                        className="px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      Add Lab Test Instruction
                    </button>
                  </form>

                  <div className="space-y-2 flex-1">
                    {actionItems
                      .filter((i: any) => i.category === 'lab_test')
                      .map((item: any) => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border flex items-start justify-between gap-3 transition ${
                            item.completed
                              ? 'bg-slate-50 border-slate-100 opacity-60'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div
                            onClick={() => toggleActionItem(item.id)}
                            className="flex items-start gap-3 cursor-pointer flex-1"
                          >
                            <button
                              type="button"
                              className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                                item.completed
                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {item.completed && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p
                                  className={`text-sm font-semibold ${
                                    item.completed
                                      ? 'line-through text-slate-400'
                                      : 'text-slate-900'
                                  }`}
                                >
                                  {item.title}
                                </p>
                                {item.targetDate && (
                                  <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded">
                                    Due: {formatShortDate(item.targetDate)}
                                  </span>
                                )}
                              </div>
                              {item.details && (
                                <p className="text-xs text-slate-600 mt-1">{item.details}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => deleteActionItem(item.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Bottom Section: Doctor Appointments Scheduler */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Doctor Appointments & Visit Notes</h3>
                    <p className="text-xs text-slate-500">
                      Manage upcoming specialist visits and questions to ask your doctor
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Add/Edit Appointment Form */}
                  <form
                    onSubmit={handleSaveAppointment}
                    className="lg:col-span-5 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 h-fit"
                  >
                    <h4 className="text-xs font-bold uppercase text-slate-700">
                      {editingAptId ? 'Edit Appointment' : 'Schedule New Visit'}
                    </h4>
                    <input
                      type="text"
                      required
                      placeholder="Doctor Name (e.g., Dr. Farhana Rahman)"
                      value={aptForm.doctorName}
                      onChange={(e) => setAptForm({ ...aptForm, doctorName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                    />
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        placeholder="Specialty (e.g. Endocrinologist)"
                        value={aptForm.specialty}
                        onChange={(e) => setAptForm({ ...aptForm, specialty: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                      <input
                        type="datetime-local"
                        required
                        value={aptForm.dateTime}
                        onChange={(e) => setAptForm({ ...aptForm, dateTime: e.target.value })}
                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Hospital / Clinic Location"
                      value={aptForm.location}
                      onChange={(e) => setAptForm({ ...aptForm, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                    <textarea
                      rows={2}
                      placeholder="Questions for doctor / reports to bring..."
                      value={aptForm.notes}
                      onChange={(e) => setAptForm({ ...aptForm, notes: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition"
                      >
                        {editingAptId ? 'Update Visit' : 'Save Appointment'}
                      </button>
                      {editingAptId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAptId(null);
                            setAptForm({
                              doctorName: '',
                              specialty: '',
                              location: '',
                              dateTime: '',
                              notes: ''
                            });
                          }}
                          className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Appointments List */}
                  <div className="lg:col-span-7 space-y-3">
                    {appointments.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">
                        No doctor appointments scheduled.
                      </p>
                    ) : (
                      [...appointments]
                        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
                        .map((apt: any) => (
                          <div
                            key={apt.id}
                            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition flex items-start justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-slate-900">{apt.doctorName}</span>
                                {apt.specialty && (
                                  <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">
                                    {apt.specialty}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-teal-700">
                                {formatDateTime(apt.dateTime)}
                              </p>
                              {apt.location && (
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  {apt.location}
                                </p>
                              )}
                              {apt.notes && (
                                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg mt-2 border border-slate-100">
                                  {apt.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => startEditAppointment(apt)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteAppointment(apt.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================
              VIEW 5: DAILY EMAIL NOTIFICATION SETTINGS
             ========================================================= */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Settings Form */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-900">Daily Email Digest Configuration</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Customize your automated morning health task email
                    </p>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.enableDailyEmail}
                      onChange={(e) =>
                        setSettings({ ...settings, enableDailyEmail: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600 relative" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recipient Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Daily Delivery Time
                    </label>
                    <input
                      type="time"
                      value={settings.reminderTime}
                      onChange={(e) => setSettings({ ...settings, reminderTime: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    >
                      <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                      <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                      <option value="Europe/London">Europe/London (GMT+0)</option>
                      <option value="America/New_York">America/New_York (EST)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Sections Included in Daily Email
                  </p>
                  <div className="space-y-2.5">
                    {[
                      {
                        key: 'includeMeds',
                        label: 'Daily Medications & Dosage Instructions',
                        desc: `${medications.length} active daily medications`
                      },
                      {
                        key: 'includeSugarPrompt',
                        label: 'Blood Sugar Check Reminder & Yesterday Summary',
                        desc: 'Reminds you to log fasting & post-meal readings'
                      },
                      {
                        key: 'includeBuyList',
                        label: 'Pharmacy Buy List (Meds & Test Strips to Purchase)',
                        desc: `${pendingBuyItems.length} pending items`
                      },
                      {
                        key: 'includeLabTests',
                        label: 'Upcoming Lab Tests & Fasting Prep Instructions',
                        desc: `${pendingLabTests.length} pending diagnostic tests`
                      },
                      {
                        key: 'includeAppointments',
                        label: 'Upcoming Doctor Appointments',
                        desc: `${upcomingAppointments.length} scheduled visits`
                      }
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 cursor-pointer"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                          <p className="text-xs text-slate-500">{opt.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings[opt.key]}
                          onChange={(e) =>
                            setSettings({ ...settings, [opt.key]: e.target.checked })
                          }
                          className="w-4 h-4 accent-teal-600 rounded"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={resetDemoData}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-2 rounded-lg hover:bg-slate-100"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Sample Data
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowEmailModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition shadow-xs"
                    >
                      <Send className="w-4 h-4" />
                      Preview & Test Daily Email
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Backend Cron Info Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" />
                    Live Digest Preview Ready
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">
                    How Your Daily Email Works
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Every morning at <strong className="text-white">{settings.reminderTime}</strong>{' '}
                    ({settings.timezone}), your scheduled job compiles your active medications,
                    pending pharmacy items, lab prep instructions, and doctor visits into a single
                    clean digest sent to <strong className="text-teal-300">{settings.email}</strong>.
                  </p>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Open Live HTML Email Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex justify-around py-2 z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium ${
                active ? 'text-teal-600' : 'text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* =========================================================
          DAILY EMAIL DIGEST LIVE PREVIEW MODAL
         ========================================================= */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-700">
                  Daily Email Digest Preview ({settings.reminderTime} {settings.timezone})
                </span>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 text-slate-500 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Metadata Header */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs space-y-1">
              <p>
                <span className="text-slate-400 font-medium">To:</span>{' '}
                <span className="font-semibold text-slate-800">{settings.email}</span>
              </p>
              <p>
                <span className="text-slate-400 font-medium">Subject:</span>{' '}
                <span className="font-semibold text-slate-800">
                  🩺 Your Daily Health & Medication Plan —{' '}
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </p>
            </div>

            {/* Rendered HTML Email Body */}
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-5 bg-white">
              <div className="border-l-4 border-teal-600 pl-3.5">
                <h3 className="text-lg font-bold text-slate-900">
                  Good Morning! Here is your care plan for today.
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stay consistent with your medications and glucose checks.
                </p>
              </div>

              {settings.includeMeds && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">
                    💊 Today's Daily Medications ({medications.length})
                  </h4>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {medications.map((m: any) => (
                      <div key={m.id} className="p-3 text-xs">
                        <div className="font-bold text-slate-900">
                          {m.name} ({m.dosage}) — <span className="text-teal-700">{m.timing}</span>
                        </div>
                        {m.instructions && (
                          <div className="text-slate-500 mt-0.5">{m.instructions}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {settings.includeSugarPrompt && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs">
                  <p className="font-bold text-emerald-900">🩸 Blood Sugar Check Reminder</p>
                  <p className="text-emerald-800 mt-1">
                    Don't forget to log your <strong>Fasting</strong> and{' '}
                    <strong>2-Hours Post-Meal</strong> blood sugar readings today.
                    {latestReading &&
                      ` Your last recorded level was ${latestReading.value} ${latestReading.unit} (${latestReading.type}).`}
                  </p>
                </div>
              )}

              {settings.includeBuyList && pendingBuyItems.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-2">
                    🛒 Pharmacy Shopping List ({pendingBuyItems.length})
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                    {pendingBuyItems.map((i: any) => (
                      <li key={i.id}>
                        <strong>{i.title}</strong> {i.details ? `— ${i.details}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {settings.includeLabTests && pendingLabTests.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-700 mb-2">
                    🧪 Pending Lab Tests & Prep Instructions ({pendingLabTests.length})
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
                    {pendingLabTests.map((t: any) => (
                      <li key={t.id}>
                        <strong>{t.title}</strong>
                        {t.targetDate ? ` (Target: ${formatShortDate(t.targetDate)})` : ''}
                        {t.details ? ` — ${t.details}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {settings.includeAppointments && upcomingAppointments.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
                    📅 Upcoming Doctor Appointments
                  </h4>
                  <div className="space-y-2">
                    {upcomingAppointments.map((a: any) => (
                      <div
                        key={a.id}
                        className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs"
                      >
                        <p className="font-bold text-slate-900">
                          {a.doctorName} ({a.specialty})
                        </p>
                        <p className="text-indigo-700 font-medium mt-0.5">
                          {formatDateTime(a.dateTime)} • {a.location}
                        </p>
                        {a.notes && <p className="text-slate-600 mt-1">Notes: {a.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Simulated preview using your live app data
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    showToast(`Test daily digest simulated to ${settings.email}!`);
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Simulate Test Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}