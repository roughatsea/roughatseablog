#!/usr/bin/env python3
"""Execute the exact sample-tagged code printed in the four SOLID review articles.

Only documented imports, namespaces, entry points, and test assertions are added.
C# tests require .NET 8 or a compatible SDK with the net8.0 targeting pack.
"""
from __future__ import annotations
import argparse
from contextlib import redirect_stdout
from decimal import Decimal
import io
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / 'src/pages/guides/software-engineering/review/solid-batch-1'
SLUGS = {
    'srp': 'single-responsibility-principle',
    'lsp': 'liskov-substitution-principle',
    'isp': 'interface-segregation-principle',
    'dip': 'dependency-inversion-principle',
}
USED: set[tuple[str, str, str]] = set()
SAMPLES: dict[str, dict[str, dict[str, str]]] = {}
for topic, slug in SLUGS.items():
    SAMPLES[topic] = {'python': {}, 'csharp': {}}
    text = (ARTICLES / (slug + '.mdx')).read_text()
    for language, name, code in re.findall(r'^```(python|csharp) sample=([\w-]+)\n(.*?)^```', text, re.M | re.S):
        assert name not in SAMPLES[topic][language], (slug, language, name)
        SAMPLES[topic][language][name] = code
    assert sum(text.count('```' + lang) for lang in ['python', 'csharp']) == sum(map(len, SAMPLES[topic].values())), slug


def sample(topic: str, language: str, name: str) -> str:
    USED.add((topic, language, name))
    return SAMPLES[topic][language][name]


def python_scope(topic: str, *names: str) -> dict:
    scope = {'__name__': '__example__'}
    for name in names:
        exec(compile(sample(topic, 'python', name), f'{SLUGS[topic]}:{name}', 'exec'), scope)
    return scope


def printed(topic: str, name: str, scope: dict, expected: str) -> None:
    output = io.StringIO()
    with redirect_stdout(output):
        exec(sample(topic, 'python', name), scope)
    assert output.getvalue() == expected, (topic, name, output.getvalue())


def rejects(error: type[Exception], function, *args) -> None:
    try:
        function(*args)
    except error:
        return
    raise AssertionError(f'{function} did not raise {error.__name__}')


