import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as todoService from '../services/todoService';
import type { Todo } from '../services/todoService';

type FilterType = 'all' | 'pending' | 'completed';

export default function TodosScreen() {
  const { token, logout } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadTodos();
  }, [token, filter]);

  async function loadTodos() {
    if (!token) return;
    setLoading(true);
    try {
      const data = await todoService.getTodos(token);
      setTodos(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTodo() {
    if (!newTodoTitle.trim()) {
      Alert.alert('Error', 'Please enter a todo title');
      return;
    }

    setSubmitting(true);
    try {
      const newTodo = await todoService.createTodo(token!, newTodoTitle);
      setTodos([newTodo, ...todos]);
      setNewTodoTitle('');
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (err) {
      Alert.alert('Error', 'Failed to create todo');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleComplete(todo: Todo) {
    try {
      const updated = await todoService.updateTodo(token!, todo.id, {
        completed: !todo.completed,
      });
      setTodos(todos.map((t) => (t.id === todo.id ? updated : t)));
    } catch (err) {
      Alert.alert('Error', 'Failed to update todo');
    }
  }

  async function handleDeleteTodo(id: number) {
    Alert.alert('Delete Todo', 'Are you sure you want to delete this todo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await todoService.deleteTodo(token!, id);
            setTodos(todos.filter((t) => t.id !== id));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete todo');
          }
        },
      },
    ]);
  }

  function startEditing(todo: Todo) {
    setEditingId(todo.id);
    setEditTitle(todo.title);
  }

  async function saveEdit(id: number) {
    if (!editTitle.trim()) {
      Alert.alert('Error', 'Title cannot be empty');
      return;
    }

    try {
      const updated = await todoService.updateTodo(token!, id, { title: editTitle });
      setTodos(todos.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
      setEditTitle('');
    } catch (err) {
      Alert.alert('Error', 'Failed to update todo');
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
  }

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'pending') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const pendingCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  function renderTodo({ item }: { item: Todo }) {
    const isEditing = editingId === item.id;

    return (
      <View style={styles.todoItem}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleToggleComplete(item)}
        >
          <View style={[styles.checkboxInner, item.completed && styles.checkboxChecked]}>
            {item.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editTitle}
              onChangeText={setEditTitle}
              autoFocus
              onSubmitEditing={() => saveEdit(item.id)}
            />
            <TouchableOpacity onPress={() => saveEdit(item.id)} style={styles.editButton}>
              <Text style={styles.editButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelEdit} style={styles.editButton}>
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.todoContent}>
            <Text style={[styles.todoTitle, item.completed && styles.todoTitleCompleted]}>
              {item.title}
            </Text>
            <View style={styles.todoActions}>
              <TouchableOpacity onPress={() => startEditing(item)} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteTodo(item.id)}
                style={[styles.actionButton, styles.deleteButton]}
              >
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Todos</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>Pending: {pendingCount}</Text>
        <Text style={styles.counterText}>Completed: {completedCount}</Text>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'pending', 'completed'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new todo..."
          placeholderTextColor="#999"
          value={newTodoTitle}
          onChangeText={setNewTodoTitle}
          onSubmitEditing={handleAddTodo}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddTodo}
          disabled={submitting || !newTodoTitle.trim()}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.addButtonText}>+</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : filteredTodos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No todos found</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredTodos}
          renderItem={renderTodo}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  logoutButton: {
    padding: 8,
  },
  logoutButtonText: {
    color: '#000',
    fontSize: 14,
  },
  counterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  counterText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  filterButton: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#000',
  },
  filterButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  addButton: {
    width: 48,
    height: 48,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#000',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  todoContent: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  todoTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  todoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionButtonText: {
    color: '#000',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  deleteButton: {},
  deleteButtonText: {
    color: '#000',
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 16,
    color: '#000',
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    color: '#000',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
