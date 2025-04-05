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
    <div className="bg-white p-6 rounded-lg flex flex-col items-center text-center">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      {description.map((part, index) => (
        <p key={index} className={`text-lg ${part.bold ? 'font-bold mb-2' : ''}`}>
          {part.text}
        </p>
      ))}
    </div>
  );
}
