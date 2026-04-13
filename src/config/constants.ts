export const GAME_WIDTH = 1080;
export const GAME_HEIGHT = 1920;

export const FONT = {
  DISPLAY: '"PartyhatDisplay", "Arial Black", sans-serif',
  BODY: '"PartyhatBody", "Segoe UI", sans-serif',
  FAMILY: '"PartyhatBody", "Segoe UI", sans-serif',
  FAMILY_MONO: "monospace",
};

export const TYPO = {
  DISPLAY: "96px",
  HERO: "80px",
  LARGE: "72px",
  HEADING: "64px",
  TITLE: "48px",
  SUBTITLE: "40px",
  BODY: "36px",
  SMALL: "28px",
  MICRO: "18px",
};

export const GLOW = {
  CYAN: { color: "#14b8a6", blur: 20 },
  PURPLE: { color: "#8b5cf6", blur: 25 },
  ORANGE: { color: "#f97316", blur: 20 },
  RED: { color: "#ff0044", blur: 25 },
  WHITE: { color: "#ffffff", blur: 15 },
  GOLD: { color: "#ffd700", blur: 20 },
};

export const COLOR = {
  SHIELD_PURPLE: 0x8b5cf6,
  SHIELD_TEAL: 0x14b8a6,
  SHIELD_ORANGE: 0xf97316,
  SHIELD_GLOW: 0x14b8a6,
  PARTYHAT_PINK: 0xfd5ab8,
  PARTYHAT_PINK_DARK: 0xc8338e,
  SITE_NAVY: 0x071420,
  SITE_NAVY_SOFT: 0x101e2d,
  SURFACE_PANEL: 0x0c1325,
  SURFACE_CARD: 0x121a31,
  SURFACE_CARD_ALT: 0x182241,
  SURFACE_BORDER: 0x52f3d2,
  SURFACE_BORDER_SOFT: 0x6a59ff,
  SURFACE_TEXT: "#eef6ff",
  SURFACE_MUTED: "#aebbd4",
  SURFACE_SOFT: "#8090ac",
  SITE_TEXT_MUTED: "#98a7bb",
  SITE_RULE: 0x253445,
  SITE_EYEBROW: "#fd5ab8",
  TAG_BG: 0x10192c,
  TAG_BORDER: 0xf97316,
  SCANNER_SAFE: 0x00ff88,
  SCANNER_DANGER: 0xff0044,
  HEART_FILLED: 0xff4466,
  HEART_EMPTY: 0x333344,
  HUD_TEXT: "#14b8a6",
  CTA_BUTTON: 0xfd5ab8,
  CTA_BUTTON_SECONDARY: 0x101a29,
  CTA_TEXT: "#ffffff",
  CTA_SUBTEXT: "#d6dbe3",
  DARKWEB_GLOW_TOP: 0x4c1d95,
  DARKWEB_GLOW_BOTTOM: 0x7f1d1d,
  MALWARE_GLITCH: 0xff0044,
  ITEM_PASSWORD: 0xffd700,
  ITEM_EMAIL: 0xe8e8e8,
  ITEM_SELFIE: 0x9f7aea,
  ITEM_CREDIT: 0x3b82f6,
  CATCH_FLASH: 0xffffff,
  MALWARE_FLASH: 0xff0044,
  DAMAGE_OVERLAY: 0xff0044,
  SCANNER_OVERLAY: 0x001a0a,
  ITEM_AURA_PASSWORD: 0xffd700,
  ITEM_AURA_EMAIL: 0xe8e8e8,
  ITEM_AURA_SELFIE: 0x9f7aea,
  ITEM_AURA_CREDIT: 0x3b82f6,
};

export enum ItemType {
  PASSWORD = "password",
  EMAIL = "email",
  SELFIE = "selfie",
  CREDIT_CARD = "credit_card",
}

export interface ItemConfig {
  type: ItemType;
  points: number;
  neutralTextureKey: string;
  safeTextureKey: string;
  dangerTextureKey: string;
  color: number;
  width: number;
  height: number;
}

