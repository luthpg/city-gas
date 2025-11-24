import { useParams } from '@ciderjs/city-gas/react';
import { z } from 'zod';

export const schema = z.object({
  type: z.coerce.number().optional(),
});

export default function UserShowPage() {
  const { userId, type } = useParams('/users/[userId]');
  console.log(type ?? 0);
  return (
    <div>
      <h2>User Page</h2>
      <p>User ID: {userId}</p>
    </div>
  );
}
