import { defineComponent, h } from 'vue';
import { useNavigate } from '@/adapters/vue/composables';

export const DefaultLoading = defineComponent({
  name: 'DefaultLoading',
  setup() {
    return () =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100%',
          },
        },
        [
          h(
            'style',
            `
            @keyframes city-gas-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `,
          ),
          h('div', {
            style: {
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'city-gas-spin 1s linear infinite',
            },
          }),
        ],
      );
  },
});

export const DefaultNotFound = defineComponent({
  name: 'DefaultNotFound',
  setup() {
    const navigate = useNavigate();
    return () =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80vh',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#333',
          },
        },
        [
          h('h1', { style: { fontSize: '3rem', margin: '0 0 1rem' } }, '404'),
          h(
            'p',
            {
              style: {
                fontSize: '1.2rem',
                margin: '0 0 2rem',
                color: '#666',
              },
            },
            'Page Not Found',
          ),
          h(
            'button',
            {
              onClick: () => navigate('/', {}),
              style: {
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              },
              onMouseover: (e: MouseEvent) => {
                (e.target as HTMLElement).style.backgroundColor = '#2980b9';
              },
              onMouseout: (e: MouseEvent) => {
                (e.target as HTMLElement).style.backgroundColor = '#3498db';
              },
            },
            'Go to Home',
          ),
        ],
      );
  },
});
