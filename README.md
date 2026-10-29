# frame-forge

**Agent-native design & motion skill library with a deterministic HTML→MP4 render pipeline.**

Give an agent a HTML file. Get a video. No timeline editor, no proprietary project
format, no cloud account.

```bash
npm i -D hyperframes          # render engine (Apache-2.0, public npm)
node tools/scaffold.mjs my-clip
node tools/render.mjs my-clip --out my-clip.mp4
```

---

## 这是什么 / What this is

一个**以技能包（skills）为主体**的开源项目：把"怎么做出好东西"写成 agent 可执行的规范，
再把"怎么把 HTML 变成 mp4"做成一条可验证的管线。

- **Skills**：每个技能是一个 `SKILL.md`（YAML frontmatter + 方法论 + 可执行步骤），
  可被任意支持 agent skills 的工具加载（DSH / Claude Code / Codex / Cursor …）。
- **Pipeline**：`tools/render.mjs` 把一张 HTML 组合（composition）确定性地渲成 mp4，
  逐帧 seek、可复现、失败可诊断。
- **Provenance-first**：仓库里每一份第三方内容都有 `LICENSE` + `SOURCE.md` + `NOTICE.md` 记录，
  不可再分发的内容一律用 `upstream-pointer` 指向上游而不是复制。

An agent-native skill library plus a deterministic HTML→MP4 renderer. Skills are
plain markdown an agent can follow; the renderer turns a single HTML composition
into a reproducible video. Every third-party file is attributed; nothing is
silently relicensed.

## 为什么这么做 / Why

主流做视频的方式都有个问题：**产物是二进制工程文件，或者需要跑一整套 React 打包**。
两种都让 agent 很难稳定产出——模型擅长写 HTML/CSS，不擅长维护 `.prproj` 或
`useCurrentFrame` 的运行时约束。

frame-forge 的答案是把"时间"写回 DOM：

```html
<div data-composition-id="main" data-duration="3" data-width="1920" data-height="1080">
  <h1 class="clip" data-start="0" data-duration="3" data-track-index="1">Hello</h1>
</div>
<script>
  window.__timelines = window.__timelines || {};
  const tl = gsap.timeline({ paused: true });   // must be paused
  tl.from("h1", { opacity: 0, y: 40, duration: 0.8 });
  window.__timelines["main"] = tl;
</script>
```

渲染器把时钟推到任意一帧、截图、编码。于是"视频"变成纯函数：
**同样的 HTML + 同样的 fps = 同样的字节**。

## 快速开始 / Quickstart

```bash
git clone https://github.com/<you>/frame-forge && cd frame-forge
npm i -D hyperframes gsap

node tools/doctor.mjs                       # 检查 node / chrome / ffmpeg / engine
node tools/scaffold.mjs demo                # 生成 templates/composition 的副本
node tools/render.mjs demo --out demo.mp4   # 渲染
node tools/verify-skills.mjs                # 校验技能元数据与归属声明
```

渲染依赖三样东西，缺哪个 `doctor` 会明确告诉你：

| 依赖 | 作用 | 备注 |
|---|---|---|
| Node ≥ 22 | 运行时 | 引擎硬要求 |
| Chrome / chromium | 取帧 | 任意 Chromium 系内核；`--browser` 可指定 |
| FFmpeg | 编码 | 需要 `libx264`；`--ffmpeg` 或 `HYPERFRAMES_FFMPEG_PATH` |

## 目录结构 / Layout

```
skills/            原创技能（provenance: original，本仓库 MIT）
  render-pipeline/    HTML→MP4 的完整契约与排错
  motion-language/    时长、缓动、节拍、节奏的方法论
  design-critique/    交付前的视觉质检门槛（可量化）
  shot-recipes/       12 个镜头配方（hook / 数据 / 转场 / 收尾）
  storyboard/         brief → 分镜 → 可渲染 HTML
  asset-pipeline/     音频、配音、BGM、ffmpeg 后处理
third-party/       可再分发的第三方技能（各自 LICENSE 原样保留）
tools/             scaffold / render / doctor / verify / install / fetch
templates/         组合模板（可直接复制）
registry/          skills.json —— 机器可读的目录与归属台账
prompts/           原创提示词包（分镜、镜头、风格）
docs/              authoring contract、架构、归属政策
```

## 命令 / CLI

| 命令 | 作用 |
|---|---|
| `node tools/doctor.mjs` | 检查引擎 / 浏览器 / ffmpeg / 技能完整性 |
| `node tools/scaffold.mjs <name>` | 从模板建一个新组合 |
| `node tools/render.mjs <dir> --out f.mp4` | 渲染，流式进度，结束输出 JSON |
| `node tools/verify-skills.mjs` | 校验所有 `SKILL.md`：frontmatter、归属、license 配对 |
| `node tools/install-skills.mjs --target dsh` | 把技能装进 agent 的技能目录 |
| `node tools/fetch-upstream.mjs --list` | 列出 `upstream-pointer` 条目并按需拉取上游 |

`render.mjs` 的引擎解析顺序：`--engine` 参数 → `FRAMEFORGE_ENGINE` 环境变量 →
`node_modules/hyperframes` → 失败并给出安装提示。它不 vendored 引擎代码。

## 归属政策 / Provenance policy

三条规则，`verify-skills.mjs` 会在 CI 里强制：

1. **original** — 本仓库原创，MIT。
2. **redistributed** — 第三方但许可允许再分发（MIT/Apache-2.0）。必须同时具备
   `third-party/<slug>/LICENSE`（原文未改）、`SOURCE.md`（来源 URL + 改动说明）、
   以及 `NOTICE.md` 中的一行记录。
3. **upstream-pointer** — 不可再分发或未标注许可。仓库里**只有**名字、描述和 URL，
   内容由 `fetch-upstream.mjs` 在用户机器上获取，遵循上游条款。

想加新技能：跑 `node tools/verify-skills.mjs --new <slug>` 会打印该填哪些字段。

## 状态 / Status

- 渲染管线：可用（已用 1920×1080 / 30fps / 3s 组合实测，90 帧，11s 出片）
- 原创技能：6 个
- 第三方技能：11 个，全部 MIT/Apache-2.0 且带版权行
- 提示词包：6 组

## License

代码与原创技能：MIT（见 [LICENSE](LICENSE)）。
第三方内容：各自许可，见 [NOTICE.md](NOTICE.md)。本项目不对其重新授权。
