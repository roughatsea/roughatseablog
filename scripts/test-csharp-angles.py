#!/usr/bin/env python3
"""Compile and run the complete programs extracted from Every Angle in C#.

Requires Python 3.10+ and the .NET 10 SDK. No third-party Python/NuGet packages.
The article is the only source of teaching code and expected output.
This does not claim to verify the article's unmarked illustrative fragments.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

FENCE = re.compile(r"^```(csharp sample|text output)=([a-z0-9-]+)\s*\n(.*?)^```\s*$", re.MULTILINE | re.DOTALL)
PROJECT = """<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <LangVersion>14.0</LangVersion>
    <ImplicitUsings>disable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <AllowUnsafeBlocks>true</AllowUnsafeBlocks>
    <AssemblyName>ArticleSample</AssemblyName>
  </PropertyGroup>
</Project>
"""


def extract(article: Path) -> tuple[dict[str, str], dict[str, str]]:
    source = article.read_text(encoding="utf-8")
    programs: dict[str, str] = {}
    outputs: dict[str, str] = {}
    for kind, name, text in FENCE.findall(source):
        target = programs if kind == "csharp sample" else outputs
        if name in target:
            raise ValueError(f"Duplicate {kind}: {name}")
        target[name] = text
    if not programs or programs.keys() != outputs.keys():
        raise ValueError(f"Program/output mismatch: {sorted(programs)} / {sorted(outputs)}")
    return programs, outputs


def run(command: list[str], cwd: Path, env: dict[str, str], timeout: int) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(command, cwd=cwd, env=env, capture_output=True, text=True, timeout=timeout)
    if result.returncode:
        raise RuntimeError(f"Command failed: {' '.join(command)}\n{result.stdout}\n{result.stderr}")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--article", type=Path)
    parser.add_argument("--list", action="store_true", help="Validate extraction only; do not compile or report execution as verified")
    args = parser.parse_args()
    default = Path(__file__).resolve().parents[1] / "src/content/notes/every-angle-in-csharp.md"
    article = args.article or default
    programs, outputs = extract(article)
    if args.list:
        print(f"Extraction only: {len(programs)} complete programs with expected outputs")
        print("\n".join(programs))
        return 0
    dotnet = shutil.which("dotnet")
    if dotnet is None:
        raise RuntimeError("The .NET 10 SDK is required. No C# compilation or execution was performed.")
    env = dict(os.environ, DOTNET_NOLOGO="1", DOTNET_CLI_TELEMETRY_OPTOUT="1", DOTNET_SKIP_FIRST_TIME_EXPERIENCE="1")
    sdks = run([dotnet, "--list-sdks"], article.parent, env, 30).stdout
    if not any(line.startswith("10.") for line in sdks.splitlines()):
        raise RuntimeError("No .NET 10 SDK is installed. Install it rather than silently changing the language/runtime boundary.")
    with tempfile.TemporaryDirectory(prefix="csharp-angles-") as temporary:
        root = Path(temporary)
        (root / "global.json").write_text('{"sdk":{"version":"10.0.100","rollForward":"latestFeature","allowPrerelease":false}}', encoding="utf-8")
        for name, source in programs.items():
            folder = root / name
            folder.mkdir()
            (folder / "Sample.csproj").write_text(PROJECT, encoding="utf-8")
            (folder / "Program.cs").write_text(source, encoding="utf-8")
            run([dotnet, "build", "Sample.csproj", "--configuration", "Release", "--nologo", "--verbosity", "quiet"], folder, env, 180)
            result = run([dotnet, str(folder / "bin/Release/net10.0/ArticleSample.dll")], folder, env, 30)
            actual = result.stdout.replace("\r\n", "\n").rstrip("\n")
            expected = outputs[name].replace("\r\n", "\n").rstrip("\n")
            if actual != expected:
                raise AssertionError(f"Output mismatch in {name}\nExpected: {expected!r}\nActual: {actual!r}")
            print(f"PASS {name}", flush=True)
    print(f"Verified {len(programs)} displayed complete programs and their exact stated outputs.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, RuntimeError, AssertionError, subprocess.TimeoutExpired) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
