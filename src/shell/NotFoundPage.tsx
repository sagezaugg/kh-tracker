import { Frame } from './Frame';
import { NotFoundRoute } from './NotFoundRoute';
import { NOT_FOUND_HELP, NOT_FOUND_TITLE } from './notFound';
import shell from './Shell.module.css';

/** Full page for unknown paths outside any game. */
export function NotFoundPage() {
  return (
    <Frame title={NOT_FOUND_TITLE} sub="Kingdom Hearts · 100% Completion Tracker" help={NOT_FOUND_HELP}>
      <div className={shell.body}>
        <main className={shell.panel} id="main" tabIndex={-1}>
          <h1 className={shell.ptitle}>{NOT_FOUND_TITLE}</h1>
          <NotFoundRoute />
        </main>
      </div>
    </Frame>
  );
}
