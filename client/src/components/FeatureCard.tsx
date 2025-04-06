interface TextPart {
  bold: boolean;
  text: string;
}

interface FeatureCardProps {
  title: string;
  description: TextPart[];
}

export default function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="bg-white border border-black p-6 rounded-lg flex flex-col items-center text-center shadow-sm">
      <h3 className="text-xl font-bold mb-4 text-black">{title}</h3>
      {description.map((part, index) => (
        <p key={index} className={`text-lg text-black ${part.bold ? 'font-bold mb-2' : ''}`}>
          {part.text}
        </p>
      ))}
    </div>
  );
}
