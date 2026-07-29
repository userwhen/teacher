import re
import pathlib

# 執行方式：把此檔放在專案根目錄，跑 python patch_onrestart.py
# maze 不用 GameTimer 重玩流程，故不列入

FILES = [
    "src/components/games/MatchPlayer.jsx",
    "src/components/games/SortPlayer.jsx",
    "src/components/games/FillPlayer.jsx",
    "src/components/games/HighlightPlayer.jsx",
    "src/components/games/TimelinePlayer.jsx",
    "src/components/games/HotspotPlayer.jsx",
    "src/components/games/WordsearchPlayer.jsx",
    "src/components/games/AnagramPlayer.jsx",
    "src/components/games/MatchupPlayer.jsx",
]

SIG_PATTERN = re.compile(r'\(\{\s*activity,\s*onFinish\s*\}\)')
RESTART_PATTERN = re.compile(r'(function handleRestart\s*\(\)\s*\{\n(?:.*\n)*?)(  \}\n)')

for f in FILES:
    p = pathlib.Path(f)
    if not p.exists():
        print(f"[SKIP] 找不到檔案: {f}")
        continue

    text = p.read_text(encoding="utf-8")
    original = text
    n1 = n2 = 0

    # 1. props 簽名加上 onRestart
    if "onRestart" not in text.split("export default function")[1].split("\n")[0]:
        text, n1 = SIG_PATTERN.subn("({ activity, onFinish, onRestart })", text, count=1)

    # 2. handleRestart() 結尾插入 if (onRestart) onRestart()
    if "onRestart()" not in text:
        text, n2 = RESTART_PATTERN.subn(r"\1    if (onRestart) onRestart()\n\2", text, count=1)

    if n1 == 0:
        print(f"[WARN] {f}: 簽名 pattern 未匹配到，需手動確認")
    if n2 == 0:
        print(f"[WARN] {f}: handleRestart() 插入點未匹配到（可能函式名稱不同或非 function 宣告），需手動確認")

    if text != original:
        p.write_text(text, encoding="utf-8")
        print(f"[OK] {f} 已更新")
    else:
        print(f"[NOCHANGE] {f}")
