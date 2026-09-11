---
title: "PyTorch and CUDA environment variables worth knowing"
date: 2026-01-13
description: "Build-time and run-time environment variables I keep looking up: TORCH_CUDA_ARCH_LIST, CC and CXX, MAX_JOBS, NCCL error handling, and per-process thread limits."
tags: ["pytorch", "cuda", "distributed"]
---

> 中文标题：PyTorch 与 CUDA 相关的环境变量。本文为中英双语，中文为原文，英文版本由 AI 翻译，见分隔线之后。
> An English version, translated from the Chinese original with AI
> assistance, follows after the divider.

一份短清单：构建 CUDA 扩展和跑分布式训练时会用到的环境变量。都不冷门，只是我总在重新推导。

## 构建扩展

**`TORCH_CUDA_ARCH_LIST`** 决定扩展为哪些 GPU 架构编译。不设置时，`torch.utils.cpp_extension` 会为构建机器上可见的所有架构编译，外加 PTX。在工作站上这没问题，在要为另一个集群打 wheel 的构建机上就是错的。我最常用的值：

| GPU         | 计算能力 |
| ----------- | -------- |
| A100 / A800 | 8.0      |
| RTX 4090    | 8.9      |
| H100 / H800 | 9.0      |

```bash
TORCH_CUDA_ARCH_LIST="8.0;8.9;9.0" uv run python -m pip wheel ./packages/a_ext
```

最后一项加 `+PTX`（如 `"9.0+PTX"`）可以向前兼容更新的 GPU，代价是首次使用时要 JIT 编译。

**`CC` 和 `CXX`** 让 setuptools 和 ninja 使用指定的 `gcc` 和 `g++`。有的扩展会显式读取它们，而 `nvcc` 只接受一定范围内的宿主编译器版本，所以在默认编译器比 CUDA 工具包预期更新的机器上，钉住它们可以避免 "unsupported GNU version" 错误。`CUDAHOSTCXX` 只对 `nvcc` 起同样的作用。

**`MAX_JOBS`** 限制 ninja 的并行数。默认是 CPU 数加二，在共享登录节点上可能耗尽内存。

## 分布式训练

**`TORCH_NCCL_ASYNC_ERROR_HANDLING`** 决定某个 rank 在集合通信中崩溃或超时后会发生什么。不处理的话，其他 rank 会永远等在集合通信里，任务看起来像卡死。开启处理后，watchdog 线程会发现故障并中止进程，任务带着栈信息退出而不是空等。取值为 `0`（不处理）、`1`（tear down）、`2`（仅清理）、`3`（跳过清理）。当前 PyTorch 的默认值已经是 `3`，所以实际用法是想原地保留一个卡死现场以便挂调试器时把它设为 `0`，而不是需要专门开启它。相关的 `TORCH_NCCL_BLOCKING_WAIT=1` 会让每次 `wait()` 阻塞到集合通信完成或超时，那个才真的损失吞吐量，只用于调试。

## 每个进程的 CPU 线程数

**`OMP_NUM_THREADS` 和 `MKL_NUM_THREADS`** 限制单个进程内 OpenMP 和 Intel MKL 开的线程数。训练任务本来就有很多进程：每张 GPU 一个，再加上每个进程 fork 出的 DataLoader worker。如果每个进程再各开一整套 BLAS 线程，CPU 花在调度上的时间会超过计算。按进程限制这两个变量能让 worker 老实。`torchrun` 在你没设置时会为每个进程设置 `OMP_NUM_THREADS=1`，并打印警告说明这一点。

这两个变量影响进程内所有 NumPy、SciPy 和 PyTorch 的 CPU 计算。不要在 shell 配置文件里导出它们，只在训练命令行上设置。

```bash
OMP_NUM_THREADS=4 MKL_NUM_THREADS=4 torchrun --nproc_per_node=8 -m my_project.cli.train
```

参考文献见下文英文部分。

---

## English version

A short list of environment variables that matter when building CUDA
extensions and running distributed training. None of it is obscure; I just
kept re-deriving it.

## Building extensions

**`TORCH_CUDA_ARCH_LIST`** selects the GPU architectures an extension is
compiled for. Left unset, `torch.utils.cpp_extension` compiles for every
architecture visible on the build machine, plus PTX. That is fine on a
workstation and wrong on a build box that has to produce a wheel for a
different cluster. The values I use most:

| GPU         | Compute capability |
| ----------- | ------------------ |
| A100 / A800 | 8.0                |
| RTX 4090    | 8.9                |
| H100 / H800 | 9.0                |

```bash
TORCH_CUDA_ARCH_LIST="8.0;8.9;9.0" uv run python -m pip wheel ./packages/a_ext
```

Append `+PTX` to the last entry, as in `"9.0+PTX"`, to keep forward
compatibility with newer GPUs at the cost of a JIT compile on first use.

**`CC` and `CXX`** point setuptools and ninja at a specific `gcc` and `g++`.
Some extensions read them explicitly, and `nvcc` only accepts a range of host
compiler versions, so pinning them avoids "unsupported GNU version" errors on
machines whose default compiler is newer than the CUDA toolkit expects.
`CUDAHOSTCXX` does the same for `nvcc` alone.

**`MAX_JOBS`** caps the number of parallel ninja workers. The default is the
number of CPUs plus two, which can exhaust memory on a shared login node.

## Distributed training

**`TORCH_NCCL_ASYNC_ERROR_HANDLING`** decides what happens when one rank
crashes or times out inside a collective. Without handling, the other ranks
wait in the collective forever and the job looks hung. With handling, a
watchdog thread notices the failure and aborts the process, so the job dies
with a stack trace instead of sitting idle. The values are `0` (no handling),
`1` (tear down), `2` (clean up only), and `3` (skip clean up). Current
PyTorch defaults to `3`, so in practice the variable is something you set to
`0` when you deliberately want a hang you can attach a debugger to, not
something you need to enable. The related `TORCH_NCCL_BLOCKING_WAIT=1` makes
every `wait()` block until the collective completes or times out; that one
costs throughput and is for debugging only.

## CPU threads per process

**`OMP_NUM_THREADS` and `MKL_NUM_THREADS`** cap the threads OpenMP and Intel
MKL spawn inside one process. A training job already runs many processes: one
per GPU, plus the DataLoader workers each of them forks. If every one of those
also spawns a full set of BLAS threads, the CPU spends more time scheduling
than computing. Capping the two variables per process keeps the workers
honest. `torchrun` sets `OMP_NUM_THREADS=1` for each process when you have not
set it yourself, and prints a warning saying so.

Both variables affect every NumPy, SciPy, and PyTorch CPU computation in the
process. Do not export them from your shell profile; set them on the training
command line only.

```bash
OMP_NUM_THREADS=4 MKL_NUM_THREADS=4 torchrun --nproc_per_node=8 -m my_project.cli.train
```

## References

1. PyTorch, [torch.utils.cpp_extension](https://docs.pytorch.org/docs/stable/cpp_extension.html), for `TORCH_CUDA_ARCH_LIST`, `MAX_JOBS`, and `CXX`.
2. PyTorch, [ProcessGroupNCCL.hpp](https://github.com/pytorch/pytorch/blob/main/torch/csrc/distributed/c10d/ProcessGroupNCCL.hpp), where the NCCL environment variables and their default values are defined.
3. PyTorch, [torch.distributed](https://docs.pytorch.org/docs/stable/distributed.html).
