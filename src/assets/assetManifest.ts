import backgroundUrl from "@assets/background.png";
import shieldBarUrl from "@assets/shield_bar.png";
import heartFullUrl from "@assets/heart_full.png";
import heartEmptyUrl from "@assets/heart_empty.png";
import keyNeutralUrl from "@assets/key_neutral.png";
import keyGoodUrl from "@assets/key_good.png";
import keyEvilUrl from "@assets/key_evil.png";
import envelopeNeutralUrl from "@assets/envelope_neutral.png";
import envelopeGoodUrl from "@assets/envelope_good.png";
import envelopeEvilUrl from "@assets/envelope_evil.png";
import photoNeutralUrl from "@assets/photo_neutral.png";
import photoGoodUrl from "@assets/photo_good.png";
import photoEvilUrl from "@assets/photo_evil.png";
import cardNeutralUrl from "@assets/card_neutral.png";
import cardGoodUrl from "@assets/card_good.png";
import cardEvilUrl from "@assets/card_evil.png";
import partyhatWordmarkUrl from "@assets/partyhat/partyhat-wordmark-white.svg";
import partyhatMascotUrl from "@assets/partyhat/partyhat-mascot.svg";
import partyhatBannerUrl from "@assets/partyhat/partyhat-banner.svg";
import partyhatFaviconUrl from "@assets/partyhat/partyhat-favicon.png";
import partyhatWebclipUrl from "@assets/partyhat/partyhat-webclip.png";
import koulenRegularUrl from "@assets/partyhat/koulen-regular.woff2";
import interVariableUrl from "@assets/partyhat/inter-variable.woff2";
import { ItemType } from "@config/constants";

export const STATIC_ASSET_URLS = {
  background: backgroundUrl,
  shield: shieldBarUrl,
  hearts: {
    full: heartFullUrl,
    empty: heartEmptyUrl,
  },
  partyhat: {
    wordmark: partyhatWordmarkUrl,
    mascot: partyhatMascotUrl,
    banner: partyhatBannerUrl,
    favicon: partyhatFaviconUrl,
    webclip: partyhatWebclipUrl,
    fonts: {
      display: koulenRegularUrl,
      body: interVariableUrl,
    },
  },
} as const;

export const ITEM_ASSET_URLS: Record<ItemType, { neutral: string; good: string; bad: string }> = {
  [ItemType.PASSWORD]: {
    neutral: keyNeutralUrl,
    good: keyGoodUrl,
    bad: keyEvilUrl,
  },
  [ItemType.EMAIL]: {
    neutral: envelopeNeutralUrl,
    good: envelopeGoodUrl,
    bad: envelopeEvilUrl,
  },
  [ItemType.SELFIE]: {
    neutral: photoNeutralUrl,
    good: photoGoodUrl,
    bad: photoEvilUrl,
  },
  [ItemType.CREDIT_CARD]: {
    neutral: cardNeutralUrl,
    good: cardGoodUrl,
    bad: cardEvilUrl,
  },
};