export const ITEM_CONFIGS: Record<ItemType, ItemConfig> = {
  [ItemType.PASSWORD]: {
    type: ItemType.PASSWORD,
    points: 10,
    neutralTextureKey: "item_password",
    safeTextureKey: "item_password_safe",
    dangerTextureKey: "item_password_danger",
    color: COLOR.ITEM_PASSWORD,
    width: 94,
    height: 94,
  },
  [ItemType.EMAIL]: {
    type: ItemType.EMAIL,
    points: 10,
    neutralTextureKey: "item_email",
    safeTextureKey: "item_email_safe",
    dangerTextureKey: "item_email_danger",
    color: COLOR.ITEM_EMAIL,
    width: 102,
    height: 80,
  },
  [ItemType.SELFIE]: {
    type: ItemType.SELFIE,
    points: 20,
    neutralTextureKey: "item_selfie",
    safeTextureKey: "item_selfie_safe",
    dangerTextureKey: "item_selfie_danger",
    color: COLOR.ITEM_SELFIE,
    width: 98,
    height: 106,
  },
  [ItemType.CREDIT_CARD]: {
    type: ItemType.CREDIT_CARD,
    points: 30,
    neutralTextureKey: "item_credit",
    safeTextureKey: "item_credit_safe",
    dangerTextureKey: "item_credit_danger",
    color: COLOR.ITEM_CREDIT,
    width: 112,
    height: 82,
  },
};

export const ITEM_WEIGHTS: [ItemType, number][] = [
  [ItemType.PASSWORD, 35],
  [ItemType.EMAIL, 35],
  [ItemType.SELFIE, 20],
  [ItemType.CREDIT_CARD, 10],
];

export interface WaveConfig {
  fallSpeed: number;
  spawnInterval: number;
  malwareRatio: number;
}

export const WAVE_DEFINITIONS: WaveConfig[] = [
  { fallSpeed: 150, spawnInterval: 1500, malwareRatio: 0.10 },
  { fallSpeed: 250, spawnInterval: 1000, malwareRatio: 0.20 },
  { fallSpeed: 350, spawnInterval: 700, malwareRatio: 0.30 },
  { fallSpeed: 450, spawnInterval: 400, malwareRatio: 0.40 },
];

export const WAVE_DURATION_MS = 30000;

export const SHIELD = {
  BASE_WIDTH: 340,
  MID_WIDTH: 394,
  MAX_WIDTH: 450,
  HEIGHT: 84,
  Y: 1475,
  BODY_WIDTH_RATIO: 0.86,
  BODY_HEIGHT_RATIO: 0.58,
  SLICE_LEFT: 128,
  SLICE_RIGHT: 128,
  SLICE_TOP: 38,
  SLICE_BOTTOM: 38,
  NATIVE_WIDTH: 575,
  NATIVE_HEIGHT: 175,
  ICON_WIDTH: 420,
  ICON_HEIGHT: 128,
};

export const ABYSS = {
  TOP_Y: 1600,
  BOTTOM_Y: 1920,
  HOLE_WIDTH: 1060,
  HOLE_HEIGHT: 320,
  HOLE_Y: 1700,
  PULSE_BASE_SPEED: 0.002,
  PULSE_DANGER_SPEED: 0.006,
  VORTEX_ARMS: 4,
  VORTEX_TURNS: 1.5,
  VORTEX_SPIN_SPEED: 0.012,
  VORTEX_SEGMENTS: 50,
  VORTEX_INNER_R: 0.08,
  VORTEX_OUTER_R: 0.92,
  ARM_COLORS: [
    [0x8B5CF6, 0x14B8A6],
    [0x14B8A6, 0xA855F7],
    [0xA855F7, 0x6366F1],
    [0x6366F1, 0x8B5CF6],
  ],
  RING_THICKNESS: 16,
  RING_INNER_HIGHLIGHT: 3,
  GLOW_LAYERS: 12,
  GLOW_EXPAND: 14,
  PARTICLE_COUNT: 30,
  PARTICLE_COLORS: [0x8B5CF6, 0x14B8A6, 0xA855F7, 0x6366F1, 0x00ffcc],
  GROUND_GLOW_WIDTH: 900,
  GROUND_GLOW_HEIGHT: 80,
  BINARY_RAIN_COLUMNS: 50,
  BINARY_RAIN_TRAIL_CHARS: 18,
  BINARY_RAIN_TRAIL_COLOR: "#55ccaa",
  BINARY_RAIN_HEAD_COLOR: "#ccffee",
  BINARY_RAIN_SPEED_MIN: 40,
  BINARY_RAIN_SPEED_MAX: 100,
  BINARY_RAIN_HEAD_ALPHA: 0.65,
  BINARY_RAIN_TRAIL_ALPHA: 0.3,
  BINARY_RAIN_TOP_Y: 1750,
  BINARY_RAIN_BOTTOM_Y: 1920,
  BINARY_RAIN_ACCEL: 50,
};

export const LIVES = {
  INITIAL: 3,
  DATA_LEAKS_PER_LIFE: 3,
};

