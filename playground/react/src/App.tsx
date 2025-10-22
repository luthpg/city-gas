import React from 'react';
import {
  createRouter,
} from '@ciderjs/city-gas';
import {
  RouterProvider,
  useNavigate,
  RouterOutlet,
} from '@ciderjs/city-gas/react';
import './generated/router.d';
import { pages } from './generated/routes';

// 1. 生成された pages マップをルーターに渡す
const router = createRouter(pages, { defaultRouteName: '' });

// 2. ナビゲーションUI
const Navigation = () => {
  const navigate = useNavigate();
  return (
    <nav>
      <button onClick={() => navigate('', {})}>Go to Home</button>
      <button onClick={() => navigate('users/show', { userId: '123' })}>Go to Profile 123</button>
      <button onClick={() => navigate('about', {})}>Go to About</button>
    </nav>
  );
};

function App() {
  return (
    <RouterProvider router={router}>
      <h1>city-gas Playground</h1>
      <Navigation />
      <hr />
      <RouterOutlet />
    </RouterProvider>
  );
}

export default App;
