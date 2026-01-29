import { ReactNode } from "react";

interface QuestionCardProps {
  title: string;
  children: ReactNode;
}

export default function QuestionCard({ title, children }: QuestionCardProps) {
  return (
    <div className="bg-white rounded-md border border-[#E5E5E5] p-6">
      <h3 className="font-[family-name:var(--font-newsreader)] text-xl font-medium text-[#1A1A1A] mb-5">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
