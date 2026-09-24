#!/usr/bin/env python3
"""Check that the publication gate rejects representative regressions."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('publication_gate', Path(__file__).with_name('test-field-guide-complete.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)

SOURCE = {'title': 'A Test Lesson', 'description': 'A specific lesson.',
          'snippets': [('csharp', 'Console.WriteLine(7);'), ('python', 'print(7)')]}
HTML = '''<!doctype html><html><head><title>A Test Lesson — Software Engineering Field Guide</title>
<meta name="description" content="A specific lesson.">
<link rel="canonical" href="https://www.roughatsea.com/guides/software-engineering/test-lesson/">
</head><body><article data-field-guide-pilot data-publication="published"><h1>A Test Lesson</h1>
<div class="pilot-body"><p>''' + ('This is a concrete example with an introduced subject and action. ' * 9) + '''</p>
<section data-pilot-language="csharp"><pre data-language="csharp"><code>Console.WriteLine(7);</code></pre></section>
<section data-pilot-language="python"><pre data-language="python"><code>print(7)</code></pre></section>
<a href="#source-1">Source</a><span id="source-1"></span><a href="https://docs.python.org/3/">Documentation</a>
</div></article></body></html>'''

class PublicationGateTests(unittest.TestCase):
    def check(self, html):
        return gate.check_article(html, 'test-lesson', SOURCE)

    def test_valid_fixture_passes(self):
        self.assertEqual(self.check(HTML)['snippets_equal_to_source'], 2)

    def test_legacy_renderer_fails(self):
        with self.assertRaisesRegex(AssertionError, 'published replacement'):
            self.check(HTML.replace('data-publication="published"', 'data-publication="legacy"'))

    def test_changed_displayed_code_fails(self):
        with self.assertRaisesRegex(AssertionError, 'displayed code differs'):
            self.check(HTML.replace('print(7)', 'print(8)'))

    def test_duplicate_heading_fails(self):
        with self.assertRaisesRegex(AssertionError, 'one article heading'):
            self.check(HTML.replace('</h1>', '</h1><h1>Duplicate</h1>'))

    def test_review_metadata_fails(self):
        with self.assertRaisesRegex(AssertionError, 'noindex'):
            self.check(HTML.replace('</head>', '<meta name="robots" content="noindex"></head>'))

    def test_broken_reference_fails(self):
        with self.assertRaisesRegex(AssertionError, 'broken source'):
            self.check(HTML.replace('href="#source-1"', 'href="#never-introduced"'))

    def test_code_outside_language_path_fails(self):
        with self.assertRaisesRegex(AssertionError, 'language-specific'):
            self.check(HTML.replace('<section data-pilot-language="python"><pre',
                                   '<section data-pilot-language="python"></section><section><pre'))

    def test_wrong_canonical_fails(self):
        with self.assertRaisesRegex(AssertionError, 'canonical URL'):
            self.check(HTML.replace('/test-lesson/', '/pilot/test-lesson/'))

if __name__ == '__main__':
    unittest.main()
