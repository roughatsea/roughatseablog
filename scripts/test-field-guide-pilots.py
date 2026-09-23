#!/usr/bin/env python3
"""Test the code printed in the three MDX pilot articles, not shadow copies.

Python 3.10+; --require-dotnet additionally requires an installed .NET 8 SDK.
The intentionally deadlocking Python example runs only in a killed-on-timeout
child process. Finite lock-state exploration supplements, not replaces, tests.
"""
from __future__ import annotations

import argparse
import ast
import contextlib
from decimal import Decimal
import io
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
import threading

ROOT = Path(__file__).resolve().parents[1]
PAGES = ROOT / "src/pages/guides/software-engineering/pilot"


def snippets(slug: str, language: str) -> dict[str, str]:
    text = (PAGES / f"{slug}.mdx").read_text(encoding="utf-8")
    matches = re.findall(r"^```" + language + r" sample=([a-z-]+)\n(.*?)^```", text, re.M | re.S)
    result = dict(matches)
    assert len(result) == len(matches) and result, (slug, language, "missing/duplicate sample IDs")
    return result


def execute(code: str, scope: dict) -> str:
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        exec(compile(code, "<displayed pilot snippet>", "exec"), scope)
    return output.getvalue()


def replace_python_method(source: str, replacement: str) -> str:
    cls = next(node for node in ast.parse(source).body if isinstance(node, ast.ClassDef))
    method = next(node for node in cls.body if isinstance(node, ast.FunctionDef) and node.name == "move_blue_to_red")
    lines = source.splitlines()
    lines[method.lineno - 1:method.end_lineno] = textwrap.indent(replacement.rstrip(), "    ").splitlines()
    return "\n".join(lines) + "\n"


def replace_csharp_method(source: str, replacement: str) -> str:
    start = source.index("    public void MoveBlueToRed()")
    opening = source.index("{", start)
    depth = 1
    end = opening + 1
    while depth:
        depth += (source[end] == "{") - (source[end] == "}")
        end += 1
    return source[:start] + textwrap.indent(replacement.rstrip(), "    ") + source[end:]


def test_discounts() -> None:
    s = snippets("open-closed-principle", "python")
    scope: dict = {}
    execute(s["discounts"], scope)
    method = scope["Checkout"].calculate_total
    assert execute(s["existing-use"], scope).splitlines() == ["100", "90.00"]
    execute(s["extension"], scope)
    assert scope["Checkout"].calculate_total is method
    assert execute(s["extension-use"], scope).strip() == "80.00"
    for amount in map(Decimal, ["0", "1", "40", "100", "100.01", "250"]):
        for name, rate in [("NoDiscount", "1"), ("TenPercentDiscount", "0.90"), ("EmployeeDiscount", "0.80")]:
            assert scope["Checkout"]().calculate_total(amount, scope[name]()) == amount * Decimal(rate)
    print("PASS Python OCP: displayed calls, six amounts, unchanged checkout method")


def extended_selection(selection: str, addition: str, language: str) -> str:
    marker = '    raise ValueError("unknown membership")' if language == "python" else '            default:'
    assert selection.count(marker) == 1
    indent = "    " if language == "python" else "            "
    return selection.replace(marker, textwrap.indent(addition.rstrip(), indent) + "\n" + marker)


def test_memberships() -> None:
    s = snippets("switch-statements", "python")
    scope: dict = {}
    for name in ["before", "after", "selection", "caller"]:
        execute(s[name], scope)
    assert execute(s["use"], scope).strip() == "Shipping fee: 5; return window: 30 days."
    for name in ["regular", "premium"]:
        benefits = scope["select_benefits"](name)
        for amount in map(Decimal, ["0", "40", "49.99", "50", "50.01", "75", "100"]):
            expected_fee = Decimal("5") if name == "regular" and amount < 50 else Decimal("0")
            expected_days = 30 if name == "regular" else 60
            assert scope["shipping_fee"](name, amount) == benefits.shipping_fee(amount) == expected_fee
            assert scope["return_days"](name) == benefits.return_days() == expected_days
    for unknown in ["", "other", None]:
        for call in [lambda: scope["shipping_fee"](unknown, Decimal("40")), lambda: scope["return_days"](unknown), lambda: scope["select_benefits"](unknown)]:
            try:
                call()
            except ValueError:
                pass
            else:
                raise AssertionError("Unknown membership was not rejected")
    original_caller = scope["describe_benefits"]
    original_regular = scope["RegularBenefits"].shipping_fee
    execute(s["extension"], scope)
    execute(extended_selection(s["selection"], s["selection-addition"], "python"), scope)
    plus = scope["select_benefits"]("plus")
    assert scope["describe_benefits"](plus, Decimal("40")) == "Shipping fee: 0; return window: 45 days."
    assert scope["describe_benefits"] is original_caller
    assert scope["RegularBenefits"].shipping_fee is original_regular
    print("PASS Python memberships: original/refactored equivalence, threshold, rejection, Plus extension")


