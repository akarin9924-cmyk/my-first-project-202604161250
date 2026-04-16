"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Priority, Todo, suggestTodayOrder } from "@/lib/scheduler";

type Memo = {
  id: string;
  text: string;
  createdAt: number;
};

const TODO_STORAGE_KEY = "priority-todo-app-v3";
const MEMO_STORAGE_KEY = "priority-memo-app-v1";

const priorityLabel: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低"
};

const priorityStyles: Record<Priority, string> = {
  high: "border-priority-high bg-red-50 text-red-800",
  medium: "border-priority-medium bg-amber-50 text-amber-800",
  low: "border-priority-low bg-green-50 text-green-800"
};

function isOverdue(dueDate: string, done: boolean): boolean {
  if (!dueDate || done) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return due < today;
}

export default function TodoApp() {
  const currentYear = String(new Date().getFullYear());
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [dueYear, setDueYear] = useState(currentYear);
  const [monthDayInput, setMonthDayInput] = useState("");
  const [isYearEditOpen, setIsYearEditOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [memoInput, setMemoInput] = useState("");
  const [suggestedIds, setSuggestedIds] = useState<string[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTodos = localStorage.getItem(TODO_STORAGE_KEY);
    const savedMemos = localStorage.getItem(MEMO_STORAGE_KEY);

    if (savedTodos) {
      try {
        const parsed = JSON.parse(savedTodos) as Todo[];
        if (Array.isArray(parsed)) setTodos(parsed);
      } catch {
        // Ignore invalid value.
      }
    }

    if (savedMemos) {
      try {
        const parsed = JSON.parse(savedMemos) as Memo[];
        if (Array.isArray(parsed)) setMemos(parsed);
      } catch {
        // Ignore invalid value.
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(MEMO_STORAGE_KEY, JSON.stringify(memos));
  }, [memos]);

  const activeTodos = useMemo(() => todos.filter((todo) => !todo.done), [todos]);
  const completedTodos = useMemo(() => todos.filter((todo) => todo.done), [todos]);
  const suggestedTodos = useMemo(
    () => suggestedIds.map((id) => todos.find((todo) => todo.id === id)).filter((todo): todo is Todo => Boolean(todo)),
    [suggestedIds, todos]
  );

  const addTodo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    const nextTodo: Todo = {
      id: crypto.randomUUID(),
      title: trimmed,
      priority,
      dueDate,
      done: false,
      createdAt: Date.now()
    };

    setTodos((prev) => [nextTodo, ...prev]);
    setTitle("");
    setPriority("medium");
    setDueDate("");
    setDueYear(currentYear);
    setMonthDayInput("");
    setIsYearEditOpen(false);
  };

  const addMemo = () => {
    const trimmed = memoInput.trim();
    if (!trimmed) return;
    setMemos((prev) => [{ id: crypto.randomUUID(), text: trimmed, createdAt: Date.now() }, ...prev]);
    setMemoInput("");
  };

  const toggleDone = (id: string) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)));
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    setSuggestedIds((prev) => prev.filter((todoId) => todoId !== id));
  };

  const deleteMemo = (id: string) => {
    setMemos((prev) => prev.filter((memo) => memo.id !== id));
  };

  const moveMemoToTaskInput = (text: string) => {
    setTitle(text);
    taskInputRef.current?.focus();
  };

  const runAiSuggestion = () => {
    const sorted = suggestTodayOrder(todos, true);
    setSuggestedIds(sorted.slice(0, 5).map((todo) => todo.id));
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  };

  const parseMonthDayDigits = (monthDayDigits: string): { month: number; day: number } | null => {
    if (monthDayDigits.length === 4) {
      return {
        month: Number(monthDayDigits.slice(0, 2)),
        day: Number(monthDayDigits.slice(2, 4))
      };
    }

    if (monthDayDigits.length === 3) {
      return {
        month: Number(monthDayDigits.slice(0, 1)),
        day: Number(monthDayDigits.slice(1, 3))
      };
    }

    return null;
  };

  const updateDueDateFromParts = (year: string, monthDayDigits: string) => {
    if (!/^\d{4}$/.test(year)) {
      setDueDate("");
      return;
    }

    const parsed = parseMonthDayDigits(monthDayDigits);
    if (!parsed) {
      setDueDate("");
      return;
    }

    const { month, day } = parsed;
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      setDueDate("");
      return;
    }

    setDueDate(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  };

  const handleMonthDayChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setMonthDayInput(digits);
    updateDueDateFromParts(dueYear, digits);
  };

  const handleYearChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    setDueYear(digits);
    updateDueDateFromParts(digits, monthDayInput);
  };

  const renderTodoCard = (todo: Todo) => {
    const suggested = suggestedIds.includes(todo.id);
    const overdue = isOverdue(todo.dueDate, todo.done);

    return (
      <li
        key={todo.id}
        className={`rounded-xl border p-3 ${priorityStyles[todo.priority]} ${todo.done ? "opacity-60" : ""} ${
          suggested ? "ring-2 ring-blue-300" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <input type="checkbox" checked={todo.done} onChange={() => toggleDone(todo.id)} className="mt-1 h-5 w-5" />
          <div className="min-w-0 flex-1">
            <p className={`break-words text-[15px] font-medium ${todo.done ? "line-through" : ""}`}>{todo.title}</p>
            <div className="mt-1 flex flex-wrap gap-1 text-xs">
              <span className="rounded bg-white/80 px-2 py-0.5">優先度: {priorityLabel[todo.priority]}</span>
              <span className={`rounded px-2 py-0.5 ${overdue ? "bg-red-200 text-red-900" : "bg-white/80"}`}>
                期限: {todo.dueDate || "未設定"}
              </span>
              {suggested && <span className="rounded bg-blue-200 px-2 py-0.5 text-blue-900">今日おすすめ</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => deleteTodo(todo.id)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
          >
            削除
          </button>
        </div>
      </li>
    );
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-3 pb-24 pt-4">
      <section className="rounded-2xl bg-white p-4 shadow-lg shadow-slate-200">
        <h1 className="text-xl font-bold">自分専用ToDo</h1>
        <p className="mt-1 text-xs text-slate-600">iPhoneで使いやすい、1画面完結のシンプル版。</p>

        <section className="mt-4 rounded-xl border border-slate-200 p-3">
          <h2 className="text-sm font-semibold">とりあえずメモ</h2>
          <div className="mt-2 flex gap-2">
            <input
              value={memoInput}
              onChange={(event) => setMemoInput(event.target.value)}
              placeholder="あとで整理するメモ"
              className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm"
            />
            <button type="button" onClick={addMemo} className="min-h-11 rounded-lg bg-slate-900 px-3 text-sm font-semibold text-white">
              追加
            </button>
          </div>
          <ul className="mt-2 space-y-2">
            {memos.slice(0, 6).map((memo) => (
              <li key={memo.id} className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <button
                  type="button"
                  onClick={() => moveMemoToTaskInput(memo.text)}
                  className="flex-1 break-words text-left text-slate-700 underline-offset-2 hover:underline"
                >
                  {memo.text}
                </button>
                <button type="button" onClick={() => deleteMemo(memo.id)} className="text-xs text-slate-500">
                  削除
                </button>
              </li>
            ))}
          </ul>
        </section>

        <form onSubmit={addTodo} className="mt-4 space-y-3">
          <input
            ref={taskInputRef}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="タスクを入力"
            className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />

          <div className="grid grid-cols-3 gap-2">
            {(["high", "medium", "low"] as Priority[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(value)}
                className={`min-h-11 rounded-lg border text-sm font-semibold ${
                  priority === value ? priorityStyles[value] : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {priorityLabel[value]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openDatePicker}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-xl"
              aria-label="期限を選択"
            >
              📅
            </button>
            <input
              ref={dateInputRef}
              type="date"
              value={dueDate}
              onChange={(event) => {
                const value = event.target.value;
                setDueDate(value);
                if (!value) {
                  setDueYear(currentYear);
                  setMonthDayInput("");
                  return;
                }

                const [year, month, day] = value.split("-");
                setDueYear(year || currentYear);
                setMonthDayInput(`${month || ""}${day || ""}`);
              }}
              className="h-0 w-0 opacity-0"
              tabIndex={-1}
              aria-hidden="true"
            />
            <input
              type="text"
              inputMode="numeric"
              placeholder="月日3-4桁 (例: 420 / 0420)"
              value={monthDayInput}
              onChange={(event) => handleMonthDayChange(event.target.value)}
              className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm"
            />
            {isYearEditOpen ? (
              <input
                type="text"
                inputMode="numeric"
                value={dueYear}
                onChange={(event) => handleYearChange(event.target.value)}
                className="min-h-11 w-20 rounded-lg border border-slate-300 px-2 text-center text-sm"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsYearEditOpen(true)}
                className="min-h-11 rounded-lg border border-slate-300 px-2 text-xs text-slate-600"
              >
                {dueYear}年
              </button>
            )}
            {dueDate && (
              <button
                type="button"
                onClick={() => {
                  setDueDate("");
                  setDueYear(currentYear);
                  setMonthDayInput("");
                  setIsYearEditOpen(false);
                }}
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              >
                解除
              </button>
            )}
          </div>

          <button type="submit" className="min-h-11 w-full rounded-lg bg-slate-900 text-sm font-semibold text-white">
            タスクを追加
          </button>
        </form>

        <div className="mt-4">
          <button
            type="button"
            onClick={runAiSuggestion}
            className="min-h-11 w-full rounded-lg border border-blue-300 bg-blue-50 text-sm font-semibold text-blue-700"
          >
            AIで今日の順番を提案
          </button>
        </div>

        {suggestedTodos.length > 0 && (
          <section className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <h2 className="text-sm font-bold text-blue-800">今日のおすすめ順</h2>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-blue-900">
              {suggestedTodos.map((todo) => (
                <li key={`suggest-${todo.id}`}>
                  {todo.title}（{priorityLabel[todo.priority]}）
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-5">
          <h2 className="text-base font-semibold">未完了タスク</h2>
          <ul className="mt-2 space-y-2">
            {activeTodos.length === 0 ? (
              <li className="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                未完了タスクはありません。
              </li>
            ) : (
              activeTodos.map(renderTodoCard)
            )}
          </ul>
        </section>

        <section className="mt-5">
          <button
            type="button"
            onClick={() => setShowCompleted((prev) => !prev)}
            className="min-h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-700"
          >
            完了タスク {showCompleted ? "を閉じる" : `を表示 (${completedTodos.length})`}
          </button>
          {showCompleted && <ul className="mt-2 space-y-2">{completedTodos.map(renderTodoCard)}</ul>}
        </section>
      </section>
    </main>
  );
}
