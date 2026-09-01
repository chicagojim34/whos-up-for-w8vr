import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';

interface NotFoundProps {
  title?: string;
  body?: string;
}

export default function NotFound({
  title = 'This page does not exist',
  body = 'The link may be mistyped, or whatever was here has been taken down.',
}: NotFoundProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-24 max-w-md mx-auto animate-fade-in">
      <span className="w-16 h-16 rounded-full bg-surface-high flex items-center justify-center text-text-light mb-5">
        <Compass size={32} aria-hidden="true" />
      </span>
      <h1 className="font-headline font-black text-2xl text-text-dark text-balance">{title}</h1>
      <p className="text-sm text-text-medium mt-2 leading-relaxed">{body}</p>
      <div className="flex gap-2 mt-6">
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Back to the feed
        </button>
        <button onClick={() => navigate('/discovery')} className="btn btn-outline">
          Explore the map
        </button>
      </div>
    </div>
  );
}
