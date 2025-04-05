interface StatsCardProps {
  title: string;
  value: string;
}

export default function StatsCard({ title, value }: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-300 shadow-sm">
      <h3 className="text-lg font-medium text-black mb-2">{title}</h3>
      <p className="text-2xl font-bold text-black">{value}</p>
    </div>
  );
}
