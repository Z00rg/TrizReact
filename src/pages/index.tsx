import { TestTasks } from "@/features/test";
import Head from "next/head";

export default function HomePage() {
  return (
    <div className="flex flex-col w-full min-h-screen lg:min-h-[667px]">
      <Head>
        <title>Тестирование</title>
      </Head>
      <TestTasks />
    </div>
  );
}
