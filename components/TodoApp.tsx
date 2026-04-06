"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  text: string;
  createdAt: number;
};

type TrashMessage = ChatMessage & {
  deletedAt: number;
};

type TodoPriority = "high" | "medium" | "low";

type TodoItem = {
  id: string;
  sourceMessageId: string;
  title: string;
  priority: TodoPriority;
  dueDate: string;
  done: boolean;
  completedAt?: number;
  createdAt: number;
};

type TrashTodo = TodoItem & {
  deletedAt: number;
};

const STORAGE_KEY = "chat-memo-messages";
const TRASH_STORAGE_KEY = "chat-memo-trash";
const TODO_STORAGE_KEY = "chat-memo-todos";
const TODO_TRASH_STORAGE_KEY = "chat-memo-todo-trash";
const TRASH_PURGE_DATE_KEY = "chat-memo-trash-purge-date";
const DONE_TO_TRASH_DELAY_MS = 3000;

const isSameDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMessageTime = (timestamp: number): string => {
  const sentAt = new Date(timestamp);
  const now = new Date();

  if (isSameDay(sentAt, now)) {
    return new Intl.DateTimeFormat("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(sentAt);
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(sentAt);
};

const isOverdue = (dueDate: string, done: boolean): boolean => {
  if (!dueDate || done) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  return due < today;
};

const priorityLabel: Record<TodoPriority, string> = {
  high: "高",
  medium: "中",
  low: "低"
};

const priorityTagClass: Record<TodoPriority, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-blue-100 text-blue-700 border-blue-200"
};

const priorityColumnClass: Record<TodoPriority, string> = {
  high: "border-red-200 bg-red-100/50",
  medium: "border-amber-200 bg-amber-100/50",
  low: "border-blue-200 bg-blue-100/50"
};

const TrashIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M7 6l1 14h8l1-14" />
    <path d="M10 10v7M14 10v7" />
  </svg>
);

const RestoreIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="M9 10H4V5" />
    <path d="M4 10a8 8 0 1 1 2.34 5.66" />
  </svg>
);

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default function TodoApp() {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [trashMessages, setTrashMessages] = useState<TrashMessage[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [todoTrash, setTodoTrash] = useState<TrashTodo[]>([]);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isTodoDialogOpen, setIsTodoDialogOpen] = useState(false);
  const [promoteTarget, setPromoteTarget] = useState<ChatMessage | null>(null);
  const [todoPriority, setTodoPriority] = useState<TodoPriority>("medium");
  const [todoDueDate, setTodoDueDate] = useState("");
  const todoMoveTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedTrash = localStorage.getItem(TRASH_STORAGE_KEY);
    const savedTodos = localStorage.getItem(TODO_STORAGE_KEY);
    const savedTodoTrash = localStorage.getItem(TODO_TRASH_STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } catch {
        // Ignore broken storage value and keep empty state.
      }
    }

    if (savedTrash) {
      try {
        const parsedTrash = JSON.parse(savedTrash) as TrashMessage[];
        if (Array.isArray(parsedTrash)) {
          setTrashMessages(parsedTrash);
        }
      } catch {
        // Ignore broken storage value and keep empty state.
      }
    }

    if (savedTodos) {
      try {
        const parsedTodos = JSON.parse(savedTodos) as TodoItem[];
        if (Array.isArray(parsedTodos)) {
          setTodos(parsedTodos);
        }
      } catch {
        // Ignore broken storage value and keep empty state.
      }
    }

    if (savedTodoTrash) {
      try {
        const parsedTodoTrash = JSON.parse(savedTodoTrash) as TrashTodo[];
        if (Array.isArray(parsedTodoTrash)) {
          setTodoTrash(parsedTodoTrash);
        }
      } catch {
        // Ignore broken storage value and keep empty state.
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trashMessages));
  }, [trashMessages]);

  useEffect(() => {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(TODO_TRASH_STORAGE_KEY, JSON.stringify(todoTrash));
  }, [todoTrash]);

  const clearAllTrashForToday = () => {
    setTrashMessages([]);
    setTodoTrash([]);
    localStorage.setItem(TRASH_PURGE_DATE_KEY, formatDateKey(new Date()));
  };

  useEffect(() => {
    const todayKey = formatDateKey(new Date());
    const lastPurgeDate = localStorage.getItem(TRASH_PURGE_DATE_KEY);
    if (lastPurgeDate !== todayKey) {
      clearAllTrashForToday();
    }

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const waitMs = nextMidnight.getTime() - now.getTime();

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timeoutId = setTimeout(() => {
      clearAllTrashForToday();
      intervalId = setInterval(() => {
        clearAllTrashForToday();
      }, 24 * 60 * 60 * 1000);
    }, waitMs);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const handleSend = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const nextMessage: ChatMessage = {
      id: crypto.randomUUID(),
      text: trimmed,
      createdAt: Date.now()
    };

    setMessages((prev) => [...prev, nextMessage]);
    setInputText("");
  };

  const moveToTrash = (id: string) => {
    const target = messages.find((message) => message.id === id);
    if (!target) return;

    setMessages((prev) => prev.filter((message) => message.id !== id));
    setTrashMessages((prev) => [...prev, { ...target, deletedAt: Date.now() }]);
  };

  const clearTrash = () => {
    setTrashMessages([]);
    setTodoTrash([]);
    localStorage.setItem(TRASH_PURGE_DATE_KEY, formatDateKey(new Date()));
  };

  const restoreFromTrash = (id: string) => {
    const target = trashMessages.find((message) => message.id === id);
    if (!target) return;

    setTrashMessages((prev) => prev.filter((message) => message.id !== id));
    setMessages((prev) => [...prev, { id: target.id, text: target.text, createdAt: target.createdAt }]);
  };

  const openTodoDialog = (message: ChatMessage) => {
    setPromoteTarget(message);
    setTodoPriority("medium");
    setTodoDueDate("");
    setIsTodoDialogOpen(true);
  };

  const closeTodoDialog = () => {
    setIsTodoDialogOpen(false);
    setPromoteTarget(null);
  };

  const addTodoFromMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!promoteTarget) return;

    const newTodo: TodoItem = {
      id: crypto.randomUUID(),
      sourceMessageId: promoteTarget.id,
      title: promoteTarget.text,
      priority: todoPriority,
      dueDate: todoDueDate,
      done: false,
      createdAt: Date.now()
    };

    setTodos((prev) => [newTodo, ...prev]);
    closeTodoDialog();
  };

  const toggleTodoDone = (id: string) => {
    const timer = todoMoveTimersRef.current[id];
    if (timer) {
      clearTimeout(timer);
      delete todoMoveTimersRef.current[id];
    }

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              done: !todo.done,
              completedAt: !todo.done ? Date.now() : undefined
            }
          : todo
      )
    );
  };

  const restoreTodoFromTrash = (id: string) => {
    const target = todoTrash.find((todo) => todo.id === id);
    if (!target) return;

    const restored: TodoItem = {
      id: target.id,
      sourceMessageId: target.sourceMessageId,
      title: target.title,
      priority: target.priority,
      dueDate: target.dueDate,
      done: false,
      completedAt: undefined,
      createdAt: target.createdAt
    };

    setTodoTrash((prev) => prev.filter((todo) => todo.id !== id));
    setTodos((prev) => [restored, ...prev]);
  };

  useEffect(() => {
    const moveDoneTodoToTrash = (todoId: string) => {
      setTodos((prevTodos) => {
        const target = prevTodos.find((todo) => todo.id === todoId);
        if (!target || !target.done) {
          return prevTodos;
        }

        setTodoTrash((prevTrash) => {
          if (prevTrash.some((item) => item.id === target.id)) {
            return prevTrash;
          }
          return [
            {
              ...target,
              deletedAt: Date.now()
            },
            ...prevTrash
          ];
        });

        return prevTodos.filter((todo) => todo.id !== todoId);
      });
      delete todoMoveTimersRef.current[todoId];
    };

    const activeIds = new Set(todos.map((todo) => todo.id));
    Object.keys(todoMoveTimersRef.current).forEach((todoId) => {
      if (!activeIds.has(todoId)) {
        clearTimeout(todoMoveTimersRef.current[todoId]);
        delete todoMoveTimersRef.current[todoId];
      }
    });

    todos.forEach((todo) => {
      if (!todo.done) {
        return;
      }

      const completedAt = todo.completedAt ?? Date.now();
      const elapsed = Date.now() - completedAt;
      const remaining = Math.max(0, DONE_TO_TRASH_DELAY_MS - elapsed);

      if (remaining === 0) {
        moveDoneTodoToTrash(todo.id);
        return;
      }

      if (!todoMoveTimersRef.current[todo.id]) {
        todoMoveTimersRef.current[todo.id] = setTimeout(() => {
          moveDoneTodoToTrash(todo.id);
        }, remaining);
      }
    });
  }, [todos]);

  useEffect(() => {
    return () => {
      Object.values(todoMoveTimersRef.current).forEach((timer) => clearTimeout(timer));
      todoMoveTimersRef.current = {};
    };
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl bg-[#f8f9fb] px-4 py-6">
      <header className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <h1 className="text-xl font-semibold text-slate-800">自分専用チャットメモ</h1>
        <p className="mt-1 text-sm text-slate-500">思いついたことを気軽にメモするだけのシンプル版です。</p>
      </header>

      <div className="grid gap-4">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-800">ToDoリスト</h2>
          <p className="mt-1 text-xs text-slate-500">チャットメモから昇格したタスクを管理します。</p>

          {todos.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-400">
              まだToDoがありません。
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {(["high", "medium", "low"] as TodoPriority[]).map((priority) => {
                const grouped = todos.filter((todo) => todo.priority === priority);
                return (
                  <section key={priority} className={`rounded-xl border p-3 ${priorityColumnClass[priority]}`}>
                    <h3 className="text-sm font-semibold text-slate-700">優先度: {priorityLabel[priority]}</h3>
                    <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto pr-1">
                      {grouped.length === 0 ? (
                        <li className="rounded-md bg-white/70 p-2 text-xs text-slate-500">タスクなし</li>
                      ) : (
                        grouped.map((todo) => {
                          const overdue = isOverdue(todo.dueDate, todo.done);
                          return (
                            <li
                              key={todo.id}
                              className={`rounded-lg border bg-white/90 px-3 py-2 ${
                                overdue ? "border-red-300 ring-1 ring-red-200" : "border-white/60"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <input
                                  type="checkbox"
                                  checked={todo.done}
                                  onChange={() => toggleTodoDone(todo.id)}
                                  className="mt-1 h-4 w-4"
                                  aria-label="タスク完了を切り替え"
                                />
                                <div className="flex-1">
                                  <p className={`text-sm text-slate-700 ${todo.done ? "line-through opacity-60" : ""}`}>
                                    {todo.title}
                                  </p>
                                  <p className={`mt-1 text-xs ${overdue ? "font-semibold text-red-700" : "text-slate-500"}`}>
                                    期限: {todo.dueDate || "未設定"}
                                  </p>
                                  {todo.done && <p className="mt-1 text-xs text-slate-500">完了: 3秒後にゴミ箱へ移動</p>}
                                  <div className="mt-1">
                                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${priorityTagClass[todo.priority]}`}>
                                      {priorityLabel[todo.priority]}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </aside>

        <section className="flex min-h-[70vh] flex-col">
          <section className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-48 items-center justify-center text-sm text-slate-400">
                まだメモがありません。下の入力欄から送信してください。
              </div>
            ) : (
              <ul className="space-y-3">
                {messages.map((message) => (
                  <li key={message.id} className="flex justify-end">
                    <div className="max-w-[92%]">
                      <div className="rounded-2xl rounded-br-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-sm">
                        <div className="flex items-start gap-2">
                          <p className="flex-1 break-words">{message.text}</p>
                          <button
                            type="button"
                            onClick={() => openTodoDialog(message)}
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100"
                          >
                            ToDoに追加
                          </button>
                          <button
                            type="button"
                            onClick={() => moveToTrash(message.id)}
                            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                            aria-label="メモを削除"
                            title="メモを削除"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 pr-1 text-right text-xs text-slate-400">{formatMessageTime(message.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form
            onSubmit={handleSend}
            className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3"
          >
            <input
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="メモを入力..."
              className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400"
            />
            <button
              type="submit"
              className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              送信
            </button>
          </form>

          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsTrashOpen((prev) => !prev)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="ゴミ箱を開閉"
                title="ゴミ箱を開閉"
              >
                <TrashIcon className="h-4 w-4" />
                <span>({trashMessages.length + todoTrash.length})</span>
                <ChevronIcon className={`h-4 w-4 transition ${isTrashOpen ? "rotate-180" : ""}`} />
              </button>
              {trashMessages.length + todoTrash.length > 0 && (
                <button
                  type="button"
                  onClick={clearTrash}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="ゴミ箱を空にする"
                  title="ゴミ箱を空にする"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {isTrashOpen && (
              <ul className="mt-3 space-y-2">
                {trashMessages.length + todoTrash.length === 0 ? (
                  <li className="rounded-lg border border-dashed border-slate-200 p-3 text-sm text-slate-400">
                    空です。
                  </li>
                ) : (
                  <>
                    {[...trashMessages]
                      .sort((a, b) => b.deletedAt - a.deletedAt)
                      .map((message) => (
                        <li key={`trash-${message.id}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="break-words text-sm text-slate-600">{message.text}</p>
                              <p className="mt-1 text-right text-xs text-slate-400">
                                メモ / 移動: {formatMessageTime(message.deletedAt)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => restoreFromTrash(message.id)}
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                              aria-label="メモを復元"
                              title="メモを復元"
                            >
                              <RestoreIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    {[...todoTrash]
                      .sort((a, b) => b.deletedAt - a.deletedAt)
                      .map((todo) => (
                        <li key={`todo-trash-${todo.id}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <p className="break-words text-sm text-slate-600 line-through opacity-70">{todo.title}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                優先度: {priorityLabel[todo.priority]} / 期限: {todo.dueDate || "未設定"}
                              </p>
                              <p className="mt-1 text-right text-xs text-slate-400">
                                ToDo完了 / 移動: {formatMessageTime(todo.deletedAt)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => restoreTodoFromTrash(todo.id)}
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                              aria-label="ToDoを復元"
                              title="ToDoを復元"
                            >
                              <RestoreIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                  </>
                )}
              </ul>
            )}
          </section>
        </section>
      </div>

      {isTodoDialogOpen && promoteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-800">ToDoに追加</h3>
            <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-600">{promoteTarget.text}</p>

            <form onSubmit={addTodoFromMessage} className="mt-3 space-y-3">
              <label className="block text-xs text-slate-600">
                優先度
                <select
                  value={todoPriority}
                  onChange={(event) => setTodoPriority(event.target.value as TodoPriority)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm"
                >
                  <option value="high">高</option>
                  <option value="medium">中</option>
                  <option value="low">低</option>
                </select>
              </label>

              <label className="block text-xs text-slate-600">
                期限
                <input
                  type="date"
                  value={todoDueDate}
                  onChange={(event) => setTodoDueDate(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-sm"
                />
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeTodoDialog}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                >
                  キャンセル
                </button>
                <button type="submit" className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
                  追加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
