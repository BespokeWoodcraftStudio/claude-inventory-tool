import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, Upload } from "@/components/ui/icons";
import { JsonLd } from "@/components/JsonLd";
import { articleGraph } from "@/lib/seo";

const PATH = "/guide/claude-code-skills-plugins-mcp-agents";
const HEADLINE =
  "Claude Code skills vs plugins vs MCP servers vs agents";
const DESCRIPTION =
  "Claude Code skills vs plugins vs MCP servers vs agents, explained: what each is, how they differ, and why plugins quietly create duplicate capabilities.";

export const metadata: Metadata = {
  title: "Claude Code Skills vs Plugins vs MCP Servers vs Agents",
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    title: "Claude Code skills vs plugins vs MCP servers vs agents",
    description:
      "The four building blocks of a Claude Code setup, explained: what a skill, a plugin, an MCP server, and an agent each are, how they differ, and where duplicates come from.",
    url: PATH,
    type: "article",
  },
};

export default function ClaudeCodeComponentsExplained() {
  return (
    <div className="container-narrow guide" style={{ paddingTop: 56, paddingBottom: 56 }}>
      <JsonLd
        data={articleGraph({
          headline: HEADLINE,
          description: DESCRIPTION,
          path: PATH,
          breadcrumbName: "Skills, plugins, MCP servers & agents",
        })}
      />

      <nav className="guide-crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Skills, plugins, MCP servers &amp; agents</span>
      </nav>

      <header className="stack gap-4" style={{ marginBottom: 8 }}>
        <h1 className="section-title">
          Claude Code skills vs plugins vs MCP servers vs agents
        </h1>
        <p className="lead">
          Skills, plugins, MCP servers, and agents are the four building blocks of a Claude Code
          setup. They are easy to conflate because they overlap in what they do and sit in similar
          places, yet each one is a distinct thing with its own purpose. This explainer defines each
          one in plain language, shows how they differ, and explains why the practical payoff of
          understanding them is simply knowing what you actually have installed.
        </p>
      </header>

      <article className="guide-body">
        <h2>What is a Claude Code skill?</h2>
        <p>
          A skill is a packaged capability: a folder of instructions, and often supporting files,
          that Claude can invoke when a task matches it. Each skill carries a short description that
          tells the model when it is the right tool for the job, so the model can reach for it
          without you wiring anything up by hand. In practice a skill is the smallest, most
          self-contained unit of the four.
        </p>
        <p>
          Skills live in one of two places. A <strong>global</strong> skill sits under{" "}
          <code className="inline">~/.claude/skills</code> and is available in every project on your
          machine. A <strong>project</strong> skill sits in that repository&apos;s{" "}
          <code className="inline">.claude/skills</code> folder and applies only inside that project.
          Each skill folder holds a <code className="inline">SKILL.md</code> with the description and
          the instructions Claude follows when it picks the skill up.
        </p>

        <h2>What is a Claude Code plugin?</h2>
        <p>
          A plugin is a bundle. Where a skill is a single capability, a plugin can ship a whole set
          of things at once: its own skills, its own agents, and its own MCP servers, packaged
          together so you can install them in one step. That packaging is convenient, and it is also
          the source of the most common surprise in a Claude Code setup.
        </p>
        <p>
          Here is the key insight. Because a plugin bundles skills, agents, and MCP servers,
          installing a single plugin can quietly give you copies of capabilities that overlap with
          standalone items you already had. You install one plugin and gain half a dozen things you
          never picked individually, and if one of those bundled skills matches a standalone skill
          you added earlier, you now hold two copies of the same capability without ever deciding to.
          That is exactly where{" "}
          <Link href="/inventory">duplicate detection</Link> earns its keep.
        </p>

        <h2>What is an MCP server in Claude Code?</h2>
        <p>
          MCP stands for Model Context Protocol. An MCP server is a separate process that exposes
          tools and data to Claude over that protocol. Each server advertises its tool schemas, the
          names and shapes of the things it can do, so the model knows what it is allowed to call and
          how. A server might give Claude access to a database, an API, your file system, or any
          other external system its author chose to wrap.
        </p>
        <p>
          Like skills, MCP servers can be configured at two levels: globally, so they are available
          everywhere, or per project, so they apply only inside a given repository. The thing to
          remember is that every connected server contributes its advertised tool schemas to what the
          model has to consider, whether or not you ever call those tools.
        </p>

        <h2>What is a Claude Code agent (subagent)?</h2>
        <p>
          An agent, sometimes called a subagent, is a scoped helper with its own instructions and its
          own set of tools that Claude can delegate a task to. Instead of doing everything in one
          thread, the model can hand a focused job to an agent that has been set up for exactly that
          kind of work, then use the result. An agent is defined by its own file describing its
          purpose, its instructions, and what it is allowed to use.
        </p>
        <p>
          Agents follow the same scope rules as the rest of your setup. A global agent lives under{" "}
          <code className="inline">~/.claude/agents</code> and is available everywhere; a project
          agent lives in that repository&apos;s <code className="inline">.claude</code> folder and
          applies only there. As with skills, the same agent can end up defined in more than one
          place once plugins enter the picture.
        </p>

        <h2>How do they fit together, and where do duplicates come from?</h2>
        <p>
          The cleanest way to hold all four in your head is along two axes: what the thing is, and
          where it lives. Skills, MCP servers, and agents are each a distinct kind of capability. A
          plugin is the odd one out, because it is not a single capability at all, it is a container
          that can ship the other three. And every one of these can exist at <strong>global</strong>{" "}
          scope, under <code className="inline">~/.claude</code>, where it applies everywhere, or at{" "}
          <strong>project</strong> scope, under a repository&apos;s{" "}
          <code className="inline">.claude</code> folder, where it applies only there.
        </p>
        <p>
          Duplicates fall straight out of those two facts. Because plugins bundle skills, agents, and
          MCP servers, a plugin can hand you a copy of something you already installed on its own, and
          because the same capability can live in both global and project scope, you can hold two
          copies in two different folders that never sit next to each other. That is precisely how a
          setup ends up with duplicates you never installed directly, and why they are so hard to spot
          by reading folders one at a time.
        </p>

        <h2>How do I see everything I have installed?</h2>
        <p>
          The fastest way to get an honest picture is to scan your setup instead of reading folders by
          hand. Run <code className="inline">npx stack-cleaner@latest</code> (or the{" "}
          <code className="inline">curl</code> one-liner from the{" "}
          <Link href="/setup">setup guide</Link>). The scan reads your local Claude Code setup, strips
          secrets, and writes a small <code className="inline">stack-cleaner.json</code> file. It only
          reads; it changes nothing on your machine.
        </p>
        <p>
          Then drop that file into <Link href="/inventory">the inventory tool</Link>. The parsing
          happens entirely in your browser, the file is held in{" "}
          <code className="inline">localStorage</code> only, nothing is uploaded, and there is no
          backend. You get every skill, plugin, MCP server, and agent laid out and split by global
          versus project scope, with real usage counts pulled from your local transcripts so you can
          see what you lean on versus what you installed and forgot, and with duplicate detection that
          flags the overlaps plugins introduced.
        </p>

        <h2>Where to go next</h2>
        <p>
          Now that the four pieces are clear, the natural next step is to act on them. Start with the{" "}
          <Link href="/setup">setup guide</Link> to run the scan, open{" "}
          <Link href="/inventory">the inventory tool</Link> to see everything you have, and follow{" "}
          <Link href="/guide/clean-up-claude-code">
            how to clean up your Claude Code setup
          </Link>{" "}
          for a step-by-step pass through the duplicates and the things you never use.
        </p>

        <div className="guide-cta">
          <Link href="/guide/clean-up-claude-code" className="btn btn-secondary btn-sm">
            Cleanup guide <Arrow size={14} />
          </Link>
          <Link href="/inventory" className="btn btn-primary btn-sm">
            <Upload size={14} /> Open the inventory
          </Link>
        </div>
      </article>

      {/* page-scoped styles: design-system variables only */}
      <style>{`
        .guide { max-width: 760px; }
        .guide-crumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--dim);
          margin-bottom: 22px;
        }
        .guide-crumbs a { color: var(--accent-soft); text-decoration: none; }
        .guide-crumbs a:hover { text-decoration: underline; }
        .guide-crumbs span[aria-hidden] { color: var(--faint); }
        .guide-body {
          margin-top: 36px;
          color: var(--fg-soft);
          font-size: 16px;
          line-height: 1.72;
        }
        .guide-body h2 {
          font-size: 22px;
          font-weight: 660;
          letter-spacing: -0.02em;
          color: var(--fg);
          margin-top: 40px;
          margin-bottom: 14px;
          padding-top: 16px;
          border-top: 1px solid var(--line);
        }
        .guide-body h2:first-child { margin-top: 0; padding-top: 0; border-top: 0; }
        .guide-body p { margin-bottom: 18px; }
        .guide-body p strong { color: var(--fg); font-weight: 620; }
        .guide-body a {
          color: var(--accent-soft);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .guide-body a:hover { color: var(--accent); }
        .guide-body ul {
          margin: 0 0 18px;
          padding-left: 22px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .guide-body li { line-height: 1.65; }
        .guide-body li strong { color: var(--fg); font-weight: 620; }
        .guide-body code.inline { font-size: 0.88em; }
        .guide-cta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 36px;
          padding-top: 24px;
          border-top: 1px solid var(--line);
        }
        @media (max-width: 480px) {
          .guide-body { font-size: 15.5px; }
          .guide-body h2 { font-size: 20px; }
        }
      `}</style>
    </div>
  );
}
