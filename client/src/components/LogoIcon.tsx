import logoPath from '../assets/logoduck.svg';

export default function LogoIcon({ className }: { className?: string }) {
  return (
    <img src={logoPath} alt="CancelMySub Logo" className={className} />
  );
}
