
# Claude Code Instructions


# Project Structure

```
.
├── application  # Application code
├── docs         # documentation
├── infra        # IaC code
├── CLAUDE.md    # Claude Code instruction document
└── README.md
```

## Key Files

- docs/ - 仕様・デザイン・技術詳細・運用などの資料を格納するディレクトリ
- docs/10_product - このディレクトリの配下は人間が与えるので編集しないこと
- application/ - ソースコードを置くところ
- infra/ - IaC（Terraform）のコードを置くところ


# 矛盾する情報への対処ルール

ドキュメント間で矛盾がある場合：
1. コードを真実とする（実装済みの場合）
2. ユーザーに確認する（未実装の場合）
勝手に古い情報を採用しないこと