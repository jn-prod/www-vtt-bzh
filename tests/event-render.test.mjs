import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { parseFragment } from 'parse5';

const nodes = (root) => {
  const result = [];
  const visit = (node) => {
    result.push(node);
    (node.childNodes ?? []).forEach(visit);
  };
  visit(root);
  return result;
};

test('le rendu Liquid neutralise tous les champs événement', () => {
  const marker = '<img src=x onerror=alert(1)>';
  const event = {
    id: `event-test\" autofocus onfocus=\"alert(1)`,
    date: `2026-09-20\" onmouseover=\"alert(1)`,
    dateFormatted: marker,
    name: marker,
    city: marker,
    departement: `56\" onfocus=\"alert(1)`,
    hour: marker,
    place: marker,
    organisateur: marker,
    price: marker,
    email: `contact@example.org\" onfocus=\"alert(1)`,
    phone: `0612345678\" onfocus=\"alert(1)`,
    description: `<script>alert('description')</script>`,
    website: `https://example.org/?q=\" onmouseover=\"alert(1)`,
    canceled: false,
  };
  const ruby = [
    "template = Liquid::Template.parse(File.read('_includes/calendar/event.html'))",
    "print template.render!({'include' => {'event' => JSON.parse(STDIN.read)}})",
  ].join('; ');
  const html = execFileSync('bundle', ['exec', 'ruby', '-rjson', '-rjekyll', '-e', ruby], {
    cwd: 'www',
    input: JSON.stringify(event),
    encoding: 'utf8',
  });
  const renderedNodes = nodes(parseFragment(html));

  assert.equal(
    renderedNodes.some((node) => ['script', 'img'].includes(node.nodeName)),
    false
  );
  for (const node of renderedNodes) {
    for (const attribute of node.attrs ?? []) {
      assert.doesNotMatch(attribute.name, /^on/iu);
    }
  }
  assert.match(renderedNodes.map((node) => node.value ?? '').join(' '), /<img src=x onerror=alert\(1\)>/u);
});
