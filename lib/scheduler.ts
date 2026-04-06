export type Priority = "high" | "medium" | "low";

export type Todo = {
  id: string;
  title: string;
  priority: Priority;
  done: boolean;
  createdAt: number;
};

const priorityWeight: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1
};

function penaltyByIndex(index: number): number {
  // Lower rank items receive a stronger penalty to keep workload gentle.
  return index * 0.4;
}

export function suggestTodayOrder(todos: Todo[]): Todo[] {
  const active = todos.filter((todo) => !todo.done);

  return active
    .map((todo, index) => {
      const score = priorityWeight[todo.priority] - penaltyByIndex(index);
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
