---
title: "Installing the NVIDIA driver on Ubuntu with ubuntu-drivers"
date: 2025-04-13
description: "The boring way that works: let ubuntu-drivers pick a signed, prebuilt driver. What the tool does, when to use the --gpgpu server variant, and what a driver even is."
tags: ["ubuntu", "nvidia", "linux"]
---

> 中文标题：用 ubuntu-drivers 安装 NVIDIA 驱动。本文为中英双语，中文为原文，英文版本由 AI 翻译，见分隔线之后。
> An English version, translated from the Chinese original with AI
> assistance, follows after the divider.

在 Ubuntu 上我用 Canonical 自己的工具 `ubuntu-drivers` 安装 NVIDIA 驱动。它和桌面设置里"附加驱动"面板的逻辑相同，但控制更细，而且能在服务器上用。

## 安装

动驱动之前先把软件包索引和系统更新一遍。这能省掉之后一整类"为什么坏了"的问题。

```bash
sudo apt update
sudo apt upgrade
```

然后让工具自己选：

```bash
sudo ubuntu-drivers install
```

一般到这里就结束了。不需要自己挑版本；工具会检测硬件并安装它认为最匹配的驱动。

## ubuntu-drivers 在做什么

先列出可用的驱动再做决定：

```bash
sudo ubuntu-drivers list           # 桌面
sudo ubuntu-drivers list --gpgpu   # 服务器 / 计算
```

需要时按名字安装指定分支：

```bash
sudo ubuntu-drivers install nvidia:535
```

无头的计算机器用 `--gpgpu`。它选择的是 `-server` 驱动分支，也就是面向计算而非显示的"Enterprise Ready Drivers"，配套的工具包要自己装：

```bash
sudo ubuntu-drivers install --gpgpu nvidia:535-server
sudo apt install nvidia-utils-535-server
```

这个工具做的两件我在意的事：

- **优先使用预编译且签过名的模块。** 驱动以 `linux-modules-nvidia-<branch>-<kernel>` 软件包的形式到来，由 Canonical 针对每个内核构建并签名。开启 Secure Boot 时，这是唯一不用自己注册密钥就能工作的方式。DKMS 包在本机编译且没有签名；Ubuntu 文档只在自定义内核的情况下推荐它们。
- **知道哪个驱动匹配你的内核。** 内核升级后，再执行一次 `sudo ubuntu-drivers install` 就会拉取新内核对应的模块包。如果某次内核更新让 GPU 没了，或者连 Wi-Fi 和蓝牙也没了，见[Ubuntu 内核更新带走 Wi-Fi、蓝牙和 GPU 之后](/writing/ubuntu-kernel-update-broke-drivers/)。

不要在这之上再用 NVIDIA 的 `.run` 安装器或第三方 PPA 装驱动。它们会覆盖打包好的模块，并可能破坏 Secure Boot。

## 驱动是什么

NVIDIA 驱动是操作系统和 GPU 之间的一层软件。它把操作系统和应用的请求翻译成 GPU 自己的指令，并提供 OpenGL、Vulkan 等图形 API 以及通过 CUDA 进行的通用计算。没有它，GPU 只是一块不工作的硬件。版本号形如 Linux 上的 `550.54.14` 和 Windows 上的 `551.61`；开头的数字是驱动分支，每个 CUDA 工具包都会注明它所需的最低分支。

参考文献见下文英文部分。

---

## English version

On Ubuntu I install the NVIDIA driver with `ubuntu-drivers`, Canonical's own
tool. It runs the same logic as the "Additional Drivers" panel in the desktop
settings, with more control, and it works on servers.

## Install

Before touching drivers, bring the package index and the system up to date. It
removes a whole class of "why did this break" later.

```bash
sudo apt update
sudo apt upgrade
```

Then let the tool pick:

```bash
sudo ubuntu-drivers install
```

That is usually all. You do not have to choose a version; the tool detects the
hardware and installs the driver it considers the best match.

## What ubuntu-drivers is doing

List what is available before committing:

```bash
sudo ubuntu-drivers list           # desktop
sudo ubuntu-drivers list --gpgpu   # server / compute
```

Install a specific branch by name if you need one:

```bash
sudo ubuntu-drivers install nvidia:535
```

For a headless compute machine, use the `--gpgpu` flag. It selects the
`-server` driver branch, the "Enterprise Ready Drivers" meant for computation
rather than display, and you install the matching utilities package yourself:

```bash
sudo ubuntu-drivers install --gpgpu nvidia:535-server
sudo apt install nvidia-utils-535-server
```

Two things the tool does that I care about:

- **It prefers prebuilt, signed modules.** The driver arrives as
  `linux-modules-nvidia-<branch>-<kernel>` packages, built and signed by
  Canonical for each kernel. With Secure Boot enabled this is the only option
  that works without enrolling your own key. The DKMS packages compile on your
  machine and are unsigned; the Ubuntu documentation recommends them only for
  custom kernels.
- **It knows which driver matches your kernel.** After a kernel upgrade,
  `sudo ubuntu-drivers install` again pulls the module package for the new
  kernel. If a kernel update ever leaves you without the GPU, or without Wi-Fi
  and Bluetooth, see
  [When an Ubuntu kernel update takes Wi-Fi, Bluetooth, and the GPU with it](/writing/ubuntu-kernel-update-broke-drivers/).

Avoid installing the driver from NVIDIA's `.run` installer or from third-party
PPAs on top of this. They overwrite the packaged modules and can break Secure
Boot.

## What the driver is

The NVIDIA driver is a software layer between the operating system and the
GPU. It translates OS and application requests into the GPU's own
instructions, and it exposes graphics APIs such as OpenGL and Vulkan as well
as general computation through CUDA. Without it the GPU is inert hardware.
Versions look like `550.54.14` on Linux and `551.61` on Windows; the leading
number is the driver branch, and each CUDA toolkit states the minimum branch
it needs.

## References

1. Ubuntu Server documentation, [Install NVIDIA drivers](https://ubuntu.com/server/docs/how-to/graphics/install-nvidia-drivers/).
