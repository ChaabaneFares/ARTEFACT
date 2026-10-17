import type { LandingSectionProps } from "../../landing.types";
import { mediaCopy } from "./media.copy";
import styles from "./media.module.css";
import MediaAnimateLoader from "./mediaAnimateLoader";
import MediaCover from "./mediaCover";

const MEDIA_ITEMS = [
  {
    key: "pastel-pink-front",
    itemClassName: "f-g-1",
    playerId: "2",
    buttonClassName: "2",
    title: "Pastel pink",
    videoId: "NN_bmDgHre8",
    imageUrl: "/assets/landing-page/media/pastel-pink.jpg",
  },
  {
    key: "villa-pano-front",
    itemClassName: "f-g-2",
    playerId: "3",
    buttonClassName: "3",
    title: "Villa pano",
    videoId: "xgWT3ZnPa40",
    imageUrl: "/assets/landing-page/media/villa-pano.jpg",
  },
  {
    key: "light-warm-front",
    itemClassName: "f-g-3",
    playerId: "1",
    buttonClassName: "1",
    title: "Light and warm",
    videoId: "xtcLIzJMSrc",
    imageUrl: "/assets/landing-page/media/light-warm.jpg",
  },
  {
    key: "cozy-cafe-front",
    itemClassName: "f-g-1 rep",
    playerId: "4",
    buttonClassName: "4",
    title: "Cozy cafe",
    videoId: "34hD4u8WFuI",
    imageUrl: "/assets/landing-page/media/cozy-cafe.jpg",
  },
  {
    key: "pastel-pink-repeat",
    itemClassName: "f-g-2 rep",
    playerId: "22",
    buttonClassName: "22",
    title: "Pastel pink",
    videoId: "NN_bmDgHre8",
    imageUrl: "/assets/landing-page/media/pastel-pink.jpg",
  },
  {
    key: "villa-pano-repeat",
    itemClassName: "f-g-3 rep",
    playerId: "33",
    buttonClassName: "33",
    title: "Villa pano",
    videoId: "xgWT3ZnPa40",
    imageUrl: "/assets/landing-page/media/villa-pano.jpg",
  },
  {
    key: "light-warm-repeat",
    itemClassName: "f-g-3 rep",
    playerId: "11",
    buttonClassName: "11",
    title: "Light and warm",
    videoId: "xtcLIzJMSrc",
    imageUrl: "/assets/landing-page/media/light-warm.jpg",
  },
  {
    key: "cozy-cafe-repeat",
    itemClassName: "f-g-3 rep1",
    playerId: "44",
    buttonClassName: "44",
    title: "Cozy cafe",
    videoId: "34hD4u8WFuI",
    imageUrl: "/assets/landing-page/media/cozy-cafe.jpg",
  },
] as const;

function PlayIcon() {
  return (
    <svg
      className={styles.playIcon}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 288.01 335.95"
      aria-hidden="true"
    >
      <path d="M0,168.33Q0,104.76,0,41.19c0-19.57,12.36-35.35,31-40C42-1.56,52,.64,61.6,6.22q53.46,31,107,61.89,48.65,28.11,97.28,56.25c11.68,6.78,19.17,16.82,21.37,30.16,3.18,19.19-3.61,34.58-19.89,45.08C238.82,218,210,236,181.27,254.14q-59.39,37.53-118.78,75.05c-23.34,14.7-52.7,4.46-60.55-21.2A47.88,47.88,0,0,1,.1,294.34C0,252.33,0,210.33,0,168.33Z" />
    </svg>
  );
}

export default function Media({ locale }: LandingSectionProps) {
  const copy = mediaCopy[locale];
  const motionLabels = {
    ...copy.motion,
    captionLocale: locale,
    musicCaptionSource:
      locale === "en"
        ? "/assets/video/portfolio/music.vtt"
        : `data:text/vtt;charset=utf-8,${encodeURIComponent(`WEBVTT\n\n00:00.000 --> 01:02.200\n${copy.musicCaption}\n`)}`,
  };
  return (
    <>
      <div className={`${styles.mobileTitle} te-text`}>{copy.videos}</div>
      <div id="media" className={`${styles.media} fea-body`} data-media-root>
        <MediaAnimateLoader labels={motionLabels} />
        <div className={`${styles.feaWrapper} fea-wrapper`}>
          <div
            className={`${styles.fContainer} f-container`}
            data-media-container
          >
            {MEDIA_ITEMS.map((item) => (
              <div
                key={item.key}
                className={`${styles.item} it ${item.itemClassName}`}
                data-media-item
                data-player-id={item.playerId}
                data-video-id={item.videoId}
                data-video-title={item.title}
              >
                <button
                  className={`${styles.tileButton} ${item.buttonClassName}`}
                  type="button"
                  data-media-button
                  aria-label={copy.play.replace("{title}", item.title)}
                >
                  <MediaCover
                    className={`${styles.cover} ani-cover ${item.buttonClassName}`}
                    imageUrl={item.imageUrl}
                  />
                  <span className={styles.playIconWrap}>
                    <PlayIcon />
                  </span>
                </button>
                <div
                  id={item.playerId}
                  className={`${styles.videoMount} vr-item`}
                  data-media-player
                />
                <button
                  className={styles.fullscreenProxyButton}
                  type="button"
                  data-media-fullscreen-proxy
                  aria-label={copy.fullscreen.replace("{title}", item.title)}
                />
              </div>
            ))}
          </div>
        </div>
        <div className={`${styles.featureText} fe-text`} data-media-text>
          {copy.animations}
        </div>
      </div>
    </>
  );
}
