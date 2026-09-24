import * as OpenClosed from '../pages/guides/software-engineering/pilot/open-closed-principle.mdx';
import * as SwitchStatements from '../pages/guides/software-engineering/pilot/switch-statements.mdx';
import * as Deadlock from '../pages/guides/software-engineering/pilot/deadlock.mdx';
import * as SRP from '../pages/guides/software-engineering/review/solid-batch-1/single-responsibility-principle.mdx';
import * as LSP from '../pages/guides/software-engineering/review/solid-batch-1/liskov-substitution-principle.mdx';
import * as ISP from '../pages/guides/software-engineering/review/solid-batch-1/interface-segregation-principle.mdx';
import * as DIP from '../pages/guides/software-engineering/review/solid-batch-1/dependency-inversion-principle.mdx';

export const revisedArticles: Record<string, any> = {
  'open-closed-principle': OpenClosed,
  'switch-statements': SwitchStatements,
  'deadlocks-and-lock-discipline': Deadlock,
  'single-responsibility-principle': SRP,
  'liskov-substitution-principle': LSP,
  'interface-segregation-principle': ISP,
  'dependency-inversion-principle': DIP,
};
const additions = import.meta.glob('../content/field-guide/*.mdx', { eager: true });
for (const [path, article] of Object.entries(additions)) {
  const slug = path.split('/').pop()!.replace(/\.mdx$/, '');
  if (revisedArticles[slug]) throw new Error(`Duplicate field-guide replacement: ${slug}`);
  revisedArticles[slug] = article;
}
