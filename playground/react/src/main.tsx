import { createRouter } from '@ciderjs/city-gas';
import { RouterProvider } from '@ciderjs/city-gas/react';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './generated/router.d';
import { pages, specialPages } from './generated/routes';

const router = createRouter(pages, { specialPages });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
