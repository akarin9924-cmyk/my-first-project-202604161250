export type Priority = "high" | "medium" | "low";

export type Todo = {
  id: string;
  title: string;
  priority: Priority;
  dueDate: string;
  done: boolean;
  createdAt: number;
};

const priorityWeight: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1
};

function dueDateUrgencyWeight(dueDate: string): number {
  if (!dueDate) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(`${dueDate}T00:00:00`);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return 2.2;
  if (diffDays === 0) return 1.8;
  if (diffDays === 1) return 1.2;
  if (diffDays <= 3) return 0.6;
  return 0.2;
}

export function suggestTodayOrder(todos: Todo[], lowLoad = true): Todo[] {
  const active = todos.filter((todo) => !todo.done && todo.title.trim().length > 0);

  return active
    .map((todo) => {
      const base = priorityWeight[todo.priority];
      const urgency = dueDateUrgencyWeight(todo.dueDate);
      // In low-load mode, favor tasks that are both urgent and clearly important.
      const lowLoadBoost = lowLoad && todo.priority !== "low" ? 0.2 : 0;
      const score = base + urgency + lowLoadBoost;
      return { todo, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.todo.createdAt - b.todo.createdAt;
    })
    .map((entry) => entry.todo);
}
