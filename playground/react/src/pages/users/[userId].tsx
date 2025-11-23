import { useParams } from '@ciderjs/city-gas/react';

export default function UserShowPage() {
  const { userId } = useParams('/users/[userId]');
  return (
    <div>
      <h2>User Page</h2>
      <p>User ID: {userId}</p>
    </div>
  );
}
