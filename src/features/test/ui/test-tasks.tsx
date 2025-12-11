import { UiCheckBox } from "@/shared/ui/ui-checkbox";
import { UiProgressBar } from "@/shared/ui/ui-progress-bar";
import { UiScrollImg } from "@/shared/ui/ui-scroll-img";
import { UiTextArea } from "@/shared/ui/ui-textarea";
import clsx from "clsx";
import { useTestTasks } from "../model/use-test-tasks";
import { UiSpinner } from "@/shared/ui/ui-spinner";
import { ITestQuestion, IAnswers } from "@/shared/api/testApi";

export function TestTasks() {
  const {
    tasks,
    currentTaskIndex,
    isLoading,
    isError,
    handleTaskChange,
    exportToResult,
    getSelectedFor,
    toggleAnswer,
    completionByTask,
    isAllTasksComplete,
    isCurrentTaskAnswered,
  } = useTestTasks();

  return (
    <div className="flex flex-col w-full gap-3 flex-1 mb-4 px-5 mt-5">
      {isLoading && (
        <div className="flex justify-center items-center w-full h-full">
          <UiSpinner />
        </div>
      )}

      {!isLoading && !isError && tasks.length === 0 && (
        <div className="font-bold text-gray-700">
          Нет доступных заданий. Убедитесь, что файл Question.xlsx лежит в
          /public/
        </div>
      )}

      {tasks.length > 0 && (
        <>
          <UiProgressBar
            numOfCurrentTask={currentTaskIndex}
            tasks={tasks}
            completionByTask={completionByTask}
            changeCurrentTask={handleTaskChange}
          />

          <UiScrollImg
            key={currentTaskIndex}
            img={tasks[currentTaskIndex].imageSrcs}
            height="h-[50svh]"
          />

          <UiTextArea
            contentKey={currentTaskIndex}
            className="mt-5 gap-3 text-[13px] items-start"
            height="h-[32svh]"
          >
            <div className="font-bold text-[15px]">Выполните задание:</div>

            {tasks[currentTaskIndex].testsQuestions.map(
              (item: ITestQuestion, questionIndex: number) => {
                const taskId = tasks[currentTaskIndex].id;
                const selectedForThis = getSelectedFor(taskId, questionIndex);

                return (
                  <div
                    className="flex flex-col gap-2 w-full text-[13px] pb-5 border-b-2 border-[#BDBDBD]"
                    key={`${taskId}-${questionIndex}`}
                  >
                    <div className="flex w-full">
                      <span>
                        <span className="font-bold">Задание:</span>{" "}
                        {item.question}
                      </span>
                    </div>

                    <div className="flex w-full">
                      <span>
                        <span className="font-bold">Инструкция:</span>{" "}
                        {item.instructions}
                      </span>
                    </div>

                    {item.answers.map(
                      (answer: IAnswers, answerIndex: number) => {
                        const isChecked = selectedForThis.includes(answerIndex);
                        return (
                          <div
                            key={`${taskId}-${questionIndex}-${answerIndex}`}
                            className={clsx(
                              "flex items-center gap-3 cursor-pointer select-none border-b border-[#E0E0E0] px-3 py-3 rounded-xl transition-all duration-200 ease-out",
                              {
                                "hover:bg-blue-50 hover:border-blue-400 hover:shadow-md hover:scale-[1.01]":
                                  true,
                                "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-400 shadow-md":
                                  isChecked,
                              }
                            )}
                            onClick={() =>
                              toggleAnswer(
                                taskId,
                                questionIndex,
                                answerIndex,
                                item.typeQuestion
                              )
                            }
                          >
                            <div className="text-gray-700 font-semibold">
                              {answerIndex + 1}.
                            </div>

                            <div className="break-words whitespace-normal flex-1 text-gray-800 text-left">
                              {answer.text}
                            </div>

                            <div
                              className="ml-auto w-6 h-6 flex justify-center items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <UiCheckBox
                                checked={isChecked}
                                onChange={() =>
                                  toggleAnswer(
                                    taskId,
                                    questionIndex,
                                    answerIndex,
                                    item.typeQuestion
                                  )
                                }
                                id={`chk-${taskId}-${item.id}-${answer.id}`}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                );
              }
            )}
          </UiTextArea>

          {/* Навигационные кнопки */}
          <div className="flex w-[60svw] mx-auto">
            <button
              className={clsx(
                { hidden: currentTaskIndex === tasks.length - 1 },
                "ml-auto text-[#2E76AA] hover:text-[#26628A] text-[20px] font-normal cursor-pointer",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              onClick={() => handleTaskChange(currentTaskIndex + 1)}
              disabled={!isCurrentTaskAnswered}
            >
              Далее
            </button>

            <button
              className={clsx(
                "ml-auto text-[#2E76AA] hover:text-[#26628A] text-[20px] font-normal cursor-pointer",
                {
                  "text-gray-400 hover:text-gray-400 cursor-not-allowed hidden":
                    !isAllTasksComplete,
                }
              )}
              onClick={exportToResult}
              disabled={!isAllTasksComplete}
            >
              Закончить и скачать xlsx
            </button>
          </div>
        </>
      )}
    </div>
  );
}
