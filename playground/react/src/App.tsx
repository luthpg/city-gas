import { createRouter } from '@ciderjs/city-gas';
import { RouterOutlet, RouterProvider } from '@ciderjs/city-gas/react';
import './generated/router.d';
import { pages, specialPages } from './generated/routes';

function App() {
  const router = createRouter(pages, { specialPages });
  return (
    <RouterProvider router={router}>
      <RouterOutlet />
    </RouterProvider>
  );
}

export default App;
