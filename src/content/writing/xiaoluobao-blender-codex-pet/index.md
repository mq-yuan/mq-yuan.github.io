---
title: "A Codex desktop pet rendered from a PMX model in Blender"
date: 2026-09-11
description: "Rendering the Xiaoluobao MMD model with Blender and MMD Tools into a Codex Desktop v2 pet spritesheet: the pipeline, the animation contract, and what is and is not distributed."
tags: ["blender", "codex", "mmd", "tooling"]
---

> 中文标题：Blender 小洛包 Codex Desktop Pet 制作与使用。本文为中英双语，中文为原文，英文版本由 AI 翻译，见分隔线之后。
> An English version, translated from the Chinese original with AI
> assistance, follows after the divider.

`xiaoluobao-blender` 是通过 Blender 和 MMD Tools 直接渲染 PMX 模型得到的 Codex Desktop v2 Pet。`render_pmx_pet.py` 导入模型并控制骨骼、IK、Morph、相机与灯光，逐帧输出透明 PNG；`assemble_pmx_pet.py` 将帧组装为 spritesheet，并生成 `pet.json` 与验证报告。整个流程不依赖图像生成模型，可重复渲染，并保持角色造型与材质在各帧间一致。

## 分发边界

对外只提供 `render_pmx_pet.py` 和 `assemble_pmx_pet.py` 两个脚本。不提供或转发 PMX、贴图、模型压缩包、逐帧渲染结果、spritesheet、`pet.json` 或已组装的 Pet 包。读者需要从[原始模型配布页](https://www.bilibili.com/video/BV1E3411b77g/)自行取得模型，并独立阅读和遵守模型规约。

渲染代码本身不包含模型授权，也不授予洛天依角色、模型、绑定或材质的使用权。原模型规约禁止二次配布和商业利用；读者使用代码生成的图像或 Pet 时，仍需遵守角色权利人与模型作者的要求。

## 代码与输出

两个脚本可以在这里下载：

- [`render_pmx_pet.py`](/files/xiaoluobao-blender-codex-pet/render_pmx_pet.py)：导入 PMX、建立渲染场景、定义各动画状态与视线方向，并把透明 RGBA 帧输出到 `<输出目录>/frames/`，按图集行列组织。
- [`assemble_pmx_pet.py`](/files/xiaoluobao-blender-codex-pet/assemble_pmx_pet.py)：将渲染帧组装为 v2 图集，并在同一输出目录生成 `spritesheet.png`、`spritesheet.webp`、`pet.json` 和 `validation.json`。

公开的副本里没有任何本机路径：模型文件和输出目录都通过命令行参数传入，模型文件不随代码提供。

## 渲染实现

渲染器使用 Eevee、透明背景、`192 × 208` 输出画布和正交相机。灯光由暖色主光、冷色补光与轮廓光组成，并随相机方向重新定位，以保持各视角光照一致。

程序化动作直接驱动 PMX rig：左右移动使用脚部 IK 形成明确步态；跳跃移动整个 armature 以产生真实离地位移；眨眼和表情使用 Morph；招手将右手抬到太阳穴附近，避免手臂被头部与头发遮挡。16 个 look direction 由同一 rig 连续控制，以保持方向变化时的体型、服装和面部一致。

## v2 动画契约

最终图集为 8 列 × 11 行，每格 `192 × 208`，总尺寸 `1536 × 2288`，带透明通道：

| 行   | 状态            | 帧数 | 动作含义                                     |
| ---- | --------------- | ---: | -------------------------------------------- |
| 0    | `idle`          |    6 | 朝屏幕左侧的 3/4 站姿、呼吸、眨眼和歪头      |
| 1    | `running-right` |    8 | 向右拖动时的完整步态                         |
| 2    | `running-left`  |    8 | 向左拖动时的完整步态                         |
| 3    | `waving`        |    4 | 右手抬到太阳穴附近的大方招手                 |
| 4    | `jumping`       |    5 | 预备、起跳、最高点收腿、下降、落地           |
| 5    | `failed`        |    8 | 下沉、低头和深鞠躬式失败反应                 |
| 6    | `waiting`       |    6 | 等待用户输入或确认                           |
| 7    | `running`       |    6 | 任务执行中的专注工作状态，不是字面意义的跑步 |
| 8    | `review`        |    6 | 完成后检查结果                               |
| 9–10 | look directions |   16 | 从 `000` 开始、每 22.5° 一格的顺时针视线方向 |

`000` 表示向上看，不是默认正面。指针位于 deadzone 时回退到普通 `idle`。图集共使用 73 帧；每个标准动画行在最后一个有效帧之后的槽位必须完全透明，第 9–10 行的 16 个方向槽位全部使用。

`pet.json` 必须设置 `spriteVersionNumber: 2`，并通过 `spritesheetPath` 指向同目录中的 PNG 或 WebP 图集；否则桌面端会按旧版 9 行格式读取。

## 从 PMX 生成 Pet

1. 从原始配布页自行取得模型与贴图，并确认其规约允许自己的使用方式。
2. 安装 Blender 与 MMD Tools。该管线最初使用 Blender 4.5 LTS；使用其他版本时需要确认 MMD Tools、Eevee 和 PMX 导入的兼容性。
3. 下载 `render_pmx_pet.py` 与 `assemble_pmx_pet.py`，准备好模型文件和一个空的输出目录。
4. 在 macOS 上通过 Blender GUI 进程执行完整渲染；我的机器在 background 模式下初始化 Metal 不稳定。

```bash
open -a Blender -n --args \
  --python /path/to/render_pmx_pet.py \
  -- --mode full --render-scale 1 \
     --model /path/to/model.pmx --output-dir /path/to/output
```

5. 渲染完成后，用 Pillow 组装图集：

```bash
UV_CACHE_DIR=/private/tmp/codex-uv-cache \
uv run --with pillow python /path/to/assemble_pmx_pet.py --output-dir /path/to/output
```

6. 检查 `validation.json`，并人工检查尺寸、透明通道、73 个必需帧、未使用槽位、动作连续性、朝向和光照一致性。

如果要修改动作，主要编辑 `render_pmx_pet.py` 中各状态对应的 Pose 序列；若已有合适的 Blender Action 或获得合法使用权的 VMD，也可以替换程序化姿势，但图集行序、帧数和单格尺寸仍需遵守目标版本的 Pet 规范。

## 本地安装

读者完成自己的合法渲染后，将生成的 `pet.json` 和 spritesheet 放入同一 Pet 目录：

```bash
source_dir=/path/to/generated/xiaoluobao-blender
target_dir=~/.config/codex/pets/xiaoluobao-blender
mkdir -p "$target_dir"
cp "$source_dir/pet.json" "$target_dir/pet.json"
cp "$source_dir/spritesheet.png" "$target_dir/spritesheet.png"
```

在 ChatGPT Desktop 的 `Settings > Pets` 点击 `Refresh`，选择 `Xiaoluobao Blender`。通过 `/pet` 或命令菜单中的 `Wake Pet` 唤醒；再次执行可隐藏。自定义 Pet 保存在本机，不会自动同步到 ChatGPT Web。

我使用的图集已按 `1536 × 2288`、11 行、73 个必需帧和未使用槽位透明的契约验证通过。

## Credits 与授权摘要

- 角色版权：上海天矢禾念娱乐有限公司。
- 模型：Kinsama。
- 绑定：Lct火红枣。
- 联络与材质工作：LCPD拉灯。
- 原模型禁止二次配布和商业利用，并包含其他用途限制；以读者从原配布页取得的完整规约为准。
- 使用其他 MMD 动作或模型内容时，还必须同时遵守对应资源的规约。

参考文献见下文英文部分。

---

## English version

`xiaoluobao-blender` is a Codex Desktop v2 pet produced by rendering a PMX
model directly in Blender through MMD Tools. One script, `render_pmx_pet.py`,
imports the model, drives bones, IK, morphs, camera, and lights, and writes
transparent PNG frames; a second, `assemble_pmx_pet.py`, packs the frames into
a spritesheet and generates `pet.json` plus a validation report. No
image-generation model is involved, so the pipeline is repeatable and the
character's shape and materials stay consistent across frames.

## What is distributed, and what is not

Only the two scripts are shared. I do not distribute or forward the PMX file,
textures, model archives, rendered frames, spritesheets, `pet.json`, or an
assembled pet package. Readers obtain the model from the
[original distribution post](https://www.bilibili.com/video/BV1E3411b77g/)
and read and follow the model's terms themselves.

The rendering code carries no model license and grants no rights to the Luo
Tianyi character, the model, its rig, or its materials. The original terms
forbid redistribution and commercial use; images or pets generated with the
code remain subject to the character rights holder's and the model author's
requirements.

## Code and outputs

The two scripts can be downloaded here:

- [`render_pmx_pet.py`](/files/xiaoluobao-blender-codex-pet/render_pmx_pet.py):
  imports the PMX, builds the render scene, defines each animation state and
  look direction, and writes transparent RGBA frames to `<output>/frames/`,
  organized by atlas row and column.
- [`assemble_pmx_pet.py`](/files/xiaoluobao-blender-codex-pet/assemble_pmx_pet.py):
  packs the frames into the v2 atlas and writes `spritesheet.png`,
  `spritesheet.webp`, `pet.json`, and `validation.json` into the same output
  directory.

The published copies contain no paths from my machine: the model file and the
output directory are command-line arguments, and no model file ships with the
code.

## Rendering

The renderer uses Eevee, a transparent background, a `192 × 208` canvas, and
an orthographic camera. Lighting is a warm key, a cool fill, and a rim light,
repositioned with the camera direction so every view is lit consistently.

Procedural motion drives the PMX rig directly: left and right movement use
foot IK for a clear gait; jumping moves the whole armature so the character
really leaves the ground; blinks and expressions use morphs; the wave raises
the right hand toward the temple so the arm is not hidden by the head and
hair. The sixteen look directions are driven continuously on the same rig, so
body shape, clothing, and face stay consistent as the direction changes.

## The v2 animation contract

The final atlas is 8 columns by 11 rows of `192 × 208` cells, `1536 × 2288`
pixels in total, with an alpha channel:

| Row  | State           | Frames | Meaning                                                                 |
| ---- | --------------- | -----: | ----------------------------------------------------------------------- |
| 0    | `idle`          |      6 | Three-quarter stance facing screen left, breathing, blinking, head tilt |
| 1    | `running-right` |      8 | Full gait while being dragged right                                     |
| 2    | `running-left`  |      8 | Full gait while being dragged left                                      |
| 3    | `waving`        |      4 | Big wave, right hand near the temple                                    |
| 4    | `jumping`       |      5 | Anticipation, takeoff, tuck at the apex, descent, landing               |
| 5    | `failed`        |      8 | Slump, head down, deep-bow failure reaction                             |
| 6    | `waiting`       |      6 | Waiting for user input or confirmation                                  |
| 7    | `running`       |      6 | Focused work while a task runs; not literal running                     |
| 8    | `review`        |      6 | Checking the result after completion                                    |
| 9–10 | look directions |     16 | Clockwise gaze directions from `000`, one per 22.5°                     |

`000` means looking up, not the default front view. When the pointer is in the
dead zone the pet falls back to plain `idle`. The atlas uses 73 frames; in each
standard animation row, slots after the last valid frame must be fully
transparent, and all sixteen direction slots in rows 9 and 10 are used.

`pet.json` must set `spriteVersionNumber: 2` and point `spritesheetPath` at
the PNG or WebP atlas in the same directory; otherwise the desktop app reads
the sheet in the old nine-row format.

## From PMX to pet

1. Obtain the model and textures from the original distribution post and
   confirm its terms allow your use.
2. Install Blender and MMD Tools. The pipeline was built on Blender 4.5 LTS;
   other versions need a check of MMD Tools, Eevee, and PMX import
   compatibility.
3. Download `render_pmx_pet.py` and `assemble_pmx_pet.py`, and have the model
   file and an empty output directory ready.
4. On macOS, run the full render through a Blender GUI process; on my machine,
   background mode is unstable when initializing Metal.

```bash
open -a Blender -n --args \
  --python /path/to/render_pmx_pet.py \
  -- --mode full --render-scale 1 \
     --model /path/to/model.pmx --output-dir /path/to/output
```

5. After rendering, assemble the atlas with Pillow:

```bash
UV_CACHE_DIR=/private/tmp/codex-uv-cache \
uv run --with pillow python /path/to/assemble_pmx_pet.py --output-dir /path/to/output
```

6. Check `validation.json`, then check by eye: dimensions, alpha channel, the
   73 required frames, unused slots, motion continuity, facing, and lighting
   consistency.

To change the motion, edit the pose sequences for each state in
`render_pmx_pet.py`. A suitable Blender Action, or a VMD you have the right to
use, can replace the procedural poses, but the row order, frame counts, and
cell size still have to follow the pet specification for the target version.

## Installing locally

After producing your own render legitimately, put `pet.json` and the
spritesheet in one pet directory:

```bash
source_dir=/path/to/generated/xiaoluobao-blender
target_dir=~/.config/codex/pets/xiaoluobao-blender
mkdir -p "$target_dir"
cp "$source_dir/pet.json" "$target_dir/pet.json"
cp "$source_dir/spritesheet.png" "$target_dir/spritesheet.png"
```

In ChatGPT Desktop, open `Settings > Pets`, click `Refresh`, and select
`Xiaoluobao Blender`. Wake it with `/pet` or `Wake Pet` in the command menu;
run it again to hide. Custom pets are stored locally and do not sync to
ChatGPT on the web.

The atlas I use passes validation against the `1536 × 2288`, eleven-row,
73-required-frame, transparent-unused-slot contract.

## Credits and license summary

- Character copyright: Shanghai Tianshi Henian Entertainment (上海天矢禾念娱乐有限公司).
- Model: Kinsama.
- Rig: Lct火红枣.
- Contact and material work: LCPD拉灯.
- The original model forbids redistribution and commercial use and carries
  other restrictions; the full terms obtained from the distribution page are
  authoritative.
- Any other MMD motions or model content used must follow the terms of those
  resources as well.

## References

1. OpenAI, [Pets](https://learn.chatgpt.com/docs/pets), the ChatGPT and Codex Desktop pet documentation.
2. LCPD拉灯, [Xiaoluobao MMD model distribution video](https://www.bilibili.com/video/BV1E3411b77g/), Bilibili.
