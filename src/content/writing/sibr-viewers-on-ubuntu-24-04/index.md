---
title: "Building SIBR_viewers for 3D Gaussian Splatting on Ubuntu 24.04"
date: 2025-06-26
description: "Three fixes for the 3DGS viewer build on a recent Ubuntu: an outdated FFmpeg encoder, a missing embree3, and a libtbb error at run time."
tags: ["3dgs", "build", "ubuntu"]
---

> 中文标题：在 Ubuntu 24.04 上编译 3DGS 的 SIBR_viewers。本文为中英双语，中文为原文，英文版本由 AI 翻译，见分隔线之后。
> An English version, translated from the Chinese original with AI
> assistance, follows after the divider.

原版 3D Gaussian Splatting 代码附带的交互式查看器 `SIBR_viewers`，依赖的库在 Ubuntu 24.04 上已经不再提供。我遇到了三个问题，都有小修复。

## 1. `av_register_all` was not declared

`src/core/video/FFmpegVideoEncoder.cpp` 调用了多年前就被移除的 FFmpeg API，编译停在：

```text
error: 'av_register_all' was not declared in this scope
error: 'struct AVStream' has no member named 'codec'
```

有人在 gaussian-splatting 的 issue 里贴出了重写过的 `FFmpegVideoEncoder.cpp`。从那条评论下载 [FFmpegVideoEncoder.zip](https://github.com/graphdeco-inria/gaussian-splatting/files/12654978/FFmpegVideoEncoder.zip)，替换 `SIBR_viewers/src/core/video/` 下的同名文件，重新编译。

## 2. 只打包了 embree 4

raycaster 链接的是 `embree3`。Ubuntu 24.04 只打包了 embree 4，两者 API 不兼容，所以从上游安装最后一个 3.x 版本，而不是用 `apt`：

```bash
mkdir -p ~/opt && cd ~/opt
curl -LO https://github.com/RenderKit/embree/releases/download/v3.13.5/embree-3.13.5.x86_64.linux.tar.gz
tar xzf embree-3.13.5.x86_64.linux.tar.gz
```

只有 raycaster 用到 embree，所以只需要改一个 CMake 文件。`src/core/raycaster/CMakeLists.txt` 的非 Windows 分支原本是：

```cmake
else()
target_link_libraries(${PROJECT_NAME}
	OpenMP::OpenMP_CXX
	embree3
# CLUSTER
#	/data/graphdeco/share/tbb/lib64/libtbb.so
	sibr_graphics
	sibr_assets
	nanoflann
)
endif()
```

把它指向解压出来的目录（路径按你解压的位置调整）：

```cmake
else()
set(EMBREE3_ROOT "$ENV{HOME}/opt/embree-3.13.5.x86_64.linux")
target_include_directories(${PROJECT_NAME} PUBLIC "${EMBREE3_ROOT}/include")

target_link_libraries(${PROJECT_NAME}
	OpenMP::OpenMP_CXX
	"${EMBREE3_ROOT}/lib/libembree3.so"
# CLUSTER
#	/data/graphdeco/share/tbb/lib64/libtbb.so
	sibr_graphics
	sibr_assets
	nanoflann
)
endif()
```

然后按 README 配置和编译。

## 3. 运行时找不到 `libtbb`

编译能过，但启动查看器时可能失败，因为 `libembree3.so` 链接的是某个特定 soname 的 TBB，而系统里没有。我最初试的 embree 3.6.x 包报的是找不到 `libtbb.so.2`；3.13.5 的包需要 `libtbb.so.12`，Ubuntu 24.04 有对应的 `libtbb12` 包，但未必装了。不管哪种情况，embree 压缩包都自带它构建时用的 TBB，所以启动时把它的 `lib` 目录加到加载路径即可：

```bash
export LD_LIBRARY_PATH="$HOME/opt/embree-3.13.5.x86_64.linux/lib:$LD_LIBRARY_PATH"
```

fish 下：

```fish
set -x LD_LIBRARY_PATH $HOME/opt/embree-3.13.5.x86_64.linux/lib $LD_LIBRARY_PATH
```

之后查看器就能正常启动。

参考文献见下文英文部分。

---

## English version

The interactive viewer that ships with the original 3D Gaussian Splatting
code, `SIBR_viewers`, was written against libraries that Ubuntu 24.04 no
longer carries. Three things broke for me; all three have small fixes.

## 1. `av_register_all` was not declared

`src/core/video/FFmpegVideoEncoder.cpp` calls FFmpeg APIs that were removed
years ago, so the build stops with:

```text
error: 'av_register_all' was not declared in this scope
error: 'struct AVStream' has no member named 'codec'
```

A contributor posted a rewritten `FFmpegVideoEncoder.cpp` in the
gaussian-splatting issue tracker. Download
[FFmpegVideoEncoder.zip](https://github.com/graphdeco-inria/gaussian-splatting/files/12654978/FFmpegVideoEncoder.zip)
from that comment, replace the file under `SIBR_viewers/src/core/video/`, and
rebuild.

## 2. Only embree 4 is packaged

The raycaster links against `embree3`. Ubuntu 24.04 packages embree 4 only,
and the two are not API-compatible, so install the last 3.x release from
upstream instead of from `apt`:

```bash
mkdir -p ~/opt && cd ~/opt
curl -LO https://github.com/RenderKit/embree/releases/download/v3.13.5/embree-3.13.5.x86_64.linux.tar.gz
tar xzf embree-3.13.5.x86_64.linux.tar.gz
```

Only the raycaster uses embree, so one CMake file needs to know about it. In
`src/core/raycaster/CMakeLists.txt`, the non-Windows branch reads:

```cmake
else()
target_link_libraries(${PROJECT_NAME}
	OpenMP::OpenMP_CXX
	embree3
# CLUSTER
#	/data/graphdeco/share/tbb/lib64/libtbb.so
	sibr_graphics
	sibr_assets
	nanoflann
)
endif()
```

Point it at the extracted tarball (adjust the path to wherever you unpacked
it):

```cmake
else()
set(EMBREE3_ROOT "$ENV{HOME}/opt/embree-3.13.5.x86_64.linux")
target_include_directories(${PROJECT_NAME} PUBLIC "${EMBREE3_ROOT}/include")

target_link_libraries(${PROJECT_NAME}
	OpenMP::OpenMP_CXX
	"${EMBREE3_ROOT}/lib/libembree3.so"
# CLUSTER
#	/data/graphdeco/share/tbb/lib64/libtbb.so
	sibr_graphics
	sibr_assets
	nanoflann
)
endif()
```

Then configure and build as the README describes.

## 3. A missing `libtbb` at run time

The build succeeds, but launching the viewer can fail because `libembree3.so`
was linked against a specific TBB soname that the system does not provide.
With the embree 3.6.x tarball I first tried, the complaint was about
`libtbb.so.2`; the 3.13.5 tarball wants `libtbb.so.12`, which Ubuntu 24.04
does ship as `libtbb12` but which may not be installed. Either way, the embree
tarball bundles the TBB it was built with, so putting its `lib` directory on
the loader path when launching resolves it:

```bash
export LD_LIBRARY_PATH="$HOME/opt/embree-3.13.5.x86_64.linux/lib:$LD_LIBRARY_PATH"
```

In fish:

```fish
set -x LD_LIBRARY_PATH $HOME/opt/embree-3.13.5.x86_64.linux/lib $LD_LIBRARY_PATH
```

After that the viewers start normally.

## References

1. graphdeco-inria, [gaussian-splatting](https://github.com/graphdeco-inria/gaussian-splatting); the viewer build instructions are in its README.
2. [SIBR viewer install fails (Ubuntu 22.04), issue #151](https://github.com/graphdeco-inria/gaussian-splatting/issues/151#issuecomment-1724727148), the comment that carries the patched `FFmpegVideoEncoder.cpp`.
3. [SIBR_viewers dependence on old ffmpeg leading to build errors, issue #1060](https://github.com/graphdeco-inria/gaussian-splatting/issues/1060), the same error with a newer FFmpeg.
4. [embree v3.13.5 release](https://github.com/RenderKit/embree/releases/tag/v3.13.5), the last 3.x release.
