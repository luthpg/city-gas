import { useParams } from '@ciderjs/city-gas/react';

export const params = {
  tab: 'string',
};

export default function UserShowPage() {
  const { tab } = useParams('/users/show');
  return (
    <div>
      <h2>User Show Page</h2>
      <p>Tab ID: {tab}</p>
    </div>
  );
}
