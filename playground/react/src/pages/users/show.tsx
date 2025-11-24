import { useParams } from '@ciderjs/city-gas/react';
import { z } from 'zod';

export const schema = z.object({
  tab: z.string(),
});

export default function UserShowPage() {
  const { tab } = useParams('/users/show');
  return (
    <div>
      <h2>User Show Page</h2>
      <p>Tab ID: {tab}</p>
    </div>
  );
}
