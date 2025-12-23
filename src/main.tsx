import { createRoot } from 'react-dom/client';
import App from './App';

// Store actions'ı import et (side-effect: init çağrılır)
import './store/actions';

const rootElement = document.getElementById('root');

if (!rootElement) {
    throw new Error('Root element bulunamadı');
}

createRoot(rootElement).render(<App />);
