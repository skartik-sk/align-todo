import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import 'dotenv/config';
import type { Request, Response } from 'express';
import express from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware, type AuthRequest, SECRET_KEY } from './mid/auth';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());


app.post('/signup', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});


app.get('/todos', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const todos = await prisma.todo.findMany({
    where: { userId: req.userId }
  });
  res.json(todos);
});

app.post('/todos', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { title } = req.body;
  
  const todo = await prisma.todo.create({
    data: { 
      title, 
      userId: req.userId 
    }
  });
  res.json(todo);
});


app.put('/todos/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;
  if (!id || Array.isArray(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { completed, title } = req.body;
  const todoId = parseInt(id);

  const existingTodo = await prisma.todo.findUnique({ where: { id: todoId } });

  if (!existingTodo || existingTodo.userId !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const updated = await prisma.todo.update({
    where: { id: todoId },
    data: { completed, title }
  });
  res.json(updated);
});

app.delete('/todos/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { id } = req.params;

  if(!id){
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  if (Array.isArray(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const todoId = parseInt(id);

  const existingTodo = await prisma.todo.findUnique({ where: { id: todoId } });

  if (!existingTodo || existingTodo.userId !== req.userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await prisma.todo.delete({ where: { id: todoId } });
  res.json({ message: "Deleted" });
});

// Export for Vercel serverless
export default app;

// Local development
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});