def python_tests() -> None:
    old = python_scope('srp', 'original')
    new = python_scope('srp', 'refactored')
    printed('srp', 'original-use', old, 'Mira earned 110 coins.\n')
    printed('srp', 'refactored-use', new, 'Mira earned 110 coins.\n110\n')
    for name in ['Mira', 'Ada', '']:
        for difficulty in range(1, 6):
            for bonus in [False, True]:
                expected = f'{name} earned {difficulty * 20 + (50 if bonus else 0)} coins.'
                assert old['QuestResults']().build_message(name, difficulty, bonus) == expected
                assert new['QuestResults']().build_message(name, difficulty, bonus) == expected
    for scope in [old, new]:
        for difficulty in [-1, 0, 6]:
            rejects(ValueError, scope['QuestResults']().build_message, 'Mira', difficulty, True)
    assert new['RewardFormatter']().format('Mira', 7) == 'Mira earned 7 coins.'
    print('PASS Python SRP: every allowed difficulty/bonus, messages, independent formatter, invalid difficulty')

    broken = python_scope('lsp', 'contract', 'broken')
    fixed = python_scope('lsp', 'contract', 'corrected')
    printed('lsp', 'broken-use', broken, '50\nA valid purchase was rejected.\n')
    printed('lsp', 'corrected-use', fixed, '50\n80.00\n120.00\n')
    rejects(ValueError, broken['MinimumSpendDiscount']().apply, Decimal('50'))
    for amount in ['0', '0.01', '50', '99.99', '100', '100.01', '150', '1000000']:
        subtotal = Decimal(amount)
        for kind in ['NoDiscount', 'MinimumSpendDiscount']:
            result = fixed['Checkout']().calculate_total(subtotal, fixed[kind]())
            expected = subtotal if kind == 'NoDiscount' or subtotal < 100 else subtotal * Decimal('0.80')
            assert result == expected and 0 <= result <= subtotal
    for kind in ['NoDiscount', 'MinimumSpendDiscount']:
        rejects(ValueError, fixed[kind]().apply, Decimal('-1'))
    print('PASS Python LSP: original contract violation detected; corrected inputs, threshold, result bounds, negatives')

    old = python_scope('isp', 'original')
    new = python_scope('isp', 'refactored', 'snapshot')
    printed('isp', 'original-use', old, 'Mira: mira@example.test\n')
    printed('isp', 'refactored-use', new, 'Mira: mira@example.test\n')
    printed('isp', 'snapshot-use', new, 'Mira: mira@example.test\n')
    for scope in [old, new]:
        directory = scope['MemoryDirectory']()
        page = scope['DirectoryPage'](directory)
        for email in ['mira@example.test', 'new@example.test']:
            directory.set_email('Mira', email)
            assert page.show('Mira') == 'Mira: ' + email
        rejects(KeyError, page.show, 'Unknown')
    original_entries = {'Mira': 'mira@example.test'}
    snapshot = new['SnapshotDirectory'](original_entries)
    original_entries['Mira'] = 'changed@example.test'
    assert snapshot.email_for('Mira') == 'mira@example.test'
    assert not hasattr(snapshot, 'set_email')
    # Runtime duck typing was already sufficient in the original Python page.
    assert old['DirectoryPage'](snapshot).show('Mira') == new['DirectoryPage'](snapshot).show('Mira')
    print('PASS Python ISP: unchanged lookup/editing, snapshot copy, unknown names, original runtime compatibility')

    with tempfile.TemporaryDirectory() as temp:
        folder = Path(temp)
        old_dir = folder / 'original'
        old_dir.mkdir()
        files = {'console_notifier.py': 'original-console', 'original_monitor.py': 'original-monitor', 'main.py': 'original-use'}
        for file, name in files.items():
            (old_dir / file).write_text(sample('dip', 'python', name))
        result = run([sys.executable, 'main.py'], old_dir)
        assert result.stdout == 'Pencils: 3 left. Order more.\n'
        new_dir = folder / 'refactored'
        new_dir.mkdir()
        for file, name in {'application.py': 'application', 'recording_notifier.py': 'recording', 'check_recording.py': 'recording-use'}.items():
            (new_dir / file).write_text(sample('dip', 'python', name))
        # The delivery implementation does not even exist during these tests.
        result = run([sys.executable, 'check_recording.py'], new_dir)
        assert result.stdout == '1\nPencils:3\n'
        (new_dir / 'assert_rule.py').write_text('''from application import InventoryMonitor
from recording_notifier import RecordingNotifier
import sys
assert 'console_notifier' not in sys.modules
notifier = RecordingNotifier()
monitor = InventoryMonitor(notifier)
for count in [0, 1, 4, 5, 6]:
    monitor.check('Pencils', count)
assert notifier.notices == ['Pencils:0', 'Pencils:1', 'Pencils:4']
try:
    monitor.check('Pencils', -1)
except ValueError:
    pass
else:
    raise AssertionError('negative count accepted')
assert len(notifier.notices) == 3
''')
        run([sys.executable, 'assert_rule.py'], new_dir)
        for file, name in {'console_notifier.py': 'console', 'main.py': 'refactored-use'}.items():
            (new_dir / file).write_text(sample('dip', 'python', name))
        result = run([sys.executable, 'main.py'], new_dir)
        assert result.stdout == 'Pencils: 3 left. Order more.\n'
    print('PASS Python DIP: actual modules, application tests without delivery file, thresholds, preserved console output')


def run(command: list[str], cwd: Path, timeout: int = 120) -> subprocess.CompletedProcess:
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True, timeout=timeout)
    if result.returncode:
        raise AssertionError(f'{command}\n{result.stdout}\n{result.stderr}')
    return result


IMPORTS = 'using System;\nusing System.Collections.Generic;\n'
HELPERS = '''static void Check(bool value) { if (!value) throw new Exception("Assertion failed"); }
static void Reject<T>(Action action) where T : Exception {
    try { action(); } catch (T) { return; }
    throw new Exception("Expected rejection: " + typeof(T).Name);
}
'''


