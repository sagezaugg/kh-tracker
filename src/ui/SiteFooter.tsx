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
        Credits: save flags for chests, rewards and bosses from the{' '}
        <a
          href="https://github.com/ArchipelagoMW/Archipelago/tree/main/worlds/kh2"
          rel="noreferrer"
          target="_blank"
        >
          Archipelago KH2 world
        </a>{' '}
        (MIT). Save structure documented by{' '}
        <a href="https://github.com/Xeeynamo/KingdomSaveEditor" rel="noreferrer" target="_blank">
          Kingdom Save Editor
        </a>{' '}
        (GPL-3.0; offsets referenced, no code copied). Trophy and Journal details from the Exophase, PSTHC,
        Gamer Guides and KH Wiki lists. Your save file never leaves your browser.
      </p>
    </footer>
  );
}
