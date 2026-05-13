import ast
import sys
from pathlib import Path


class EvalVisitor(ast.NodeVisitor):
    def __init__(self):
        self.errors = []

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name) and node.func.id == "eval":
            self.errors.append(
                (node.lineno, node.col_offset, "EVAL001 Use of eval() is prohibited.")
            )
        self.generic_visit(node)


def check_file(path: Path) -> list[str]:
    errors = []
    try:
        tree = ast.parse(path.read_text(), filename=str(path))
        visitor = EvalVisitor()
        visitor.visit(tree)
        for lineno, col, msg in visitor.errors:
            errors.append(f"{path}:{lineno}:{col}: {msg}")
    except SyntaxError as e:
        errors.append(f"{path}:{e.lineno}:{e.offset}: SyntaxError: {e.msg}")
    return errors


def main(argv=None) -> int:
    argv = argv or sys.argv[1:]
    all_errors = []
    for filename in argv:
        path = Path(filename)
        if path.suffix == ".py":
            all_errors.extend(check_file(path))

    if all_errors:
        for e in all_errors:
            print(e)  # noqa: T201
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
