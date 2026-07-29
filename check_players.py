import pathlib

FILES = [
    "src/components/games/QuizPlayer.jsx",
    "src/components/games/MatchPlayer.jsx",
    "src/components/games/SortPlayer.jsx",
    "src/components/games/FillPlayer.jsx",
    "src/components/games/HighlightPlayer.jsx",
    "src/components/games/TimelinePlayer.jsx",
    "src/components/games/HotspotPlayer.jsx",
    "src/components/games/WordsearchPlayer.jsx",
    "src/components/games/AnagramPlayer.jsx",
    "src/components/games/MatchupPlayer.jsx",
    # maze 有自己的機制，不強制要求 onRestart()，但仍檢查 onFinish()
    "src/components/games/MazePlayer.jsx",
]

for f in FILES:
    p = pathlib.Path(f)
    if not p.exists():
        print(f"[找不到] {f}")
        continue

    text = p.read_text(encoding="utf-8")
    has_finish  = "onFinish(" in text
    has_restart = "onRestart()" in text

    problems = []
    if not has_finish:
        problems.append("缺 onFinish() 呼叫")
    if not has_restart and "maze" not in f.lower():
        problems.append("缺 onRestart() 呼叫")

    print(f"{f}: {'OK' if not problems else ' / '.join(problems)}")
