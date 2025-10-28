import { useParams } from '@ciderjs/city-gas/react';

export const params = {
  userId: 'string',
};

export default function UserShowPage() { 
  const { userId } = useParams<'/users/show'>();
  return <div>User Show Page of {userId}</div>;
}