export const SCANNER = {
  COOLDOWN_MS: 15000,
  JITTER_MS: 3000,
  DURATION_MS: 4200,
  DURATION_BONUS_PER_MULTIPLIER_MS: 700,
  MAX_DURATION_MS: 7200,
  BEAM_SWEEP_MS: 950,
  BEAM_WIDTH: 120,
  OVERLAY_ALPHA: 0.08,
  ITEM_BLOOM_SCALE: 1.02,
  ITEM_BLOOM_MS: 180,
  ITEM_REVEAL_MS: 320,
  FADE_MS: 400,
  SCANLINE_SPEED: 0.45,
};

export const TEXTURE_KEY = {
  BACKGROUND: "background",
  SHIELD: "shield",
  SHIELD_GLOW: "shield_glow",
  SHIELD_ENERGY_FLOW: "shield_energy_flow",
  SHIELD_GLOW_UNDERLAY: "shield_glow_underlay",
  HEART_FILLED: "heart_filled",
  HEART_EMPTY: "heart_empty",
  SCANNER_BEAM: "scanner_beam",
  SCANNER_LINES: "scanner_lines",
  ABYSS_HOLE: "abyss_hole",
  ABYSS_VORTEX: "abyss_vortex",
  ABYSS_RING: "abyss_ring",
  ABYSS_GLOW: "abyss_glow",
  ABYSS_GROUND_GLOW: "abyss_ground_glow",
  ABYSS_PARTICLE: "abyss_particle",
  BUTTON: "button",
  BUTTON_PRIMARY: "button_primary",
  BUTTON_SECONDARY: "button_secondary",
  CTA_GHOST: "cta_ghost",
  FEATURE_RAIL: "feature_rail",
  FEATURE_RAIL_ACTIVE: "feature_rail_active",
  HALO_SPOTLIGHT: "halo_spotlight",
  BADGE_CHIP: "badge_chip",
  CATCH_BURST: "catch_burst",
  MALWARE_BURST: "malware_burst",
  DAMAGE_OVERLAY: "damage_overlay",
  VIGNETTE: "vignette",
  PARTYHAT_WORDMARK: "partyhat_wordmark",
  PARTYHAT_MASCOT: "partyhat_mascot",
  PARTYHAT_BANNER: "partyhat_banner",
  PARTYHAT_FAVICON: "partyhat_favicon",
  PARTYHAT_WEBCLIP: "partyhat_webclip",
};

export const SPAWN = {
  X_MARGIN: 80,
  Y_START: -80,
};

export const JUICE = {
  SCREEN_SHAKE_MALWARE_MS: 150,
  SCREEN_SHAKE_MALWARE_INTENSITY: 0.008,
  SCREEN_SHAKE_LIFE_LOSS_MS: 300,
  SCREEN_SHAKE_LIFE_LOSS_INTENSITY: 0.015,
  SCREEN_SHAKE_COMBO_MS: 80,
  SCREEN_SHAKE_COMBO_INTENSITY: 0.003,
  FREEZE_FRAME_MS: 300,
  CATCH_FLASH_ALPHA: 0.8,
  CATCH_FLASH_DURATION_MS: 120,
  MALWARE_FLASH_ALPHA: 1.0,
  MALWARE_FLASH_DURATION_MS: 200,
  SCORE_PULSE_SCALE: 1.15,
  SCORE_PULSE_MS: 200,
  CATCH_PARTICLE_SPEED_MIN: 80,
  CATCH_PARTICLE_SPEED_MAX: 200,
  CATCH_PARTICLE_LIFESPAN: 400,
  MALWARE_CATCH_PARTICLE_COUNT: 15,
  CATCH_PARTICLE_COUNT: 8,
};

export const PARTICLES = {
  SHIELD_TRAIL_MIN_DX: 5,
  SHIELD_TRAIL_LIFESPAN: 200,
  SHIELD_TRAIL_ALPHA: 0.3,
};

export const COMBO = {
  DECAY_TIMEOUT_MS: 3000,
  MILESTONES: [5, 10, 15, 20, 40],
  MAX_MULTIPLIER: 5,
  MULTIPLIER_STEP: 0.5,
  COMBOS_PER_STEP: 5,
  TIERS: [
    { min: 2, label: "NICE!", color: "#14b8a6" },
    { min: 5, label: "GREAT!", color: "#8b5cf6" },
    { min: 10, label: "AWESOME!", color: "#f97316" },
    { min: 15, label: "AMAZING!", color: "#ffd700" },
    { min: 20, label: "LEGENDARY!", color: "#ff0044" },
  ],
};

