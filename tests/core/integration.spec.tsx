import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import {
  createRouter,
  RouterOutlet,
  RouterProvider,
  useNavigate,
  useParams,
} from '~/src';

const HomePage = () => <h1>Home</h1>;
const AboutPage = () => <h1>About</h1>;
const UserPage = () => {
  const params = useParams<{ id: string }>();
  return <h1>User: {params.id}</h1>;
};

const pages = {
  '': HomePage,
  about: AboutPage,
  user: UserPage,
};

type RouteNames = keyof typeof pages;
interface RouteParams {
  '': {};
  about: {};
  user: { id: string };
}

const Navigation = () => {
  const navigate = useNavigate<RouteNames, RouteParams>();
  return (
    <nav>
      <button onClick={() => navigate('', {})}>Home</button>
      <button onClick={() => navigate('about', {})}>About</button>
      <button onClick={() => navigate('user', { id: '123' })}>User 123</button>
    </nav>
  );
};

describe('React Integration Test', () => {
  it('should render the default route and navigate correctly', async () => {
    const router = createRouter<RouteNames, RouteParams>(pages, {
      defaultRouteName: '',
    });

    render(
      <RouterProvider router={router}>
        <Navigation />
        <RouterOutlet />
      </RouterProvider>,
    );

    // Initial render (default route)
    expect(await screen.findByText('Home')).toBeInTheDocument();

    // Navigate to About
    act(() => {
      fireEvent.click(screen.getByText('About'));
    });
    expect(await screen.findByText('About')).toBeInTheDocument();

    // Navigate to User
    act(() => {
      fireEvent.click(screen.getByText('User 123'));
    });
    expect(await screen.findByText('User: 123')).toBeInTheDocument();

    // Navigate back to Home
    act(() => {
      fireEvent.click(screen.getByText('Home'));
    });
    expect(await screen.findByText('Home')).toBeInTheDocument();
  });
});