def explore_lock_orders(orders: tuple[tuple[str, ...], ...]) -> tuple[int, int]:
    """Explore all acquisition/release interleavings of exactly two lock users."""
    actions = tuple(tuple(("take", lock) for lock in order) + tuple(("release", lock) for lock in reversed(order)) for order in orders)
    todo = [((0, 0), (-1, -1))]
    seen = set()
    deadlocks = 0
    while todo:
        positions, owners = todo.pop()
        state = positions, owners
        if state in seen:
            continue
        seen.add(state)
        if positions == (4, 4):
            continue
        successors = []
        for worker in range(2):
            if positions[worker] == 4:
                continue
            op, lock = actions[worker][positions[worker]]
            index = ("red", "blue").index(lock)
            if op == "take" and owners[index] != -1:
                continue
            if op == "release":
                assert owners[index] == worker
            next_owners = list(owners)
            next_owners[index] = worker if op == "take" else -1
            next_positions = list(positions)
            next_positions[worker] += 1
            successors.append((tuple(next_positions), tuple(next_owners)))
        if not successors:
            deadlocks += 1
        todo.extend(successors)
    return len(seen), deadlocks


def test_locks() -> None:
    s = snippets("deadlock", "python")
    fixed = replace_python_method(s["before"], s["replacement"])
    scope: dict = {}
    execute(fixed, scope)
    assert execute(s["use"], scope).strip() == "Red: 100; blue: 100"
    for _ in range(20):
        piles = scope["TokenPiles"]()
        start = threading.Barrier(2)
        errors = []
        finished = []
        def run(operation):
            try:
                start.wait(timeout=2)
                for _ in range(50):
                    operation()
                finished.append(True)
            except BaseException as error:
                errors.append(error)
        workers = [threading.Thread(target=run, args=(op,), daemon=True) for op in (piles.move_red_to_blue, piles.move_blue_to_red)]
        for worker in workers:
            worker.start()
        for worker in workers:
            worker.join(timeout=3)
            assert not worker.is_alive(), "Corrected worker failed to finish"
        assert not errors and len(finished) == 2, errors
        assert (piles.red_tokens, piles.blue_tokens) == (100, 100)
    for original in [s["before"], fixed]:
        ns: dict = {}
        execute(original, ns)
        piles = ns["TokenPiles"]()
        for _ in range(101):
            piles.move_red_to_blue()
        assert (piles.red_tokens, piles.blue_tokens) == (0, 200)
    # Derive the finite model's lock order from the displayed code, in both languages.
    cs = snippets("deadlock", "csharp")
    for source, pattern, expected in [
        (s["before"], r"with self\._(red|blue)_lock", ["red", "blue", "blue", "red"]),
        (fixed, r"with self\._(red|blue)_lock", ["red", "blue", "red", "blue"]),
        (cs["before"], r"lock \((red|blue)Lock\)", ["red", "blue", "blue", "red"]),
        (replace_csharp_method(cs["before"], cs["replacement"]), r"lock \((red|blue)Lock\)", ["red", "blue", "red", "blue"]),
    ]:
        assert re.findall(pattern, source) == expected
    old_states, old_deadlocks = explore_lock_orders((("red", "blue"), ("blue", "red")))
    new_states, new_deadlocks = explore_lock_orders((("red", "blue"), ("red", "blue")))
    assert old_deadlocks == 1 and new_deadlocks == 0
    print(f"PASS lock model: {old_states} original states / {old_deadlocks} deadlock; {new_states} corrected states / {new_deadlocks} deadlocks")
    # Keep the displayed class, but replace its Lock constructor with an instrumented
    # wrapper. A barrier forces both original first acquisitions to happen before
    # either second acquisition. The parent kills this entire process on timeout.
    harness = r'''
from threading import Lock as RealLock, Thread, Barrier, local
state = local()
barrier = Barrier(2, action=lambda: print("BOTH_FIRST_LOCKS_HELD", flush=True))
class ObservedLock:
    def __init__(self):
        self.inner = RealLock()
    def __enter__(self):
        depth = getattr(state, "depth", 0)
        if depth == 1:
            print("REQUEST_SECOND_LOCK", flush=True)
        self.inner.acquire()
        state.depth = depth + 1
        if state.depth == 1:
            barrier.wait(timeout=2)
        return self
    def __exit__(self, *args):
        state.depth -= 1
        self.inner.release()
Lock = ObservedLock
piles = TokenPiles()
a = Thread(target=piles.move_red_to_blue)
b = Thread(target=piles.move_blue_to_red)
a.start()
b.start()
a.join()
b.join()
print("UNEXPECTED_COMPLETION", flush=True)
'''
    try:
        subprocess.run([sys.executable, "-u", "-c", s["before"] + harness], capture_output=True, timeout=4, check=True)
    except subprocess.TimeoutExpired as error:
        output = (error.stdout or b"").decode()
        assert "BOTH_FIRST_LOCKS_HELD" in output
        assert output.count("REQUEST_SECOND_LOCK") == 2
        assert "UNEXPECTED_COMPLETION" not in output
        assert not error.stderr
    else:
        raise AssertionError("Original opposite-order code did not deadlock under the forced schedule")
    print("PASS Python deadlock: forced original failure safely terminated; corrected calls and 20 paired runs finish")


