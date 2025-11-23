import { useNavigate } from '@ciderjs/city-gas/react';

export const Navigation = () => {
  const navigate = useNavigate();
  return (
    <nav>
      <button type="button" onClick={() => navigate('/')}>
        Go to Home
      </button>
      <button type="button" onClick={() => navigate('/users')}>
        Go to Profile Home
      </button>
      <button
        type="button"
        onClick={() => navigate('/users/show', { tab: '123' })}
      >
        Go to Tab 123
      </button>
      <button
        type="button"
        onClick={() => navigate('/users/[userId]', { userId: '123' })}
      >
        Go to User 123
      </button>
      <button type="button" onClick={() => navigate('/about')}>
        Go to About
      </button>
      <button type="button" onClick={() => navigate('/config')}>
        Go to Config
      </button>
    </nav>
  );
};
