import { createInstance, RequestOptions } from "./api-instance";

// DTO

export type QuestionType = 0 | 1; // 0: Один ответ , 1: Множественный ответ

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

export interface GetTestTasksDataDto {
  items: ITestTask[];
}

// export type SubmitTestAnswersBodyDto = {
//   answers: Record<number, Record<number, number[]>>;
// };

export interface ISelectedAnswer {
  id: number;
}

export interface ISelectedQuestion {
  questionId: number,
  selectedAnswers: number[]
}

export interface ISelectedCase {
  caseId: number,
  answers: ISelectedQuestion[]
}

export interface SubmitTestAnswersBodyDto {
  items: ISelectedCase[],
  duration: number,
};


// API

//+
export const getTestTasks = (tasksId: string, options?: RequestOptions) =>
  createInstance<GetTestTasksDataDto>(
    { url: `/test/test-tasks/${tasksId}`, method: "GET" },
    options
  );
//+
export const submitTestAnswers = (
  body: SubmitTestAnswersBodyDto,
  options?: RequestOptions
) =>
  createInstance<void>(
    {
      url: `/test/submit-answers/`,
      method: "POST",
      data: body,
    },
    options
  );

export const testApi = {
  getTestTasks,
  submitTestAnswers,
};
