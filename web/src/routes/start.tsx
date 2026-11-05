import { lazy, Suspense, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useData } from '@/data/provider';

// The fanned-out tickets are decoration, so they load after the words they sit beside.
const Preview = lazy(() => import('./start-preview').then((m) => ({ default: m.Preview })));

export function Start() {
  const { loadDemo, openFile, state } = useData(),
    navigate = useNavigate(),
    input = useRef<HTMLInputElement>(null);
  const base = import.meta.env.BASE_URL;
  // The wide shot is 1440 by 900, the others 1080 by 675: about twice the size they are shown at.
  const shot = (name: string, alt: string, width = 1080, height = 675) => (
    <span className="tour-shot">
      <img
        className="shot-light"
        src={`${base}img/${name}-light.webp`}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
      <img
        className="shot-dark"
        src={`${base}img/${name}-dark.webp`}
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
  const demo = () => void loadDemo().then(() => navigate({ to: '/', search: {} }));
  return (
    <div
      className="landing"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) void openFile(f).then(() => navigate({ to: '/', search: {} }));
      }}
    >
      <section className="start">
        <Suspense fallback={<div className="start-preview" aria-hidden="true" />}>
          <Preview />
        </Suspense>
        <h1 className="text-display">
          There’s a story
          <br />
          in your usual.
        </h1>
        <p className="text-lede">
          Your Thuisbezorgd orders, read back to you: your Friday evenings, the place you always come back to, the one
          you quietly stopped ordering from. A year of dinners, seen together.
        </p>
        <div className="start-actions">
          <Button onClick={demo}>See the demo</Button>
          <Button variant="outline" onClick={() => input.current?.click()}>
            Open my orders.json
          </Button>
        </div>
        <input
          ref={input}
          type="file"
          tabIndex={-1}
          aria-hidden="true"
          accept=".json,application/json"
          className="sr-only"
          aria-label="Choose orders file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void openFile(f).then(() => navigate({ to: '/', search: {} }));
            // So choosing the same file again, after a fresh munch build, still opens it.
            e.target.value = '';
          }}
        />
        {state.kind === 'empty' && state.error && (
          <p role="alert" className="error">
            {state.error}
          </p>
        )}
        <p className="start-private">Your file stays in this browser. Nothing is uploaded, ever.</p>
      </section>

      <section className="tour" aria-labelledby="tour-title">
        <h2 id="tour-title" className="landing-title">
          What you get
        </h2>
        <div className="tour-grid">
          <figure className="tour-item tour-wide">
            {shot('cards', 'Cards answering when you order and where from, with bar charts', 1440, 900)}
            <figcaption>
              <strong>Plain answers.</strong> When you order, where from, how the year went week by week, what an order
              costs. Every bar opens the orders behind it.
            </figcaption>
          </figure>
          <figure className="tour-item">
            {shot('story-places', 'A full-screen story slide naming your number one restaurant')}
            <figcaption>
              <strong>Your year as stories.</strong> Tap through the whole year, or one month at a time.
            </figcaption>
          </figure>
          <figure className="tour-item">
            {shot('places', 'A ranked list of restaurants with statuses and sparklines')}
            <figcaption>
              <strong>Every restaurant, profiled.</strong> Regulars, places that went quiet, the ones you tried once,
              and how their prices moved.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="how" aria-labelledby="how-title">
        <h2 id="how-title" className="landing-title">
          See your own
        </h2>
        <p className="how-lede">
          Thuisbezorgd keeps about a year of your orders. A small command-line tool fetches them with your own signed-in
          session and turns them into one file. It runs on your machine; this page only reads the result.
        </p>
        <ol className="steps">
          <li>
            <h3>Get the code</h3>
            <p>
              Install <a href="https://bun.sh">Bun</a>, then clone Munch.
            </p>
            <pre>
              <code>git clone https://github.com/sriharshAmur/munch{'\n'}cd munch && bun install</code>
            </pre>
          </li>
          <li>
            <h3>Fetch your orders</h3>
            <p>
              Signed in to Thuisbezorgd, open DevTools, find the request that loads your order history and copy it as
              cURL. With it on your clipboard:
            </p>
            <pre>
              <code>bun run munch fetch{'\n'}bun run munch build</code>
            </pre>
          </li>
          <li>
            <h3>Open the file</h3>
            <p>
              Drop <code>data/orders.json</code> on this page, or run <code>bun run dev</code> and it opens by itself.
              Your session lives in memory for one run and is never saved.
            </p>
            <Button variant="outline" onClick={() => input.current?.click()}>
              Open my orders.json
            </Button>
          </li>
        </ol>
      </section>

      <footer className="landing-foot">
        <span>
          Made by <a href="https://sriharsh.com">Sriharsh Amur</a>. Open source on{' '}
          <a href="https://github.com/sriharshAmur/munch">GitHub</a>.
        </span>
        <button type="button" className="landing-demo" onClick={demo}>
          See the demo
        </button>
      </footer>
    </div>
  );
}
