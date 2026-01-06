# @metyatech/exercise

Docusaurus で演習課題と解答の折りたたみ表示を提供するプラグインです。演習タイトルは自動的に目次（Table of Contents）へ登録され、教材執筆時の手間を減らします。

## セットアップ

### インストール

```bash
npm install @metyatech/exercise
```

ローカルのモノレポ構成では、相対パスで次のように追加できます。

```bash
npm install ../packages/exercise-module
```

## 設定

`docusaurus.config.ts` にプラグインを追加します。`headingLevel` を変更すると演習タイトルの見出し階層（既定は h3）を調整できます。

```ts
import type {Config} from '@docusaurus/types';

const config: Config = {
  // ...既存設定...
  plugins: [
    [
      '@metyatech/exercise',
      {
        headingLevel: 2,
      },
    ],
  ],
};

export default config;
```

各 MDX ファイルでは、演習コンポーネントをクライアント用エントリから読み込みます。

```mdx
import Exercise, { Solution } from '@metyatech/exercise/client';
```

## 使い方

演習はタイトルと本文、必要に応じて `Solution` ブロックを子要素として記述します。タイトルは自動で目次に追加されます。

```mdx
import Exercise, { Solution } from '@metyatech/exercise/client';

<Exercise title="ボックスの色を変えましょう">
課題の説明をここに書きます。

<Solution>
解答のヒントや完成例をここに記載します。
</Solution>
</Exercise>
```

解答を省略すると折りたたみ欄は表示されず、`solutionTitle` でボタンの文言を調整できます。

```mdx
<Exercise title="ステップの確認" solutionTitle="ヒントを見る">
段階的な説明だけを表示することもできます。
</Exercise>
```

## スタイル

必要なスタイルはクライアント側で自動挿入されます。Docusaurus のダークモード／ライトモード切り替えにも対応しています。

## 開発コマンド

- `npm run build`: ビルド
- `npm run test`: ビルド + テスト
- `npm run lint`: 型チェック

## 環境変数/設定

特になし。

## 公開/デプロイ

```bash
npm publish
```
