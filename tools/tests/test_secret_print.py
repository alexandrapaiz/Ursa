# vendored-from: alexandrapaiz/alexandra-systems tools/tests/test_secret_print.py @ 08ba7f53c83b60e8e7d34ecd07538b23bad97ab2
# vendored-from: do not edit here. re-vendor alongside tools/check-secret-print.py.
"""The four shapes that have actually printed a credential here, as tests.

    python3 -m unittest discover -s tools/tests

What is being defended. standards/lessons.md L-X5 says a seat checks that a
secret exists and never prints the value. It has been violated four times:

    Incident 3   2026-09-19  EXO_TOKEN            prefix-guessing `sed`
    Incident 4   2026-09-20  EXO_TOKEN            ${VAR:-NO}, one day later
    Incident 15  2026-10-12  EXO_TOKEN            both at once (PR #158)
    (unnumbered) 2026-10-12  BOARD_RUNTIME_TOKEN  ${VAR:-NO}, HQ's PM seat

The last two are this file's first two tests, verbatim, because sprint
2026-10-12 item 1 asks for exactly that: "catching this run's own two
reproductions ... as positive test cases, with a false-positive check against
tools/check-actions-reach.sh's own safe idiom so the guard does not flag the
fix it is there to protect."

The fixtures carry `L-X5-ALLOW` markers because this file is itself inside the
checker's default scan, and a test file holding a counter-example is the one
place the marker is for. The markers change nothing about the tests: every
fixture is passed to --command or --hook, where suppression does not apply,
which is itself asserted below.

Nothing in this file needs the network, a token, or the company's history.
"""
import fnmatch
import json
import os
import subprocess
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHECK = os.path.join(ROOT, "tools", "check-secret-print.py")
BASELINE = os.path.join(ROOT, "tools", "secret-print-baseline.txt")

# Every unsafe string this file needs lives here, one per line, each with the
# marker that keeps the checker's own scan of this file clean. Collected rather
# than inlined because a marker has to sit on the line it excuses, and an
# assertion that also carries a fixture is too long to read.
#
# The first two are the commands that actually ran, exactly as they were typed.
F = {
    # Incident 15, the first command of the 2026-10-12 harvest (PR #158).
    "incident_15": 'echo "EXO_TOKEN set: ${EXO_TOKEN:+yes}${EXO_TOKEN:-NO}" | sed \'s/gh[pous]_[A-Za-z0-9]*/REDACTED/\'',  # L-X5-ALLOW: recorded fixture, never executed
    # The 2026-10-12 Monday ceremony's own board presence check.
    "ceremony": 'echo "BOARD_RUNTIME_TOKEN set: ${BOARD_RUNTIME_TOKEN:-NO}"',  # L-X5-ALLOW: recorded fixture, never executed
    "exo_default": 'echo "${EXO_TOKEN:-NO}"',  # L-X5-ALLOW: fixture
    "gh_default": 'echo "${GH_TOKEN:-none}"',  # L-X5-ALLOW: fixture
    "password": 'echo "${MY_PASSWORD-none}"',  # L-X5-ALLOW: fixture
    "stripe": 'echo "${STRIPE_API_KEY:-unset}"',  # L-X5-ALLOW: fixture
    "riddle": 'echo "${HOUSE_RIDDLE:-none}"',
    "token_path": 'echo "${TOKEN_PATH:-/tmp/t}"',
    "key_name": 'echo "${KEY_NAME:-default}"',
    "prefix_sed": "curl -s x | sed 's/ghp_[A-Za-z0-9]*/REDACTED/'",  # L-X5-ALLOW: fixture
    "mask_sed": "cmd | sed 's/.*/REDACTED/'",  # L-X5-ALLOW: fixture
    "pat_sed": "cmd | sed 's/github_pat_[A-Za-z0-9_]*/x/'",  # L-X5-ALLOW: fixture
    # 2026-10-18, the four quoting and heredoc cases. Added by using the
    # guard: the first three are commands it denied wrongly, the fourth is a
    # line on main the first heredoc rule read as printing a token.
    "apostrophe": 'echo "it\'s $EXO_TOKEN"',  # L-X5-ALLOW: fixture
    "quoted_heredoc": "cat <<'EOF'\n" + 'echo "$EXO_TOKEN"' + "\nEOF",  # L-X5-ALLOW: fixture
    "unquoted_heredoc": 'cat <<EOF\ntoken: $EXO_TOKEN\nEOF',  # L-X5-ALLOW: fixture
    "escaped_heredoc": 'cat <<EOF\n  -H "Authorization: Bearer \\$BOARD_RUNTIME_TOKEN"\nEOF',
    "heredoc_then_unsafe": "cat <<'EOF'\nnothing here\nEOF\n" + 'echo "${GH_TOKEN:-none}"',  # L-X5-ALLOW: fixture
    "piped_row": "curl -s x | sed 's/ghp_[A-Za-z0-9]*/REDACTED/'",  # L-X5-ALLOW: fixture
    "langfuse_mask": 'echo "::add-mask::$auth"',  # L-X5-ALLOW: fixture
    # 2026-10-23, the fifth and sixth shapes. Both are commands that actually
    # ran here and both read as safe to the seat that typed them.
    # Incident 18: HQ's PM traced four board writes, every one in the header
    # form the checker's own docstring calls safe.
    "incident_18": 'set -x\ncurl -s -X POST "$BOARD_API_URL/api/messages" -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN" -d @-',  # L-X5-ALLOW: recorded fixture, never executed
    # Incident 20: this seat listed the 45 names in the rendered env file and
    # printed four continuation lines of NPM_RECOVERY_CODES with them.
    "incident_20": 'cut -d= -f1 /srv/asc/env.infisical | sed "s/^export //" | sort',  # L-X5-ALLOW: recorded fixture, never executed
    "trace_short": '. /srv/asc/env.infisical\nset -ex',  # L-X5-ALLOW: fixture
    "trace_xtrace": 'set -o xtrace\necho "$EXO_TOKEN"',  # L-X5-ALLOW: fixture
    "trace_interpreter": 'bash -x tools/secrets.sh get EXO_TOKEN',  # L-X5-ALLOW: fixture
    "trace_off": 'set +x\ncurl -H "Authorization: Bearer $EXO_TOKEN" x',
    "trace_no_secret": 'set -ex\nmake build',
    "strict_mode": 'set -euo pipefail\ncurl -H "Authorization: Bearer $EXO_TOKEN" x',
    "envnames_awk": 'awk -F= \'{print $1}\' /srv/asc/env',  # L-X5-ALLOW: fixture
    "envnames_sed": 'sed \'s/=.*//\' .env',  # L-X5-ALLOW: fixture
    "envnames_dotenv": 'infisical export --format=dotenv --silent | cut -d= -f1 | sort',  # L-X5-ALLOW: fixture
    "envnames_anchored": "grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' /srv/asc/env | tr -d = | sort",
    "envvalue_read": 'v=$(grep -m1 "^$n=" /srv/asc/env | cut -d= -f2-)',
    "cut_not_env": 'cut -d= -f1 /tmp/report.csv',
}
INCIDENT_15 = F["incident_15"]
CEREMONY_BOARD_CHECK = F["ceremony"]


