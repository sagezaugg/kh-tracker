import { Link } from 'react-router-dom';
import styles from './SiteFooter.module.css';

/** Fan-project disclaimer and credits. */
export function SiteFooter() {
  return (
    <footer className={styles.foot}>
      <p>
        <strong>Unofficial fan tool.</strong> Not affiliated with, endorsed by or sponsored by Square Enix or
        Disney. Kingdom Hearts is a trademark of its respective owners. No game assets are used.
      </p>
      <p>
        Credits: location data from the{' '}
        <a href="https://github.com/ArchipelagoMW/Archipelago" rel="noreferrer" target="_blank">
          Archipelago
        </a>{' '}
        KH1 and KH2 worlds (MIT), and KH1 save flags derived from the{' '}
        <a href="https://github.com/gaithern/KH-1FM-AP-LUA" rel="noreferrer" target="_blank">
          KH-1FM-AP-LUA
        </a>{' '}
        connector (MIT). Save structure documented by{' '}
        <a href="https://github.com/Xeeynamo/KingdomSaveEditor" rel="noreferrer" target="_blank">
          Kingdom Save Editor
        </a>{' '}
        (GPL-3.0; offsets referenced, no code copied). Trophy, Journal and synthesis details from KHWiki,
        Exophase, PSTHC, PlayStation LifeStyle and Gamer Guides. Your save file never leaves your browser.
      </p>
      <p>
        Mapping a new flag? Try the <Link to="/tools/save-diff">save diff tool</Link>.
      </p>
    </footer>
  );
}
