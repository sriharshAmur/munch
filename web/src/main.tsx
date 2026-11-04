import { createRoot } from 'react-dom/client';
import './styles/app.css';
import tokens from '../../design/tokens.json';
const style = document.createElement('style');
style.textContent = ':root {' + Object.entries(tokens.color).map(([key, value]) => `--m-${key}:${value.light};`).join('') + '}';
document.head.append(style);
const root = document.getElementById('root');
if (root) createRoot(root).render(<><header><span className="wordmark">◐ munch</span><span>Your orders, a little closer.</span></header><main><h1>There’s a story in your usual.</h1><p>Your Friday evenings. The place you always come back to. Years of dinner, seen together.</p><p>The kitchen is getting ready.</p></main></>);
