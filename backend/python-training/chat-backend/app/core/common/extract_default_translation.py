import ast
import json
import os
from pathlib import Path

import polib
from configuration.logger.config import log


def extract_i18n_calls(path: str) -> dict:
    translations = {}
    for root, _, files in os.walk(path):  # noqa
        for file in files:
            if not file.endswith(".py"):
                continue

            with open(os.path.join(root, file), encoding="utf-8") as f:
                try:
                    tree = ast.parse(f.read(), filename=file)
                except Exception as e:
                    log.error(f"❌ Error parsing {file}, skipping...", str(e))
                    continue

                for node in ast.walk(tree):
                    if isinstance(node, ast.Call):
                        func_name = getattr(node.func, "id", None)

                        if func_name in ("i18n", "_") and len(node.args) >= 2:
                            if isinstance(node.args[0], ast.Str) and isinstance(
                                node.args[1], ast.Str
                            ):
                                msgid = node.args[0].s
                                default = node.args[1].s
                                if msgid not in translations:
                                    translations[msgid] = default

    return translations


def apply_to_po_file(po_path: str, default_map: dict):
    po = polib.pofile(po_path)
    for entry in po:
        if not entry.translated() and entry.msgid in default_map:
            entry.msgstr = default_map[entry.msgid]
    po.save()


if __name__ == "__main__":
    # 1. Extract default translations
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    default_map = extract_i18n_calls(BASE_DIR)

    # 2. Save optional (for debug or reuse)
    Path(BASE_DIR / "locale/default_translations.json").write_text(
        json.dumps(default_map, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    # 3. Apply to .po file
    apply_to_po_file(BASE_DIR / "locale/ja_JP/LC_MESSAGES/messages.po", default_map)

    log.error("✅ Default translations applied to messages.po")
