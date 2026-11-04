// Keep the build checklist beside its detailed instructions.
export async function tick(item: string) {
 const file = Bun.file('docs/plan.md'); let text = await file.text();
 const line = `- [x] ${item}`;
 if (text.includes(line)) return;
 if (!text.includes('## Build checklist')) text += '\n## Build checklist\n\n';
 await Bun.write('docs/plan.md', text + line + '\n');
}
if (import.meta.main && Bun.argv[2]) await tick(Bun.argv[2]);