def run(*args, stdin=None):
    return subprocess.run([sys.executable, CHECK, *args], input=stdin,
                          capture_output=True, text=True)


def codes(*args):
    """The finding codes the checker reports, in order."""
    out = run("--json", *args)
    return [f["code"] for f in json.loads(out.stdout)["findings"]]


class TheTwoReproductions(unittest.TestCase):
    """Sprint 2026-10-12 item 1's two named positive cases."""

    def test_incident_15s_own_first_command_is_caught(self):
        found = codes("--command", INCIDENT_15)
        # Both halves, separately: the expansion Incident 4 is about, and the
        # redaction filter Incident 3 is about. One finding would mean the
        # command's second mistake went unnamed.
        self.assertIn("X5-DEFAULT", found)
        self.assertIn("X5-REDACT", found)
        self.assertEqual(1, run("--command", INCIDENT_15).returncode)

    def test_the_ceremonys_board_presence_check_is_caught(self):
        found = codes("--command", CEREMONY_BOARD_CHECK)
        self.assertEqual(["X5-DEFAULT"], found)

    def test_the_finding_names_the_variable_and_offers_the_safe_form(self):
        out = run("--json", "--command", CEREMONY_BOARD_CHECK)
        finding = json.loads(out.stdout)["findings"][0]
        self.assertEqual("BOARD_RUNTIME_TOKEN", finding["name"])
        # L-X5's snippet, built for this variable: the point is that the seat
        # can paste the fix without reading the register.
        self.assertIn('"${BOARD_RUNTIME_TOKEN:+yes}"', finding["fix"])
        self.assertIn('"${#BOARD_RUNTIME_TOKEN}"', finding["fix"])

    def test_no_output_anywhere_contains_a_value(self):
        # The checker is handed a command naming a secret while that secret is
        # set in its own environment. Nothing it prints may contain the value.
        env = dict(os.environ, EXO_TOKEN="github_pat_11SECRETVALUE0000")
        out = subprocess.run(
            [sys.executable, CHECK, "--command", INCIDENT_15],
            capture_output=True, text=True, env=env)
        self.assertNotIn("github_pat_11SECRETVALUE0000", out.stdout)
        self.assertNotIn("github_pat_11SECRETVALUE0000", out.stderr)


