"use client";

import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { ITestTask as AnotherApiITestTask } from "../api/testApi";

type CompatibleITestTask = AnotherApiITestTask;

export function UiProgressBar({
  className,
  tasks,
  numOfCurrentTask,
  completionByTask,
  changeCurrentTask,
}: {
  className?: string;
  tasks: CompatibleITestTask[];
  numOfCurrentTask: number;
  completionByTask?: { taskId: number; isComplete: boolean }[];
  changeCurrentTask?: (index: number) => void;
}) {
  return (
    <div className="relative h-14 mx-auto overflow-x-auto overflow-y-hidden custom-scrollbar max-w-[60svw] border-[#DEDEDE] bg-[#FFFFFF] rounded-[20px] shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
      <div className={clsx(className, "relative flex h-10 px-3 w-max py-1")}>
        {tasks.map((task: CompatibleITestTask, index: number) => {
          const completion = completionByTask?.find(
            (t) => t.taskId === task.id
          );
          const isComplete = completion?.isComplete ?? false;
          const isCurrent = index === numOfCurrentTask;

          return (
            <div
              key={task.id}
              className="relative flex justify-center items-center"
            >
              {/* Активный кружок (анимируется поверх кнопки) */}
              <AnimatePresence>
                {isCurrent && (
                  <motion.div
                    layoutId="activeTask"
                    className="absolute w-9 h-9 bg-[#2997F1] rounded-full shadow-md z-10"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Кнопка номера шага */}
              <button
                onClick={() => changeCurrentTask?.(index)}
                disabled
                className={clsx(
                  "relative flex w-9 h-9 flex-shrink-0 justify-center items-center font-medium text-[15px] transition-all duration-200",
                  {
                    "text-white z-20": isCurrent,
                    "border-b-[2px] border-[#2997F1] text-[#2997F1]":
                      isComplete && !isCurrent,
                    "text-gray-500 hover:text-[#2997F1]":
                      !isComplete && !isCurrent,
                  }
                )}
              >
                {index + 1}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
