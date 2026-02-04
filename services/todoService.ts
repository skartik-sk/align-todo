const API_URL = 'http://localhost:3000';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export async function getTodos(token: string): Promise<Todo[]> {
  const res = await fetch(`${API_URL}/todos`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json();
}

export async function createTodo(token: string, title: string): Promise<Todo> {
  const res = await fetch(`${API_URL}/todos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create todo');
  return res.json();
}

export async function updateTodo(
  token: string,
  id: number,
  data: { title?: string; completed?: boolean }
): Promise<Todo> {
  const res = await fetch(`${API_URL}/todos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update todo');
  return res.json();
}

export async function deleteTodo(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_URL}/todos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete todo');
}
