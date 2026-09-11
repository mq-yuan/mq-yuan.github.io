---
title: "When an Ubuntu kernel update takes Wi-Fi, Bluetooth, and the GPU with it"
date: 2025-08-20
description: "A kernel upgrade landed without its extra modules or NVIDIA modules. How to boot the previous kernel from GRUB, then finish the upgrade properly."
tags: ["ubuntu", "linux", "grub"]
---

> 中文标题：Ubuntu 内核更新带走 Wi-Fi、蓝牙和 GPU 之后。本文为中英双语，中文为原文，英文版本由 AI 翻译，见分隔线之后。
> An English version, translated from the Chinese original with AI
> assistance, follows after the divider.

某天早上一次自动更新之后，我的 Ubuntu 桌面开机就没有 Wi-Fi、没有蓝牙、也没有 NVIDIA 驱动。其实什么都没坏。机器启动了一个新内核，而这个内核只装了最基本的模块包。

## 发生了什么

列出已安装的内核模块包：

```bash
dpkg -l | grep linux-modules
```

对同一个内核版本有三类包：

- `linux-modules-<ver>-generic` 是最基本的内核模块集合。自动更新装的就是它，单靠它对一台笔记本来说不够。
- `linux-modules-extra-<ver>-generic` 是剩下的部分：Wi-Fi、蓝牙和大多数其他硬件。没有它，内核能启动，但硬件不出现。
- `linux-modules-nvidia-<branch>-<ver>-generic` 是为该内核预编译的 NVIDIA 模块，也就是 `ubuntu-drivers` 安装的那个包。

这次更新为新内核装了基本包并把它设为默认启动项，而对应版本的 `extra` 和 `nvidia` 包还没有装上。所以三样齐全的旧内核仍然正常，新内核不行。

当时是 2025 年 8 月，24.04 加 HWE 内核，对我正常工作的内核是 `6.14.0-27-generic`，刚装上的是 `6.14.0-28-generic`。

## 补救：启动上一个内核

`uname -r` 显示当前运行的内核。GRUB 能启动的内核列在它生成的配置里：

```bash
sudo grep menuentry /boot/grub/grub.cfg
```

```text
menuentry 'Ubuntu' ...
submenu 'Advanced options for Ubuntu' ... {
        menuentry 'Ubuntu, with Linux 6.14.0-28-generic' ...
        menuentry 'Ubuntu, with Linux 6.14.0-28-generic (recovery mode)' ...
        menuentry 'Ubuntu, with Linux 6.14.0-27-generic' ...
        menuentry 'Ubuntu, with Linux 6.14.0-27-generic (recovery mode)' ...
}
```

`submenu` 下面的每一行都是一个可启动的内核。要把能用的那个设为默认，编辑 `/etc/default/grub`，把第一项 `GRUB_DEFAULT=0` 改成子菜单路径。条目从零计数，顶层的子菜单是第 `1` 项，`6.14.0-27` 内核在子菜单里是第 `2` 项：

```text
GRUB_DEFAULT="1>2"
```

按名字引用更稳，因为每次增删内核索引都会变：

```text
GRUB_DEFAULT="Advanced options for Ubuntu>Ubuntu, with Linux 6.14.0-27-generic"
```

重新生成配置并重启：

```bash
sudo update-grub
sudo reboot
```

也可以在启动时按住 Shift（BIOS）或按 Esc（UEFI）调出一次 GRUB 菜单，手动选择内核。这足以在改任何东西之前先回到能用的桌面。

## 修复：把升级做完

钉住旧内核只是权宜之计。真正的修复是把新内核缺的东西装上。包名里的版本号才是关键，所以在哪个内核下执行都可以：

```bash
sudo apt install linux-modules-extra-6.14.0-28-generic
sudo reboot
sudo ubuntu-drivers install
```

`ubuntu-drivers devices` 显示推荐的 NVIDIA 分支，`ubuntu-drivers install` 会拉取与当前运行内核匹配的 `linux-modules-nvidia` 包。再重启一次，Wi-Fi、蓝牙和 `nvidia-smi` 应该都在新内核上回来了。

如果已经运行在新内核上，最短的写法是：

```bash
sudo apt install "linux-modules-extra-$(uname -r)"
```

## 避免再次发生

Ubuntu 的内核元包（`linux-generic`，HWE 内核则是 `linux-generic-hwe-24.04`）依赖 `extra` 模块，所以通过元包做的正常 `apt upgrade` 会把两者一起带上。检查元包是否安装且没有被 hold：

```bash
apt policy linux-generic-hwe-24.04
apt-mark showhold
```