export const HUD = {
  SCORE_Y: 78,
  HEART_Y: 80,
  HEART_START_X: GAME_WIDTH - 264,
  HEART_SPACING: 88,
  HEART_SIZE: 84,
  HEART_CROP_X: 200,
  HEART_CROP_Y: 236,
  HEART_CROP_WIDTH: 624,
  HEART_CROP_HEIGHT: 512,
  SCANNER_BAR_X: 28,
  SCANNER_BAR_Y: 182,
  SCANNER_BAR_WIDTH: GAME_WIDTH - 56,
  SCANNER_BAR_HEIGHT: 16,
  COMBO_Y: 254,
  MULTIPLIER_Y: 304,
  COMBO_COLORS: ["#ffffff", "#14b8a6", "#8b5cf6", "#f97316", "#ffd700"],
};

export const THREAT = {
  VIGNETTE_ALPHA_BASE: 0,
  VIGNETTE_ALPHA_1_LIFE: 0.15,
  VIGNETTE_COLOR: COLOR.DARKWEB_GLOW_BOTTOM,
};

export const PARTYHAT_BRAND = {
  TAGLINE: "ALWAYS WEAR PROTECTION",
  WORDMARK_WIDTH: 362,
  WORDMARK_HEIGHT: 68,
  MASCOT_SIZE: 146,
  BADGE_ICON_SIZE: 38,
  HERO_BANNER_WIDTH: 420,
  HERO_BANNER_HEIGHT: 446,
};

export const MENU_COPY = {
  EYEBROW: "AI-Powered",
  TITLE: "DATA DROP",
  SUBTITLE: "SAVE YOUR DATA.",
  GAME_BADGE: "DATA DROP",
  CTA_TEXT: "Start Protecting",
  TRUST_LINE: "Free to play • No install • 30-second run",
};

export const MENU_LAYOUT = {
  WORDMARK_Y: 108,
  EYEBROW_Y: 214,
  TITLE_Y: 326,
  SUBTITLE_Y: 498,
  HERO_CENTER_Y: 1010,
  BADGE_Y: 1454,
  CTA_Y: 1650,
  TRUST_Y: 1772,
};

export type ResultTier = "exposed" | "almost" | "blocked";

export interface ResultTierConfig {
  id: ResultTier;
  minScore: number;
  headline: string;
  color: string;
  accent: number;
}

export const RESULT_TIER_CONFIGS: ResultTierConfig[] = [
  {
    id: "blocked",
    minScore: 3000,
    headline: "BLOCKED.",
    color: "#ffffff",
    accent: COLOR.PARTYHAT_PINK,
  },
  {
    id: "almost",
    minScore: 1500,
    headline: "ALMOST.",
    color: "#ffffff",
    accent: COLOR.SHIELD_ORANGE,
  },
  {
    id: "exposed",
    minScore: 0,
    headline: "EXPOSED.",
    color: "#ffffff",
    accent: COLOR.MALWARE_GLITCH,
  },
];

export const RESULT_SCREEN = {
  EYEBROW: "Fight AI threats with AI",
  SCORE_LABEL: "DATA SAVED",
  STREAK_LABEL: "BEST STREAK",
  SUMMARY: "The round ended. The leaks didn’t.",
  HIGHLIGHT_MESSAGE: "Leak Guard helps spot exposed data before the dark web does.",
  CTA_URL: "https://app.getpartyhat.com/",
  CTA_TEXT: "TRY FOR FREE",
  CTA_SUBTEXT: "$0 today • 3-day free trial • Cancel anytime",
  PLAY_AGAIN_TEXT: "Play Again",
};

export const RESULT_FEATURES = [
  {
    index: "01",
    title: "Leak Guard",
    description: "Alerts if your passwords, emails, and private info leak.",
    icon: TEXTURE_KEY.PARTYHAT_WEBCLIP,
    active: true,
  },
  {
    index: "02",
    title: "Spam / Scam Calls",
    description: "Shields up against live scam and spam call threats.",
    icon: TEXTURE_KEY.PARTYHAT_FAVICON,
    active: false,
  },
  {
    index: "03",
    title: "Super VPN",
    description: "Browse privately with protection across 80+ countries.",
    icon: TEXTURE_KEY.PARTYHAT_WEBCLIP,
    active: false,
  },
] as const;

export const GAME_OVER = {
  MESSAGE: RESULT_SCREEN.HIGHLIGHT_MESSAGE,
  CTA_URL: RESULT_SCREEN.CTA_URL,
  CTA_TEXT: RESULT_SCREEN.CTA_TEXT,
  PLAY_AGAIN_TEXT: RESULT_SCREEN.PLAY_AGAIN_TEXT,
};