def project(folder: Path, name: str, source: str, executable: bool = True, references: list[Path] | None = None) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    refs = ''.join(f'<ProjectReference Include="{p.as_posix()}" />' for p in (references or []))
    output = 'Exe' if executable else 'Library'
    path = folder / (name + '.csproj')
    path.write_text(f'<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><TargetFramework>net8.0</TargetFramework><OutputType>{output}</OutputType><ImplicitUsings>disable</ImplicitUsings><Nullable>enable</Nullable></PropertyGroup><ItemGroup>{refs}</ItemGroup></Project>')
    (folder / 'Example.cs').write_text(IMPORTS + source)
    return path


def cs_namespace(topic: str, name: str, declarations: list[str], uses: list[str]) -> str:
    body = '\n'.join(sample(topic, 'csharp', part) for part in declarations)
    statements = '\n'.join('{\n' + sample(topic, 'csharp', part) + '\n}' for part in uses)
    return 'namespace ' + name + ' {\n' + body + '\npublic static class PrintedCalls { public static void Run() {\n' + statements + '\n} }\n}\n'


def main(body: str) -> str:
    return 'public static class Program {\n' + HELPERS + '\npublic static void Main() {\n' + body + '\n} }\n'


def dotnet_tests() -> None:
    with tempfile.TemporaryDirectory() as temp:
        root = Path(temp)
        source = cs_namespace('srp', 'Original', ['original'], ['original-use'])
        source += cs_namespace('srp', 'Revised', ['refactored'], ['refactored-use'])
        source += main('''Original.PrintedCalls.Run(); Revised.PrintedCalls.Run();
for (int d = 1; d <= 5; d++) {
    foreach (bool bonus in new[] {false, true}) {
        string expected = $"Mira earned {d * 20 + (bonus ? 50 : 0)} coins.";
        Check(new Original.QuestResults().BuildMessage("Mira", d, bonus) == expected);
        Check(new Revised.QuestResults().BuildMessage("Mira", d, bonus) == expected);
    }
}
foreach (int d in new[] {-1, 0, 6}) {
    Reject<ArgumentOutOfRangeException>(() => new Original.QuestResults().BuildMessage("Mira", d, true));
    Reject<ArgumentOutOfRangeException>(() => new Revised.QuestResults().BuildMessage("Mira", d, true));
}
Check(new Revised.RewardFormatter().Format("Mira", 7) == "Mira earned 7 coins.");''')
        path = project(root / 'srp', 'SRP', source)
        run(['dotnet', 'run', '--project', str(path)], root)
        print('PASS C# SRP: printed calls, before/after equivalence, validation and isolated formatter')

        source = cs_namespace('lsp', 'Broken', ['contract', 'broken'], ['broken-use'])
        source += cs_namespace('lsp', 'Fixed', ['contract', 'corrected'], ['corrected-use'])
        source += main('''Broken.PrintedCalls.Run(); Fixed.PrintedCalls.Run();
Reject<ArgumentOutOfRangeException>(() => new Broken.MinimumSpendDiscount().Apply(50m));
foreach (decimal amount in new[] {0m, .01m, 50m, 99.99m, 100m, 100.01m, 150m, 1000000m}) {
    decimal result = new Fixed.MinimumSpendDiscount().Apply(amount);
    Check(result == (amount < 100m ? amount : amount * .80m));
    Check(result >= 0m && result <= amount);
    Check(new Fixed.NoDiscount().Apply(amount) == amount);
}
Reject<ArgumentOutOfRangeException>(() => new Fixed.MinimumSpendDiscount().Apply(-1m));
Reject<ArgumentOutOfRangeException>(() => new Fixed.NoDiscount().Apply(-1m));''')
        path = project(root / 'lsp', 'LSP', source)
        run(['dotnet', 'run', '--project', str(path)], root)
        print('PASS C# LSP: intentional violation, corrected threshold, result promises and negative rejection')

        source = cs_namespace('isp', 'Original', ['original'], ['original-use'])
        source += cs_namespace('isp', 'Revised', ['refactored', 'snapshot'], ['refactored-use', 'snapshot-use'])
        source += main('''Original.PrintedCalls.Run(); Revised.PrintedCalls.Run();
var old = new Original.MemoryDirectory(); var revised = new Revised.MemoryDirectory();
foreach (string email in new[] {"mira@example.test", "new@example.test"}) {
    old.SetEmail("Mira", email); revised.SetEmail("Mira", email);
    Check(new Original.DirectoryPage(old).Show("Mira") == new Revised.DirectoryPage(revised).Show("Mira"));
}
Reject<KeyNotFoundException>(() => new Original.DirectoryPage(old).Show("Unknown"));
Reject<KeyNotFoundException>(() => new Revised.DirectoryPage(revised).Show("Unknown"));
var entries = new Dictionary<string,string> {{"Mira", "mira@example.test"}};
var snapshot = new Revised.SnapshotDirectory(entries);
entries["Mira"] = "changed@example.test";
Check(snapshot.EmailFor("Mira") == "mira@example.test");
Check(typeof(Revised.SnapshotDirectory).GetMethod("SetEmail") == null);''')
        path = project(root / 'isp', 'ISP', source)
        run(['dotnet', 'run', '--project', str(path)], root)
        print('PASS C# ISP: printed calls, unchanged lookup/editing, copied snapshot, lookup-only capability')

        original = sample('dip', 'csharp', 'original') + main(sample('dip', 'csharp', 'original-use'))
        path = project(root / 'dip-original', 'Original', original)
        result = run(['dotnet', 'run', '--project', str(path)], root)
        assert 'Pencils: 3 left. Order more.' in result.stdout
        application = project(root / 'dip' / 'Application', 'InventoryApplication', sample('dip', 'csharp', 'application'), False)
        run(['dotnet', 'build', str(application), '--nologo'], root)
        # Test project references Application ONLY; delivery project does not exist yet.
        checks = sample('dip', 'csharp', 'recording') + main('{\n' + sample('dip', 'csharp', 'recording-use') + '\n}\n' + '''
var observed = new RecordingNotifier(); var testedMonitor = new InventoryMonitor(observed);
foreach (int count in new[] {0, 1, 4, 5, 6}) testedMonitor.Check("Pencils", count);
Check(observed.Notices.Count == 3);
Check(observed.Notices[0] == "Pencils:0" && observed.Notices[2] == "Pencils:4");
Reject<ArgumentOutOfRangeException>(() => testedMonitor.Check("Pencils", -1));
Check(observed.Notices.Count == 3);
''')
        tests = project(root / 'dip' / 'Tests', 'RuleTests', checks, references=[application])
        run(['dotnet', 'run', '--project', str(tests)], root)
        delivery = project(root / 'dip' / 'Delivery', 'InventoryDelivery', sample('dip', 'csharp', 'console'), False, [application])
        startup = project(root / 'dip' / 'Startup', 'Startup', main(sample('dip', 'csharp', 'refactored-use')), references=[application, delivery])
        result = run(['dotnet', 'run', '--project', str(startup)], root)
        assert 'Pencils: 3 left. Order more.' in result.stdout
        print('PASS C# DIP: application compiles/tests with no delivery project; console integration preserves output')


def check_coverage(languages: list[str]) -> None:
    expected = {(t, lang, n) for t in SAMPLES for lang in languages for n in SAMPLES[t][lang]}
    assert expected <= USED, ('Untested printed samples', sorted(expected - USED))
    print(f'PASS coverage: all {len(expected)} printed {"/".join(languages)} snippets exercised')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--require-dotnet', action='store_true')
    args = parser.parse_args()
    python_tests()
    if shutil.which('dotnet'):
        os.environ['DOTNET_NOLOGO'] = 'true'
        os.environ['DOTNET_CLI_TELEMETRY_OPTOUT'] = '1'
        dotnet_tests()
        check_coverage(['python', 'csharp'])
    elif args.require_dotnet:
        raise SystemExit('FAIL: .NET SDK required but not found')
    else:
        check_coverage(['python'])
        print('NOT RUN: C# execution; install .NET SDK and use --require-dotnet')