NVIDIA 这边，`linux-modules-nvidia-<branch>-generic-hwe-24.04` 元包以同样的方式跟随内核，`ubuntu-drivers install` 会替你装好。两个元包都在的话，一次内核更新会把它的 extra 模块和 NVIDIA 模块一起带过来。

参考文献见下文英文部分。

---

## English version

One morning after an automatic update, my Ubuntu desktop came up with no
Wi-Fi, no Bluetooth, and no NVIDIA driver. Nothing was broken. The machine had
booted a new kernel for which only the base module package was installed.

## What happened

List the installed kernel module packages:

```bash
dpkg -l | grep linux-modules
```

For one kernel version there are three kinds of package:

- `linux-modules-<ver>-generic` is the base set of kernel modules. This is
  what the automatic update installed, and on its own it is not enough for a
  laptop.
- `linux-modules-extra-<ver>-generic` holds the rest: Wi-Fi, Bluetooth, and
  most other hardware. Without it, the kernel boots but the hardware does not
  appear.
- `linux-modules-nvidia-<branch>-<ver>-generic` is the prebuilt NVIDIA module
  for that kernel, the package that `ubuntu-drivers` installs.

The update had installed the base package for a new kernel and made it the
default boot entry, while the `extra` and `nvidia` packages for that version
were not installed yet. So the previous kernel, which had all three, still
worked; the new one did not.

At the time, August 2025 on 24.04 with the HWE kernel, the kernel that worked
for me was `6.14.0-27-generic` and the freshly installed one was
`6.14.0-28-generic`.

## Recovering: boot the previous kernel

`uname -r` shows the running kernel. The kernels GRUB can boot are listed in
its generated config:

```bash
sudo grep menuentry /boot/grub/grub.cfg
```

```text
menuentry 'Ubuntu' ...
submenu 'Advanced options for Ubuntu' ... {
        menuentry 'Ubuntu, with Linux 6.14.0-28-generic' ...
        menuentry 'Ubuntu, with Linux 6.14.0-28-generic (recovery mode)' ...
        menuentry 'Ubuntu, with Linux 6.14.0-27-generic' ...
        menuentry 'Ubuntu, with Linux 6.14.0-27-generic (recovery mode)' ...
}
```

Each line under `submenu` is a bootable kernel. To make the working one the
default, edit `/etc/default/grub` and change the first setting from
`GRUB_DEFAULT=0` to a submenu path. Entries are numbered from zero, so the
submenu is entry `1` at the top level and the `6.14.0-27` kernel is entry `2`
inside it:

```text
GRUB_DEFAULT="1>2"
```

Referring to the entry by name is sturdier, because the indices shift every
time a kernel is added or removed:

```text
GRUB_DEFAULT="Advanced options for Ubuntu>Ubuntu, with Linux 6.14.0-27-generic"
```

Regenerate the config and reboot:

```bash
sudo update-grub
sudo reboot
```

You can also hold Shift (BIOS) or press Esc (UEFI) during boot to get the GRUB
menu once and pick the kernel by hand. That is enough to get back to a working
desktop before editing anything.

## Fixing it: finish the upgrade

Pinning the old kernel is a workaround. The real fix is to install what the
new kernel is missing. The version in the package name is what matters, so
this works from either kernel:

```bash
sudo apt install linux-modules-extra-6.14.0-28-generic
sudo reboot
sudo ubuntu-drivers install
```

`ubuntu-drivers devices` shows which NVIDIA branch is recommended, and
`ubuntu-drivers install` pulls the `linux-modules-nvidia` package matching the
running kernel. After one more reboot, Wi-Fi, Bluetooth, and `nvidia-smi`
should all be back on the new kernel.

If you are already running the new kernel, the shortest form is:

```bash
sudo apt install "linux-modules-extra-$(uname -r)"
```

## Keeping it from happening again

Ubuntu's kernel metapackages, `linux-generic` or `linux-generic-hwe-24.04` for
the HWE kernel, depend on the `extra` modules, so a normal `apt upgrade`
through the metapackage brings both. Check that the metapackage is installed
and not held:

```bash
apt policy linux-generic-hwe-24.04
apt-mark showhold
```

For the NVIDIA side, the `linux-modules-nvidia-<branch>-generic-hwe-24.04`
metapackage tracks the kernel the same way, and `ubuntu-drivers install` puts
it in place for you. With both metapackages present, a kernel update carries
its extra modules and its NVIDIA module along with it.

## References

1. Ubuntu Server documentation, [Install NVIDIA drivers](https://ubuntu.com/server/docs/how-to/graphics/install-nvidia-drivers/).
2. GNU GRUB manual, [Simple configuration](https://www.gnu.org/software/grub/manual/grub/html_node/Simple-configuration.html), for the `GRUB_DEFAULT` syntax.