class TheSafeFormsAreNeverFlagged(unittest.TestCase):
    """The false-positive half. If the guard flags the fix, nobody keeps it."""

    SAFE = [
        # L-X5's own snippet, copied verbatim from the register.
        'printf \'EXO_TOKEN present: %s length: %s\\n\' "${EXO_TOKEN:+yes}" "${#EXO_TOKEN}"',
        # The presence idioms every tool in this repository uses.
        '[ -n "$EXO_TOKEN" ] || echo "no token"',
        '[ -n "${BOARD_RUNTIME_TOKEN:-}" ] && echo "board configured"',
        'test -z "$GH_TOKEN" && exit 2',
        # Moving a credential is not printing it.
        'GH_TOKEN="$EXO_TOKEN" gh run list --limit 5',
        'export GH_TOKEN="${EXO_TOKEN:-${GH_TOKEN:-}}"',
        'value="${!name:-}"',
        # Using a credential is not printing it.
        'curl -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN" "$BOARD_API_URL/api/items"',
        # Names that look like secrets and are not.
        'echo "BOARD_API_URL=$BOARD_API_URL"',
        'echo "run $GITHUB_RUN_ID, summary $GITHUB_STEP_SUMMARY"',
        'echo "key file: $SSH_KEY_PATH"',
        # Flags, not a dump.
        "set -euo pipefail",
        'set -a; . /srv/asc/env; set +a',
    ]

    def test_each_safe_form_is_clean(self):
        for command in self.SAFE:
            with self.subTest(command=command):
                self.assertEqual([], codes("--command", command))

    def test_check_actions_reach_is_clean(self):
        """The file the sprint item names, and the repository's reference for
        all four safe shapes at once."""
        target = os.path.join(ROOT, "tools", "check-actions-reach.sh")
        self.assertEqual(0, run(target, "--quiet").returncode,
                         run(target).stdout)


class TheOtherTwoShapes(unittest.TestCase):

    def test_a_bare_expansion_inside_a_printer_is_caught(self):
        self.assertEqual(["X5-PRINT"], codes("--command", 'echo "tok $EXO_TOKEN"'))
        self.assertEqual(["X5-PRINT"],
                         codes("--command", 'printf "%s" "${BOARD_RUNTIME_TOKEN}"'))

    def test_an_empty_default_is_safe_in_a_test_and_not_in_a_printer(self):
        # `${T:-}` is the repository's own presence idiom and must pass inside
        # a test, and must not pass inside an echo, which prints the value.
        self.assertEqual([], codes("--command", '[ -n "${EXO_TOKEN:-}" ]'))
        self.assertEqual(["X5-PRINT"], codes("--command", 'echo "${EXO_TOKEN:-}"'))

    def test_a_redaction_filter_is_a_finding_even_with_no_secret_named(self):
        # Incident 3's actual mistake: trusting the filter. The pattern is a
        # guess about a format, and the value is already in the pipe.
        self.assertEqual(["X5-REDACT"], codes("--command", F["prefix_sed"]))
        self.assertEqual(["X5-REDACT"], codes("--command", F["mask_sed"]))
        self.assertEqual(["X5-REDACT"], codes("--command", F["pat_sed"]))

    def test_the_environment_dumps(self):
        self.assertEqual(["X5-ENVDUMP"], codes("--command", "printenv EXO_TOKEN"))
        self.assertEqual(["X5-ENVDUMP"], codes("--command", "env | grep TOKEN"))
        self.assertEqual([], codes("--command", "printenv BOARD_API_URL"))

    def test_an_indirect_expansion_inside_a_printer_is_named_as_unresolvable(self):
        found = codes("--command", 'echo "${!name}"')
        self.assertEqual(["X5-PRINT"], found)

    def test_actions_interpolation_is_not_a_shell_expansion(self):
        # `${{ secrets.X }}` is how a secret is supposed to arrive.
        self.assertEqual([], codes("--command",
                                   "BOARD_RUNTIME_TOKEN: ${{ secrets.BOARD_RUNTIME_TOKEN }}"))


