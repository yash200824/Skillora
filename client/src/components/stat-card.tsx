import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  bgColor?: string;
}

export default function StatCard({ title, value, icon, bgColor = "bg-primary-50" }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <h3 className="mt-1 text-xl font-semibold text-neutral-900">{value}</h3>
        </div>
        <div className={`p-2 ${bgColor} rounded-full`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
