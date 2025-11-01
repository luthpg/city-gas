import { useNavigate } from '@ciderjs/city-gas/react';

export const Navigation = () => {
  const navigate = useNavigate();
  return (
    <nav>
      <button type="button" onClick={() => navigate('/')}>
        Go to Home
      </button>
      <button
        type="button"
        onClick={() => navigate('/users/show', { userId: '123' })}
      >
        Go to Profile 123
      </button>
      <button type="button" onClick={() => navigate('/about')}>
        Go to About
      </button>
    </nav>
  );
};