class TheFifthShapeIsAVerboseClient(unittest.TestCase):
    """2026-10-23. The centralizer seat, diagnosing a board route that closed
    the connection without a status, reached for `curl -sv` to see whether the
    server answered at all. curl printed the request it sent, including
    `> Authorization: Bearer <value>`, into the run's own transcript — with
    this checker installed as a hook and the hook correctly silent, because
    what it read was the allowed form with one extra letter on an earlier
    flag. The file had named this as a limit it could not see. It can: the
    client is the command word and the flag is on the line.

    Every case below is a line someone would actually type.
    """

    def test_the_run_that_happened(self):
        self.assertEqual(["X5-VERBOSE"], codes(
            "--command",
            'curl -sv -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN" http://127.0.0.1:8090/api/work/x/y'))

    def test_the_flag_is_found_alone_clustered_and_long(self):
        for flag in ("-v", "-sv", "-vs", "-sSv", "--verbose", "--trace-ascii -", "--trace -"):
            with self.subTest(flag=flag):
                self.assertEqual(["X5-VERBOSE"], codes(
                    "--command", f'curl {flag} -H "Authorization: Bearer $EXO_TOKEN" https://api.github.com'))

    def test_each_client_is_judged_by_its_own_flag(self):
        # wget's -v prints no request headers and its --debug does; httpie's
        # -v prints the whole request. One letter is not a rule across clients.
        self.assertEqual([], codes("--command", 'wget -v --header="Authorization: Bearer $EXO_TOKEN" https://x'))
        self.assertEqual(["X5-VERBOSE"], codes("--command", 'wget --debug --header="Authorization: Bearer $EXO_TOKEN" https://x'))
        self.assertEqual(["X5-VERBOSE"], codes("--command", 'http -v https://x "Authorization: Bearer $EXO_TOKEN"'))

    def test_the_allowed_form_stays_allowed(self):
        """The whole point of the rule is that using a credential is fine. A
        check that flags the correct idiom is a check that gets turned off."""
        for cmd in ('curl -s -H "Authorization: Bearer $EXO_TOKEN" https://x',
                    'curl -fsSL -H "Authorization: Bearer $EXO_TOKEN" https://x',
                    'curl -sS -o /tmp/o.json -w "%{http_code}" -H "Authorization: Bearer $EXO_TOKEN" https://x'):
            with self.subTest(cmd=cmd):
                self.assertEqual([], codes("--command", cmd))

    def test_response_headers_are_not_the_request(self):
        """-i and --include print what came back. The bearer only ever goes
        out, so these are not findings and must not be made into noise."""
        self.assertEqual([], codes("--command", 'curl -si -H "Authorization: Bearer $EXO_TOKEN" https://x'))
        self.assertEqual([], codes("--command", 'curl --include -H "Authorization: Bearer $EXO_TOKEN" https://x'))

    def test_verbose_with_no_credential_on_the_line_is_not_a_finding(self):
        self.assertEqual([], codes("--command", "curl -sv https://example.com/health"))
        self.assertEqual([], codes("--command", 'curl -v -H "Accept: application/json" "$BOARD_API_URL/api/health"'))

    def test_the_fix_offered_is_the_status_and_the_body(self):
        out = run("--command", 'curl -v -H "Authorization: Bearer $EXO_TOKEN" https://x').stdout
        self.assertIn("drop the verbose flag", out)
        self.assertIn("http_code", out)


class WhichNamesCount(unittest.TestCase):

    def test_a_credential_word_in_the_name_is_enough(self):
        self.assertEqual(["X5-DEFAULT"], codes("--command", F["password"]))
        self.assertEqual(["X5-DEFAULT"], codes("--command", F["stripe"]))

    def test_a_name_that_holds_a_label_is_not_a_secret(self):
        self.assertEqual([], codes("--command", F["token_path"]))
        self.assertEqual([], codes("--command", F["key_name"]))

    def test_an_extra_name_can_be_added(self):
        self.assertEqual([], codes("--command", F["riddle"]))
        self.assertEqual(["X5-DEFAULT"],
                         codes("--name", "HOUSE_RIDDLE",
                               "--command", F["riddle"]))

    def test_list_names_prints_the_companys_own_names(self):
        out = run("--list-names")
        self.assertIn("EXO_TOKEN", out.stdout)
        self.assertIn("BOARD_RUNTIME_TOKEN", out.stdout)
        self.assertEqual(0, out.returncode)