def csharp_source() -> str:
    o = snippets("open-closed-principle", "csharp")
    m = snippets("switch-statements", "csharp")
    d = snippets("deadlock", "csharp")
    def namespace(name, code):
        return f"namespace {name}\n{{\n{code}\n}}\n"
    def usage(name, code):
        return f"public static class {name} {{ public static void Run() {{\n{code}\n}} }}\n"
    code = "using System;\nusing System.Threading;\nusing System.Globalization;\n"
    code += namespace("Ocp", o["discounts"] + o["extension"] + usage("ExistingUse", o["existing-use"]) + usage("ExtendedUse", o["extension-use"]))
    code += namespace("Legacy", m["before"])
    code += namespace("Refactored", m["after"] + m["selection"] + m["caller"] + usage("ExampleUse", m["use"]))
    code += namespace("Extended", m["after"] + m["extension"] + extended_selection(m["selection"], m["selection-addition"], "csharp") + m["caller"])
    code += namespace("OriginalLocks", d["before"])
    code += namespace("OrderedLocks", replace_csharp_method(d["before"], d["replacement"]) + usage("ExampleUse", d["use"]))
    code += r'''
public static class Program
{
    private static void Check(bool ok, string message)
    {
        if (!ok) throw new Exception(message);
    }
    public static void Main()
    {
        CultureInfo.CurrentCulture = CultureInfo.InvariantCulture;
        Ocp.ExistingUse.Run();
        Ocp.ExtendedUse.Run();
        Refactored.ExampleUse.Run();
        OrderedLocks.ExampleUse.Run();
        foreach (decimal amount in new decimal[] { 0m, 1m, 40m, 100m, 100.01m, 250m })
        {
            Ocp.Checkout checkout = new Ocp.Checkout();
            Check(checkout.CalculateTotal(amount, new Ocp.NoDiscount()) == amount, "full price");
            Check(checkout.CalculateTotal(amount, new Ocp.TenPercentDiscount()) == amount * 0.90m, "sale price");
            Check(checkout.CalculateTotal(amount, new Ocp.EmployeeDiscount()) == amount * 0.80m, "employee price");
        }
        foreach (string name in new string[] { "regular", "premium" })
        {
            Refactored.IMembershipBenefits benefits = Refactored.BenefitSelection.For(name);
            foreach (decimal amount in new decimal[] { 0m, 40m, 49.99m, 50m, 50.01m, 75m, 100m })
            {
                decimal expected = name == "regular" && amount < 50m ? 5m : 0m;
                Check(Legacy.MembershipRules.ShippingFee(name, amount) == expected, "original fee");
                Check(benefits.ShippingFee(amount) == expected, "refactored fee");
                Check(Legacy.MembershipRules.ReturnDays(name) == benefits.ReturnDays(), "return days");
                Check(benefits.ReturnDays() == (name == "regular" ? 30 : 60), "expected days");
            }
        }
        foreach (string unknown in new string[] { "", "other", null })
        {
            Action[] calls = {
                () => Legacy.MembershipRules.ShippingFee(unknown, 40m),
                () => Legacy.MembershipRules.ReturnDays(unknown),
                () => Refactored.BenefitSelection.For(unknown)
            };
            foreach (Action call in calls)
            {
                bool rejected = false;
                try { call(); } catch (ArgumentException) { rejected = true; }
                Check(rejected, "unknown membership not rejected");
            }
        }
        Extended.IMembershipBenefits plus = Extended.BenefitSelection.For("plus");
        Check(Extended.BenefitsSummary.Describe(plus, 40m) == "Shipping fee: 0; return window: 45 days.", "Plus use");
        OriginalLocks.TokenPiles original = new OriginalLocks.TokenPiles();
        original.MoveRedToBlue();
        original.MoveBlueToRed();
        Check(original.RedTokens == 100 && original.BlueTokens == 100, "original sequential moves");
        for (int run = 0; run < 20; run++)
        {
            OrderedLocks.TokenPiles piles = new OrderedLocks.TokenPiles();
            Thread a = new Thread(() => { for (int i = 0; i < 50; i++) piles.MoveRedToBlue(); });
            Thread b = new Thread(() => { for (int i = 0; i < 50; i++) piles.MoveBlueToRed(); });
            a.IsBackground = true;
            b.IsBackground = true;
            a.Start();
            b.Start();
            Check(a.Join(3000) && b.Join(3000), "corrected workers did not finish");
            Check(piles.RedTokens == 100 && piles.BlueTokens == 100, "tokens changed");
        }
        OrderedLocks.TokenPiles empty = new OrderedLocks.TokenPiles();
        for (int i = 0; i < 101; i++) empty.MoveRedToBlue();
        Check(empty.RedTokens == 0 && empty.BlueTokens == 200, "empty source");
        Console.WriteLine("PASS C# displayed snippets and behavioral checks");
    }
}
'''
    return code


