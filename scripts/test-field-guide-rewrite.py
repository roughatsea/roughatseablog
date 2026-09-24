#!/usr/bin/env python3
"""Execute the displayed examples, grouped by version, from the new MDX lessons.

C# declarations get separate namespaces; printed call sites and additional checks
run in separate lexical scopes. Python groups run in fresh processes. This verifies
selected behaviors, not arbitrary equivalence or reader enjoyment.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / 'src/content/field-guide'
APPROVED = {'single-responsibility-principle', 'open-closed-principle', 'liskov-substitution-principle', 'interface-segregation-principle', 'dependency-inversion-principle', 'switch-statements', 'deadlocks-and-lock-discipline'}
FENCE = re.compile(r'^```(csharp|python)([^\n]*)\n(.*?)^```\s*$', re.M | re.S)


def load_article(path):
    text = path.read_text(encoding='utf-8')
    marker = 'export const checks = '
    if marker not in text:
        raise AssertionError(f'{path.name}: missing executable checks')
    checks, _ = json.JSONDecoder().raw_decode(text.split(marker, 1)[1].lstrip())
    groups = {}
    count = 0
    for language, meta, code in FENCE.findall(text):
        group_match = re.search(r'group=([\w-]+)', meta)
        if not group_match:
            raise AssertionError(f'{path.name}: ungrouped {language} example')
        group = group_match.group(1)
        role_match = re.search(r'role=(types|run)', meta)
        role = role_match.group(1) if role_match else 'types'
        groups.setdefault((language, group), []).append((role, code))
        count += 1
    assert groups, f'{path.name}: no executable examples'
    assert {'csharp', 'python'} == {language for language, _ in groups}, path.name
    for language, group in groups:
        assert checks.get(language, {}).get(group), f'{path.name}: missing {language}/{group} checks'
    expected = {(lang, group) for lang, entries in checks.items() for group in entries}
    assert expected == set(groups), f'{path.name}: checks do not match printed groups'
    return text, groups, checks, count


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--require-dotnet', action='store_true')
    parser.add_argument('--complete', action='store_true')
    args = parser.parse_args()
    paths = sorted(ARTICLES.glob('*.mdx'))
    source = (ROOT / 'src/data/code-guru/concept-slugs.js').read_text()
    known = set(re.findall(r"\d+: '([^']+)'", source)) | {'singleton-lifetime'}
    found = {p.stem for p in paths}
    assert found <= known - APPROVED, 'Unknown slug or overwrite of an approved article'
    if args.complete:
        assert found == known - APPROVED, f'Missing articles: {sorted(known - APPROVED - found)}'
    assert len(known) == 206
    results = []
    csharp_sources = []
    csharp_calls = []
    snippet_count = 0
    group_count = 0
    for path in paths:
        text, groups, checks, count = load_article(path)
        snippet_count += count
        assert text.startswith('---\n'), path.name
        assert '## Sources' in text and 'https://' in text, f'{path.name}: missing sources'
        for (language, group), blocks in groups.items():
            group_count += 1
            extra = checks[language][group]
            if language == 'python':
                code = '\n\n'.join(code for _, code in blocks) + '\n\n' + extra
                run = subprocess.run([sys.executable, '-c', code], text=True, capture_output=True, timeout=15)
                if run.returncode:
                    raise AssertionError(f'{path.name} Python/{group}\n{run.stdout}\n{run.stderr}')
            else:
                ident = f'Sample{len(csharp_sources)}'
                types = '\n\n'.join(code for role, code in blocks if role == 'types')
                calls = '\n\n'.join(code for role, code in blocks if role == 'run')
                csharp_sources.append(f'namespace {ident} {{\n{types}\ninternal static class Harness {{ public static async System.Threading.Tasks.Task Run() {{\n{{\n{calls}\n}}\n{{\n{extra}\n}}\nawait System.Threading.Tasks.Task.CompletedTask;\n}} }}\n}}')
                csharp_calls.append(f'await {ident}.Harness.Run();')
        results.append({'slug': path.stem, 'sha256': hashlib.sha256(text.encode()).hexdigest(), 'snippets': count, 'groups': len(groups)})
        print(f'PASS Python and extraction: {path.stem}')
    dotnet = shutil.which('dotnet')
    cs_status = 'not-run'
    if dotnet and csharp_sources:
        with tempfile.TemporaryDirectory(prefix='field-guide-csharp-') as tmp:
            temp = Path(tmp)
            # Only the database-plan lesson requires an external test-only provider.
            # Keep the version identical to the installation command printed in that lesson.
            packages = ''
            if 'database-indexes-and-query-plans' in found:
                packages = '<ItemGroup><PackageReference Include="Microsoft.Data.Sqlite" Version="8.0.31" /></ItemGroup>'
            (temp / 'GuideExamples.csproj').write_text('<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net8.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings><Nullable>enable</Nullable></PropertyGroup>' + packages + '</Project>')
            helper = 'public static class Check { public static void That(bool value, string message = "Example assertion failed") { if (!value) throw new Exception(message); } }\n'
            (temp / 'Program.cs').write_text('using System;\nusing System.Collections.Generic;\nusing System.Linq;\nusing System.Threading.Tasks;\n' + '\n'.join(csharp_calls) + '\nConsole.WriteLine("PASS all C# example groups");\n' + helper + '\n'.join(csharp_sources))
            run = subprocess.run([dotnet, 'run', '--project', str(temp / 'GuideExamples.csproj'), '--configuration', 'Release'], text=True, capture_output=True, timeout=240)
            print(run.stdout)
            if run.returncode:
                raise AssertionError(run.stderr or run.stdout)
            cs_status = 'passed'
    elif args.require_dotnet:
        raise AssertionError('.NET SDK required but unavailable')
    out = ROOT / 'verification/field-guide-rewrite'
    out.mkdir(parents=True, exist_ok=True)
    report = {'articles': len(paths), 'approved_articles_preserved': 7, 'remaining': len(known - APPROVED - found), 'displayed_snippets': snippet_count, 'example_groups': group_count, 'python': 'passed', 'csharp': cs_status, 'scope_complete': found == known - APPROVED, 'files': results}
    (out / 'examples.json').write_text(json.dumps(report, indent=2))
    print(json.dumps({key: value for key, value in report.items() if key != 'files'}, indent=2))


if __name__ == '__main__':
    main()