class TheHook(unittest.TestCase):
    """--hook is the half that runs before the command does."""

    def payload(self, tool, **fields):
        return json.dumps({"tool_name": tool, "tool_input": fields})

    def decide(self, payload):
        out = run("--hook", stdin=payload)
        self.assertEqual(0, out.returncode, out.stderr)
        return json.loads(out.stdout)["hookSpecificOutput"]

    def test_an_unsafe_bash_command_is_denied_with_the_fix_in_the_reason(self):
        got = self.decide(self.payload("Bash", command=CEREMONY_BOARD_CHECK))
        self.assertEqual("deny", got["permissionDecision"])
        reason = got["permissionDecisionReason"]
        self.assertIn("X5-DEFAULT", reason)
        self.assertIn("${BOARD_RUNTIME_TOKEN:+yes}", reason)
        self.assertIn("L-X5", reason)

    def test_a_safe_command_gets_no_decision_at_all(self):
        got = self.decide(self.payload(
            "Bash",
            command='printf "present: %s\\n" "${EXO_TOKEN:+yes}"'))
        self.assertNotIn("permissionDecision", got)

    def test_writing_an_unsafe_line_into_a_file_is_denied_too(self):
        # The shape travels: a seat that cannot echo the value can still write
        # a script that does.
        got = self.decide(self.payload(
            "Write", file_path="x.sh", content=F["gh_default"]))
        self.assertEqual("deny", got["permissionDecision"])
        got = self.decide(self.payload(
            "Edit", file_path="x.sh", new_string=F["gh_default"]))
        self.assertEqual("deny", got["permissionDecision"])

    def test_an_unknown_tool_is_never_denied(self):
        got = self.decide(self.payload("Read", file_path="/etc/passwd"))
        self.assertNotIn("permissionDecision", got)

    def test_garbage_on_stdin_allows_the_command_and_says_why(self):
        # A guard that breaks the session is worse than the failure it guards.
        out = run("--hook", stdin="this is not json")
        self.assertEqual(0, out.returncode)
        self.assertNotIn("permissionDecision", out.stdout)
        self.assertIn("could not run", out.stderr)

    def test_a_suppression_marker_does_not_work_on_a_command(self):
        got = self.decide(self.payload(
            "Bash", command=CEREMONY_BOARD_CHECK + "  # L-X5-ALLOW: no"))
        self.assertEqual("deny", got["permissionDecision"])


class FileScanning(unittest.TestCase):

    def write(self, name, text):
        import tempfile
        d = tempfile.mkdtemp()
        p = os.path.join(d, name)
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(text)
        return p

    def test_a_marker_on_the_line_above_suppresses_the_finding(self):
        p = self.write("x.sh", "#!/bin/bash\n"
                               "# L-X5-ALLOW: documented example\n"
                               + F["exo_default"] + "\n")
        self.assertEqual(0, run(p, "--quiet").returncode)
        self.assertEqual(1, run(p, "--quiet", "--no-allow").returncode)

    def test_the_finding_reports_the_line_number(self):
        p = self.write("x.sh", "#!/bin/bash\nsleep 1\n"
                               + F["exo_default"] + "\n")
        finding = json.loads(run("--json", p).stdout)["findings"][0]
        self.assertEqual(3, finding["line"])

    def test_a_missing_file_is_a_could_not_run_and_not_a_pass(self):
        out = run("/nonexistent/path.sh")
        self.assertEqual(2, out.returncode)


class QuotingAndHeredocs(unittest.TestCase):
    """What the shell does not expand, the checker must not call a print.

    All four of these were found on 2026-10-18 by using the guard, which is
    the only way false positives are found: three denied a command this seat
    had actually typed, and the fourth was a line on `main` the first heredoc
    rule read as printing a token.
    """

    def test_a_single_quoted_pattern_naming_a_secret_is_not_a_print(self):
        # Verbatim, the command the guard denied while this run was reading
        # which workflows carry the Langfuse tracing step.
        self.assertEqual([], codes(
            "--command",
            "grep -l 'add-mask::$auth' .github/workflows/*.yml"))

    def test_a_single_quote_inside_double_quotes_still_expands(self):
        self.assertEqual(["X5-PRINT"], codes(
            "--command", F["apostrophe"]))

    def test_a_quoted_heredoc_body_is_data_and_never_a_command(self):
        # Writing a file whose text contains the shape — a baseline entry, a
        # test fixture, a lesson quoting the idiom. `<<\'EOF\'` is the shell's
        # own "take this literally", and nothing in the body runs or expands.
        self.assertEqual([], codes("--command", F["quoted_heredoc"]))

    def test_an_unquoted_heredoc_fed_to_a_printer_is_still_caught(self):
        # The escape hatch above must not become the way around the guard.
        self.assertEqual(["X5-PRINT"], codes(
            "--command", F["unquoted_heredoc"]))

    def test_an_escaped_dollar_in_a_heredoc_prints_the_name_not_the_value(self):
        # runtime/board/install.sh:122, verbatim: help text that deliberately
        # shows the variable's name, which is why the backslash is there.
        self.assertEqual([], codes("--command", F["escaped_heredoc"]))

    def test_the_heredoc_rule_does_not_lose_the_lines_after_the_body(self):
        # A body that swallowed the rest of the file would silence everything
        # below it, which is the dangerous way for this rule to be wrong.
        self.assertEqual(["X5-DEFAULT"], codes(
            "--command", F["heredoc_then_unsafe"]))


