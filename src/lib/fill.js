// "{title} on GitHub" + { title: 'Osdag' } -> "Osdag on GitHub": copy in
// src/content/*.json that has a value to drop in
export default function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match))
}
