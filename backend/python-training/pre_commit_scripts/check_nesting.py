import argparse
import ast
import sys


class NestingChecker:
    def __init__(self, noqa_lines=None, max_if=3, max_for=3, max_while=3):
        self.noqa_lines = noqa_lines or set()
        self.max_if = max_if
        self.max_for = max_for
        self.max_while = max_while
        self.violations = []  # (lineno, kind, depth, max_allowed)

    def walk(self, node, parent=None, if_depth=0, for_depth=0, while_depth=0):
        lineno = getattr(node, "lineno", None)

        if lineno and lineno in self.noqa_lines:
            return

        # If
        if isinstance(node, ast.If):
            if_depth += 1
            if if_depth > self.max_if:
                self.violations.append((lineno, "if", if_depth, self.max_if))

        # For
        elif isinstance(node, ast.For):
            for_depth += 1
            if for_depth > self.max_for:
                self.violations.append((lineno, "for", for_depth, self.max_for))

        # While
        elif isinstance(node, ast.While):
            while_depth += 1
            if while_depth > self.max_while:  # noqa
                self.violations.append((lineno, "while", while_depth, self.max_while))

        for child in ast.iter_child_nodes(node):
            self.walk(child, node, if_depth, for_depth, while_depth)


def check_file(filename, max_if=3, max_for=3, max_while=3):
    with open(filename, encoding="utf-8") as f:
        source = f.read()

    noqa_lines = {
        i + 1 for i, line in enumerate(source.splitlines()) if "# noqa" in line
    }

    tree = ast.parse(source, filename=filename)
    checker = NestingChecker(noqa_lines, max_if, max_for, max_while)
    checker.walk(tree)

    if checker.violations:
        for lineno, kind, depth, max_allowed in checker.violations:
            print(  # noqa: T201
                f"{filename}:{lineno}: {kind} nesting depth {depth} exceeds maximum {max_allowed}"
            )
        return False
    return True


def main(argv=None):
    parser = argparse.ArgumentParser(description="Check nesting depth of if/for/while")
    parser.add_argument("files", nargs="+", help="Python source files to check")
    parser.add_argument("--max-if", type=int, default=3, help="Maximum depth for if")
    parser.add_argument("--max-for", type=int, default=2, help="Maximum depth for for")
    parser.add_argument(
        "--max-while", type=int, default=2, help="Maximum depth for while"
    )

    args = parser.parse_args(argv)

    ok = True
    for filename in args.files:
        if not check_file(filename, args.max_if, args.max_for, args.max_while):
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