class TheBaselinesPathIsAGlob(unittest.TestCase):
    """One decision, made at the generator, for every file it generates."""

    def write(self, text, name="baseline.txt"):
        import tempfile
        p = os.path.join(tempfile.mkdtemp(), name)
        with open(p, "w", encoding="utf-8") as fh:
            fh.write(text)
        return p

    def script(self, text):
        import tempfile
        d = tempfile.mkdtemp()
        p = os.path.join(d, "generated.sh")
        with open(p, "w", encoding="utf-8") as fh:
            fh.write("#!/bin/bash\n" + text + "\n")
        return p

    def test_a_glob_entry_accepts_the_matching_file(self):
        target = self.script(F["gh_default"])
        base = self.write("*/generated.sh | X5-DEFAULT | " + F["gh_default"])
        self.assertEqual(0, run(target, "--baseline", base, "--quiet").returncode)

    def test_a_glob_entry_does_not_accept_a_file_it_does_not_match(self):
        target = self.script(F["gh_default"])
        base = self.write("tools/other.sh | X5-DEFAULT | " + F["gh_default"])
        self.assertEqual(1, run(target, "--baseline", base, "--quiet").returncode)

    def test_the_code_and_the_line_must_still_match_exactly(self):
        target = self.script(F["gh_default"])
        base = self.write("* | X5-PRINT | " + F["gh_default"])
        self.assertEqual(1, run(target, "--baseline", base, "--quiet").returncode)

    def test_a_source_line_containing_a_pipe_survives_the_parse(self):
        # The loader used to re-join every `|` in the line with spaces, so an
        # entry for a line with a pipe in it could never match. The sprint
        # item's own false-positive case is such a line.
        target = self.script(F["piped_row"])
        base = self.write("* | X5-REDACT | " + F["piped_row"])
        self.assertEqual(0, run(target, "--baseline", base, "--quiet").returncode)


class TheGuardCanStillBeMaintained(unittest.TestCase):
    """An edit that has to carry the shape: the baseline entry, the test
    fixture, the lesson quoting the idiom.

    On 2026-10-18 the hook denied this seat three times while it was fixing
    the checker itself, because an edit was read as a command. A command has
    no reviewer and keeps no suppression; an edit is reviewed by the diff and
    by the repository scan in CI, so it keeps both.
    """

    def payload(self, tool, **fields):
        return json.dumps({"tool_name": tool, "tool_input": fields})

    def decide(self, payload):
        out = run("--hook", stdin=payload)
        self.assertEqual(0, out.returncode, out.stderr)
        return json.loads(out.stdout)["hookSpecificOutput"]

    def test_an_edit_carrying_a_marker_with_a_reason_is_allowed(self):
        got = self.decide(self.payload(
            "Write", file_path="tools/tests/fixture.py",
            content="# L-X5-ALLOW: recorded fixture, never executed\n"
                    + F["gh_default"] + "\n"))
        self.assertNotIn("permissionDecision", got)

    def test_an_edit_of_a_line_the_baseline_accepts_is_allowed(self):
        got = self.decide(self.payload(
            "Write", file_path=".github/workflows/agent-marketing.yml",
            content=F["langfuse_mask"]))
        self.assertNotIn("permissionDecision", got)

    def test_an_unmarked_edit_is_still_denied_and_names_both_mechanisms(self):
        got = self.decide(self.payload(
            "Write", file_path="tools/new-thing.sh", content=F["gh_default"]))
        self.assertEqual("deny", got["permissionDecision"])
        reason = got["permissionDecisionReason"]
        self.assertIn("L-X5-ALLOW", reason)
        self.assertIn("secret-print-baseline.txt", reason)
        self.assertIn("edit", reason)

    def test_a_command_keeps_no_suppression_even_with_a_marker(self):
        # The same text, as a command, with both mechanisms attempted.
        got = self.decide(self.payload(
            "Bash", command=F["langfuse_mask"] + "  # L-X5-ALLOW: no"))
        self.assertEqual("deny", got["permissionDecision"])


