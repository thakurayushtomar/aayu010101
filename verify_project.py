from pathlib import Path
root = Path(__file__).parent
required = ["index.html", "style.css", "app.js", "README.md", "SUBMISSION_CHECKLIST.md", "TEST_PLAN.md", "DEMO_SCRIPT.md"]
missing = [name for name in required if not (root / name).is_file()]
if missing:
    raise SystemExit("Missing files: " + ", ".join(missing))
html = (root / "index.html").read_text(encoding="utf-8")
js = (root / "app.js").read_text(encoding="utf-8")
checks = {
    "EIC mode UI": 'id="eicMode"' in html,
    "NASA EIC SVS 5313 source": "a005313" in html,
    "NASA POWER integration": "power.larc.nasa.gov" in js,
    "Frame pixel analysis": "getImageData" in js,
    "Web Audio synthesis": "createOscillator" in js,
    "Keyboard accessible search": 'for="placeSearch"' in html,
    "Voice commands": "SpeechRecognition" in js,
    "CSV export": "downloadCsv" in html and "function downloadCSV" in js,
}
for label, ok in checks.items():
    print(("PASS" if ok else "FAIL") + " — " + label)
if missing or not all(checks.values()):
    raise SystemExit(1)
print("Static project checks passed. This does not replace browser/API/accessibility testing.")
