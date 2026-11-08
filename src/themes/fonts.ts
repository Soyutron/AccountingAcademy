import { BIZ_UDPGothic, IBM_Plex_Mono, M_PLUS_1_Code, Noto_Sans_JP, Zen_Kaku_Gothic_New, Zen_Maru_Gothic, Zen_Old_Mincho } from "next/font/google";

// フォント登録簿(docs/design-system.md 2.5)。テーマはここにある CSS 変数だけを参照できる。
// next/font はサブセットごとの @font-face を出すだけなので、ダウンロードされるのは使用中のテーマの書体だけ。
// 既定テーマの書体だけ preload し、他は preload しない(ライセンスはすべて SIL OFL。docs/assets-ledger.md)

const bizUdpGothic = BIZ_UDPGothic({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-biz-udpgothic", display: "swap" });
const zenMaruGothic = Zen_Maru_Gothic({ weight: ["700"], subsets: ["latin"], variable: "--font-zen-maru-gothic", display: "swap" });
const ibmPlexMono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-ibm-plex-mono", display: "swap" });

const notoSansJp = Noto_Sans_JP({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-noto-sans-jp", display: "swap", preload: false });
const zenKakuGothicNew = Zen_Kaku_Gothic_New({ weight: ["700"], subsets: ["latin"], variable: "--font-zen-kaku-gothic-new", display: "swap", preload: false });
const zenOldMincho = Zen_Old_Mincho({ weight: ["700"], subsets: ["latin"], variable: "--font-zen-old-mincho", display: "swap", preload: false });
const mPlus1Code = M_PLUS_1_Code({ subsets: ["latin"], variable: "--font-m-plus-1-code", display: "swap", preload: false });

/** <html> に付けるクラス。すべての書体の CSS 変数を定義する */
export const fontVariables = [bizUdpGothic, zenMaruGothic, ibmPlexMono, notoSansJp, zenKakuGothicNew, zenOldMincho, mPlus1Code].map((f) => f.variable).join(" ");