class TheRegisterTheRuleLivesIn(unittest.TestCase):
    """The guard must not deny the files that document the guard.

    Re-measured by epitome's exo and routed here by the PM on 2026-11-02: the
    edit path had no prose predicate, so an Edit adding an entry to
    `standards/lessons.md`, to the standard that explains the checker, or to
    the checker's own exemptions file was denied by the rule that entry
    documents. The vendor tool and a plain file copy passed, which is why
    nothing reported it: only a hand that writes the register was stopped.

    These are the three paths that measurement found denied, plus the two
    halves that keep the exemption narrow: a command is still a command, and
    a runnable file is still guarded.
    """

    # The shape a register entry actually has: the idiom inside a fence. The
    # marker is on no line of it, because the point is that none is needed.
    ENTRY = ('- **L-X9 — a seat prints a token when it checks one.**\n'
             '\n'
             '  ```sh\n'
             '  ' + F["gh_default"] + '\n'
             '  ```\n')

    def decide(self, tool, path, text):
        field = "new_string" if tool == "Edit" else "content"
        payload = json.dumps({"tool_name": tool,
                              "tool_input": {"file_path": path, field: text}})
        out = run("--hook", stdin=payload)
        self.assertEqual(0, out.returncode, out.stderr)
        return json.loads(out.stdout)["hookSpecificOutput"]

    def test_amending_the_register_that_carries_the_rule_is_allowed(self):
        got = self.decide("Edit", "standards/lessons.md", self.ENTRY)
        self.assertNotIn("permissionDecision", got)

    def test_amending_the_standard_that_explains_the_guard_is_allowed(self):
        got = self.decide("Edit", "standards/secrets.md", self.ENTRY)
        self.assertNotIn("permissionDecision", got)

    def test_writing_a_new_line_into_the_exemptions_file_is_allowed(self):
        got = self.decide("Edit", "tools/secret-print-baseline.txt",
                          "tools/new-thing.sh | X5-PRINT | " + F["gh_default"])
        self.assertNotIn("permissionDecision", got)

    def test_an_incident_record_is_prose_too(self):
        got = self.decide("Write", "docs/agents/incidents.md", self.ENTRY)
        self.assertNotIn("permissionDecision", got)

    def test_a_command_that_writes_prose_is_still_a_command(self):
        # The exemption is about what an edit CREATES, never about where a
        # command points: this one runs now and nothing reviews it.
        payload = json.dumps({"tool_name": "Bash", "tool_input": {
            "command": F["gh_default"] + " >> standards/lessons.md"}})
        out = run("--hook", stdin=payload)
        got = json.loads(out.stdout)["hookSpecificOutput"]
        self.assertEqual("deny", got["permissionDecision"])

    def test_a_runnable_file_is_still_guarded(self):
        for path in ("tools/new-thing.sh", "tools/new-thing.py",
                     "runtime/board/thing.py", ".github/workflows/x.yml"):
            with self.subTest(path=path):
                got = self.decide("Write", path, F["gh_default"])
                self.assertEqual("deny", got["permissionDecision"])

    def test_an_unknown_suffix_stays_guarded_rather_than_guessed_at(self):
        got = self.decide("Write", "tools/thing.conf", F["gh_default"])
        self.assertEqual("deny", got["permissionDecision"])

    def test_the_register_is_still_scannable_when_a_caller_names_it(self):
        # The exemption answers to this audit, so it has to keep working: the
        # two recorded commands in L-X5's own prose are still found.
        out = run(os.path.join(ROOT, "standards", "lessons.md"), "--quiet")
        self.assertEqual(1, out.returncode, out.stdout + out.stderr)

    def test_a_marker_covers_the_fenced_block_it_introduces(self):
        # The old marker rule covered the next line only, so in a register the
        # fence line absorbed it and the idiom below was still denied.
        text = ("<!-- L-X5-ALLOW: the shape this entry is about -->\n"
                "```sh\n"
                + F["gh_default"] + "\n"
                + F["exo_default"] + "\n"
                "```\n")
        got = self.decide("Write", "tools/fixtures.sh", text)
        self.assertNotIn("permissionDecision", got)

    def test_a_fenced_block_with_no_marker_is_not_a_hiding_place(self):
        text = "```sh\n" + F["gh_default"] + "\n```\n"
        got = self.decide("Write", "tools/fixtures.sh", text)
        self.assertEqual("deny", got["permissionDecision"])

    def test_the_denial_names_the_three_ways_out(self):
        got = self.decide("Write", "tools/new-thing.sh", F["gh_default"])
        reason = got["permissionDecisionReason"]
        self.assertIn("L-X5-ALLOW", reason)
        self.assertIn("secret-print-baseline.txt", reason)
        self.assertIn("fence", reason)


