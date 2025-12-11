// src/features/test/model/useTestTasks.ts
import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';

export type QuestionType = 0 | 1;

export interface IAnswers {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface ITestQuestion {
  id: number;
  question: string;
  typeQuestion: QuestionType;
  instructions: string;
  answers: IAnswers[];
}

export interface ITestTask {
  id: number;
  imageSrcs: string[];
  testsQuestions: ITestQuestion[];
}

const parseQuestionExcel = (data: ArrayBuffer): ITestTask[] => {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  // Пропускаем первые 6 строк (0–5), данные начинаются с 6-й
  const dataRows = raw.slice(6);

  return dataRows
    .filter((row): row is unknown[] =>
      Array.isArray(row) &&
      row.length >= 9 &&
      row[0] === 'testTask'
    )
    .map((row, idx) => {
      const taskId = idx + 1;

      // Явно приводим к string/number — защита от null/undefined
      const questionText = String(row[2] ?? '').trim();
      const img = String(row[7] ?? '').trim();
      const answerNumRaw = row[8];
      const answerNum = typeof answerNumRaw === 'number'
        ? answerNumRaw
        : typeof answerNumRaw === 'string' && answerNumRaw.trim() !== ''
          ? Number(answerNumRaw)
          : NaN;

      const correctAnswerIndex1Based = Number.isFinite(answerNum) ? answerNum : 0;

      // Варианты ответов: V1–V4 → столбцы 3–6
      const options = [3, 4, 5, 6].map(i => String(row[i] ?? '').trim()).filter(v => v !== '');

      const answers: IAnswers[] = options.map((text, i) => ({
        id: i + 1,
        text,
        isCorrect: i + 1 === correctAnswerIndex1Based, // ← 1-based сравнение!
      }));

      if (answers.length === 0) {
        answers.push({ id: 1, text: '—', isCorrect: false });
      }

      return {
        id: taskId,
        imageSrcs: img ? [`/images/${img}`] : [],
        testsQuestions: [{
          id: taskId,
          question: questionText || `Задание ${taskId}`,
          typeQuestion: 0,
          instructions: 'Выберите один правильный вариант.',
          answers,
        }],
      };
    });
};

export function useTestTasks() {
  const [tasks, setTasks] = useState<ITestTask[]>([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, Record<number, number[]>>>({});
  const [taskStartTimes, setTaskStartTimes] = useState<Record<number, number>>({});
  const [taskDurations, setTaskDurations] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка Excel
  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/Question.xlsx');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ab = await res.arrayBuffer();
        setTasks(parseQuestionExcel(ab));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError('Не удалось загрузить Question.xlsx. Проверьте /public/');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Запуск таймера при входе на задание (первый раз или повторно)
  useEffect(() => {
    if (tasks.length === 0) return;
    const taskId = tasks[currentTaskIndex]?.id;
    if (!taskId) return;

    const now = Date.now();
    setTaskStartTimes(prev => ({
      ...prev,
      [taskId]: now,
    }));
  }, [currentTaskIndex, tasks]);

  // При уходе с задания — фиксируем время
  const handleTaskChange = (index: number) => {
    if (index < 0 || index >= tasks.length) return;

    const oldTaskId = tasks[currentTaskIndex]?.id;
    if (oldTaskId) {
      const startTime = taskStartTimes[oldTaskId];
      if (startTime) {
        const elapsed = Date.now() - startTime;
        setTaskDurations(prev => ({
          ...prev,
          [oldTaskId]: (prev[oldTaskId] || 0) + elapsed,
        }));
      }
    }

    setCurrentTaskIndex(index);
  };

  // При завершении — фиксируем последнее задание
  const finalizeLastTaskTime = () => {
    const lastTaskId = tasks[currentTaskIndex]?.id;
    if (lastTaskId && taskStartTimes[lastTaskId]) {
      const elapsed = Date.now() - taskStartTimes[lastTaskId];
      setTaskDurations(prev => ({
        ...prev,
        [lastTaskId]: (prev[lastTaskId] || 0) + elapsed,
      }));
    }
  };

  const toggleAnswer = (
    taskId: number,
    questionIndex: number,
    answerIndex: number,
    typeQuestion: QuestionType
  ) => {
    setSelectedAnswers(prev => {
      const taskAns = { ...(prev[taskId] || {}) };
      const cur = taskAns[questionIndex] ? [...taskAns[questionIndex]] : [];
      taskAns[questionIndex] = typeQuestion === 0 ? [answerIndex] : cur.includes(answerIndex)
        ? cur.filter(i => i !== answerIndex)
        : [...cur, answerIndex];
      return { ...prev, [taskId]: taskAns };
    });
  };

  const getSelectedFor = (taskId: number, questionIndex: number): number[] =>
    selectedAnswers[taskId]?.[questionIndex] ?? [];

  const completionByTask = useMemo(() => {
    return tasks.map(task => {
      const ans = selectedAnswers[task.id] || {};
      const total = task.testsQuestions.length;
      const answered = Object.values(ans).filter(a => a.length > 0).length;
      return { taskId: task.id, totalQuestions: total, answeredCount: answered, isComplete: answered === total };
    });
  }, [selectedAnswers, tasks]);

  const isAllTasksComplete = useMemo(
    () => tasks.length > 0 && completionByTask.every(t => t.isComplete),
    [completionByTask, tasks]
  );

  const exportToResult = () => {
    if (!isAllTasksComplete) return;

    finalizeLastTaskTime(); // зафиксировать последнее задание

    // 🔹 Вычисляем общее время ПОСЛЕ финализации последнего задания
  const totalDurationMs = Object.values(taskDurations).reduce((sum, d) => sum + d, 0);
  const totalSec = Math.floor(totalDurationMs / 1000);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const totalDurationStr = `${pad(Math.floor(totalSec / 3600))}:${pad(Math.floor((totalSec % 3600) / 60))}:${pad(totalSec % 60)}`;

    // Подготавливаем данные с 9-й строки → т.е. 2 "пустые" строки + заголовки + 100 строк
    const headerRow = ['Задание', 'Ответ', 'Время прохождения', 'Баллы'];
    const rows: (string | number)[][] = [
      ["ФИО"],
      ["Группа"],
      ["Роль"],
      ["Возраст"],
      ["Пол"],
      ["Сложность"],
      ["Общее время", totalDurationStr],
      [],
      headerRow,
    ];

    // Добавляем 100 строк с результатами
    tasks.forEach(task => {
      const q = task.testsQuestions[0];
      const selectedIndices = selectedAnswers[task.id]?.[0] || [];
      const userAnswerIndex0Based = selectedIndices[0] ?? -1;
      const userAnswer1Based = userAnswerIndex0Based >= 0 ? userAnswerIndex0Based + 1 : 0; // ← 1-based!

      const correctAnswer1Based = q.answers.findIndex(a => a.isCorrect) + 1;
      const isCorrect = userAnswer1Based === correctAnswer1Based;

      const durationMs = taskDurations[task.id] || 0;
      const totalSec = Math.floor(durationMs / 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const timeStr = `${pad(Math.floor(totalSec / 3600))}:${pad(Math.floor((totalSec % 3600) / 60))}:${pad(totalSec % 60)}`;

      rows.push([
        `Задание ${task.id}`,
        userAnswer1Based || '—',
        timeStr,
        isCorrect ? 1 : 0,
      ]);
    });

    // Создаём Excel вручную (чтобы контролировать пустые строки)
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Результаты');
    XLSX.writeFile(wb, 'Result.xlsx');
  };

const isCurrentTaskAnswered = useMemo(() => {
  if (tasks.length === 0) return false;
  const currentTask = tasks[currentTaskIndex];
  const answersForTask = selectedAnswers[currentTask.id] || {};
  return (answersForTask[0]?.length || 0) > 0;
}, [currentTaskIndex, selectedAnswers, tasks]);

  return {
    tasks,
    currentTaskIndex,
    isLoading,
    isError: !!error,
    errorMessage: error,
    handleTaskChange,
    toggleAnswer,
    getSelectedFor,
    completionByTask,
    isAllTasksComplete,
    exportToResult,
    isCurrentTaskAnswered,
  };
}