def test_csharp(required: bool, export: Path | None) -> None:
    source = csharp_source()
    if export:
        export.mkdir(parents=True, exist_ok=True)
        (export / "Program.cs").write_text(source, encoding="utf-8")
    if not shutil.which("dotnet"):
        if required:
            raise RuntimeError(".NET SDK not found; C# execution is required")
        print("NOT RUN C#: .NET SDK unavailable (use --require-dotnet in CI)")
        return
    with tempfile.TemporaryDirectory(prefix="field-guide-csharp-") as directory:
        path = Path(directory)
        (path / "PilotExamples.csproj").write_text('<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net8.0</TargetFramework><ImplicitUsings>disable</ImplicitUsings><Nullable>disable</Nullable></PropertyGroup></Project>', encoding="utf-8")
        (path / "Program.cs").write_text(source, encoding="utf-8")
        result = subprocess.run(["dotnet", "run", "--project", str(path / "PilotExamples.csproj"), "--configuration", "Release"], text=True, capture_output=True, timeout=120)
        if result.returncode:
            raise AssertionError(result.stdout + result.stderr)
        assert "PASS C# displayed snippets and behavioral checks" in result.stdout
        print(result.stdout.strip())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--require-dotnet", action="store_true")
    parser.add_argument("--export-csharp", type=Path)
    args = parser.parse_args()
    for slug in ["open-closed-principle", "switch-statements", "deadlock"]:
        assert snippets(slug, "python").keys() == snippets(slug, "csharp").keys(), slug
    test_discounts()
    test_memberships()
    test_locks()
    test_csharp(args.require_dotnet, args.export_csharp)


if __name__ == "__main__":
    main()