class TheRepositoryItself(unittest.TestCase):
    """The CI half of the enforcement: HQ's own executable surfaces are clean.

    This is the test that fails when a seat commits the shape instead of
    typing it, which is the case the PreToolUse hook cannot see (a seat
    running outside Claude Code, or a file written by a generator).
    """

    def test_the_executable_surfaces_carry_no_unaccepted_l_x5_shape(self):
        out = run("--baseline", BASELINE)
        self.assertEqual(0, out.returncode,
                         "new L-X5 finding in the repository:\n" + out.stdout)

    def test_every_baseline_entry_still_matches_something(self):
        """An exemption for a line that no longer exists is a stale exemption,
        and the file is small enough that this is cheap to keep true.

        An entry's path is a glob, so this cannot be a string comparison any
        more: it asserts both directions of the match instead — every entry
        accepts at least one real finding, and every accepted finding was
        accepted by some entry.
        """
        out = run("--baseline", BASELINE, "--show-accepted", "--json")
        accepted = json.loads(out.stdout)["accepted"]
        with open(BASELINE, encoding="utf-8") as fh:
            entries = [tuple(part.strip() for part in line.split("|", 2))
                       for line in fh
                       if line.strip() and not line.startswith("#")]
        self.assertTrue(entries, "the baseline has no entries at all")
        matched = set()
        for e_path, e_code, e_text in entries:
            hits = [k for k in accepted
                    if fnmatch.fnmatch(k.split(" | ", 2)[0], e_path)
                    and k.split(" | ", 2)[1] == e_code
                    and k.split(" | ", 2)[2] == e_text]
            self.assertTrue(hits, f"stale baseline entry: {e_path} | {e_code}")
            matched.update(hits)
        self.assertEqual(sorted(matched), sorted(accepted))

    def test_the_checker_is_clean_against_itself(self):
        self.assertEqual(0, run(CHECK, "--quiet").returncode,
                         run(CHECK).stdout)

class TheTracer(unittest.TestCase):
    """X5-TRACE, the fifth shape. Incident 18.

    The tracer is the one shape where the safe form is the victim: `set -x`
    makes the shell echo the command it is about to run with every expansion
    already performed, so `-H "Authorization: Bearer $T"` prints the token.
    The checker was correct about that command and silent about the flag, for
    six days, which is the gap this class closes.
    """

    def test_incident_18s_own_traced_board_write_is_caught(self):
        self.assertIn("X5-TRACE", codes("--command", F["incident_18"]))

    def test_the_flag_is_found_in_a_cluster_and_in_the_long_form(self):
        self.assertIn("X5-TRACE", codes("--command", F["trace_short"]))
        self.assertIn("X5-TRACE", codes("--command", F["trace_xtrace"]))

    def test_an_interpreter_invoked_with_the_flag_counts(self):
        self.assertIn("X5-TRACE", codes("--command", F["trace_interpreter"]))

    def test_turning_tracing_off_is_never_a_finding(self):
        self.assertEqual([], codes("--command", F["trace_off"]))

    def test_strict_mode_without_x_is_not_tracing(self):
        self.assertEqual([], codes("--command", F["strict_mode"]))

    def test_tracing_with_no_credential_in_scope_is_left_alone(self):
        """Most `set -ex` in this repository is in a script with no secret in
        it, and flagging those would make the rule noise."""
        self.assertEqual([], codes("--command", F["trace_no_secret"]))

    def test_the_fix_names_the_fence_rather_than_the_safe_form(self):
        out = json.loads(run("--json", "--command", F["incident_18"]).stdout)
        fix = [f["fix"] for f in out["findings"] if f["code"] == "X5-TRACE"][0]
        self.assertIn("set +x", fix)


class TheNamesOnlyRead(unittest.TestCase):
    """X5-ENVNAMES, the sixth shape. Incident 20.

    `cut -d= -f1` on an env file reads as "names, no values", and it is, for
    every value that fits on one line. A multi-line value's continuation lines
    carry no `=`, so the filter has nothing to cut and passes them through
    whole. The rendered file on the host has exactly one such value.
    """

    def test_incident_20s_own_command_is_caught(self):
        self.assertIn("X5-ENVNAMES", codes("--command", F["incident_20"]))

    def test_the_awk_and_sed_spellings_of_the_same_idiom_are_caught(self):
        self.assertIn("X5-ENVNAMES", codes("--command", F["envnames_awk"]))
        self.assertIn("X5-ENVNAMES", codes("--command", F["envnames_sed"]))

    def test_a_dotenv_stream_counts_as_an_env_file(self):
        """The shape that was on main: the names come out of
        `infisical export --format=dotenv`, not out of a path."""
        self.assertIn("X5-ENVNAMES", codes("--command", F["envnames_dotenv"]))

    def test_the_anchored_read_is_the_fix_and_stays_clean(self):
        self.assertEqual([], codes("--command", F["envnames_anchored"]))

    def test_a_deliberate_value_read_is_not_this_shape(self):
        """`cut -d= -f2-` is the author asking for the value, which the
        existing rules already judge; this rule is only about the read that
        believes it is safe."""
        self.assertEqual([], codes("--command", F["envvalue_read"]))

    def test_a_csv_is_not_an_env_file(self):
        self.assertEqual([], codes("--command", F["cut_not_env"]))

    def test_the_fix_is_the_anchored_grep(self):
        out = json.loads(run("--json", "--command", F["incident_20"]).stdout)
        fix = [f["fix"] for f in out["findings"]
               if f["code"] == "X5-ENVNAMES"][0]
        self.assertIn("^[A-Za-z_][A-Za-z0-9_]*=", fix)


if __name__ == "__main__":
    unittest.main()
