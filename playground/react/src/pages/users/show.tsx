import { useParams } from '@ciderjs/city-gas/react';

export const params = {
  userId: 'string',
};

export default function UserShowPage() {
  const { userId } = useParams<'/users/show'>();
  return (
    <div>
      <h2>User Show Page</h2>
      <p>User ID: {userId}</p>
    </div>
  );
}
