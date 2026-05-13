from subprocess import run

from configuration.logger.config import log


class BabelCli:
    __module_name__ = "pybabel"
    # BASE_DIR = Path(__file__).resolve().parent.parent.parent

    def extract(self, watch_dir: str, ignore_dirs: str | None = None) -> None:
        command = [
            BabelCli.__module_name__,
            "extract",
            "-F",
            "babel.cfg",
            "-o",
            "locale/messages.pot",
            watch_dir,
        ]
        if ignore_dirs:
            command.append(f"--ignore-dirs={ignore_dirs}")
        run(command)  # noqa: S603

    def init(self, lang: str | None = None) -> None:
        cmd = [
            BabelCli.__module_name__,
            "init",
            "-i",
            "locale/messages.pot",
            "-d",
            "locale",
            "-l",
            lang or "ja_JP",
        ]
        run(cmd)  # noqa: S603

    def update(self, watch_dir: str | None = None) -> None:
        cmd = [
            BabelCli.__module_name__,
            "update",
            "-i",
            "locale/messages.pot",
            "-d",
            watch_dir or "locale",
        ]
        run(cmd)  # noqa: S603

    def compile(self, lang: str | None = None):
        cmd = [
            BabelCli.__module_name__,
            "compile",
            "-f",
            "-d",
            "locale",
            "-l",
            lang or "ja_JP",
        ]
        run(cmd)  # noqa: S603

    def run(self):
        from click import group, option

        @group("cmd")
        def cmd():
            pass

        @cmd.command("extract")
        @option("-d", "--dir", "dir", help="watch dir")
        @option("-i", "--ignore-dirs", "ignore_dirs", help="name forder ignore")
        def extract(dir, ignore_dirs):
            try:
                self.extract(dir, ignore_dirs)
            except Exception as err:
                print(err)  # noqa: T201

        @cmd.command("init")
        @option(
            "-l",
            "--lang",
            "lang",
            help="locale directory name and path, default is ja_JP",
            default="ja_JP",
        )
        def init(lang: str | None = None):
            try:
                self.init(lang)
            except Exception as err:
                print(err)  # noqa: T201

        @cmd.command("compile")
        @option(
            "-l",
            "--lang",
            "lang",
            help="locale directory name and path, default is ja_JP",
            default="ja_JP",
        )
        def compile(lang: str | None = None):
            try:
                self.compile(lang)
            except Exception as err:
                print(err)  # noqa: T201

        @cmd.command("update")
        @option("-d", "--dir", "dir", help="locale directory name and path")
        def update(dir: str | None = None):
            try:
                self.update(dir)
            except Exception as err:
                print(err)  # noqa: T201

        cmd()


if __name__ == "__main__":
    try:
        babel: BabelCli = BabelCli()
        babel.run()
    except Exception as e:
        log.error(f"❌ Babel service start failed: {e}")
