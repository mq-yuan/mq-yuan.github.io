---
title: "A project skeleton for training, inference, and a CUDA extension"
date: 2026-03-13
description: "A uv workspace plus Hydra layout for ML projects with a first-party CUDA extension: where things go, how the extension loads, and what to test."
tags: ["python", "pytorch", "cuda", "tooling"]
---

> 中文标题：Python 项目结构：训练、推理与 CUDA 扩展一体化。本文为中英双语，中文为原文，英文版本由 AI 翻译，见分隔线之后。
> An English version, translated from the Chinese original with AI
> assistance, follows after the divider.

来源说明：本文最初是我就重构自己一个项目向 ChatGPT 提问后得到的回答。因为有用，我把它记进了笔记，之后在整理成这篇文章时做了修改，并修正了几处细节（在文中注明）。

这是我为同时满足以下条件的研究代码定下的一套布局：

- 训练和推理共用同一套核心代码
- 有 first-party 的 CUDA 扩展
- 有少量打过补丁的第三方依赖
- 用 `uv` 和 `pyproject.toml`
- 用 Hydra 做配置组合
- 之后还要做 CI、打包、部署和复现

它不是唯一合理的答案。下面每一条边界的存在，都是因为没有它时我吃过亏。

## 1. 目录结构

把自己写的代码和打过补丁的第三方代码彻底分开。

```text
repo/
├── pyproject.toml
├── uv.lock
├── README.md
├── configs/
│   ├── config.yaml
│   ├── task/          train.yaml, infer.yaml
│   ├── model/         base.yaml, large.yaml
│   ├── data/          train.yaml, infer.yaml
│   ├── optimizer/     adamw.yaml
│   ├── trainer/       single_gpu.yaml, ddp.yaml, fsdp.yaml
│   ├── runtime/       local.yaml, cluster.yaml, inference.yaml
│   ├── paths/         local.yaml, cluster.yaml
│   ├── logging/       default.yaml, mlflow.yaml
│   └── experiment/    train_base.yaml, infer_base.yaml
├── src/
│   └── my_project/
│       ├── cli/       train.py, infer.py, export.py
│       ├── config_schema/
│       ├── data/  models/  training/  inference/  serving/
│       ├── ops/       fused_ops.py, dispatch.py
│       └── utils/
├── packages/
│   └── a_ext/
│       ├── pyproject.toml
│       ├── setup.py
│       ├── csrc/      registration.cpp, kernels.cu, cpu_kernels.cpp, common.h
│       ├── src/a_ext/ __init__.py, _loader.py, _jit.py, ops.py, fake.py, autograd.py
│       └── tests/     test_correctness.py, test_opcheck.py, test_gradcheck.py
├── third_party/
│   └── some_patched_lib/
├── tests/             unit/, integration/, e2e/
├── scripts/           dev/, oneoff/
├── docker/            train.Dockerfile, infer.Dockerfile
└── outputs/
```

最核心的几条边界：

- `src/my_project/` 是主业务包。训练、推理、导出、服务逻辑都在这里。
- `packages/a_ext/` 是 first-party 的 CUDA 扩展。它是一个被主项目依赖的真正的包，不是附属脚本。uv 的 workspace 就是为这种"一个仓库多个包"的场景设计的。
- `third_party/` 放你改过的第三方代码。不要和自己写的混在一起。
- `configs/` 只负责配置组合。Hydra 的 defaults list 会从各个 config group 组装出最终配置，所以永远不需要为每个实验复制一整份 YAML。

## 2. 根目录 `pyproject.toml`

主项目本身是一个包，同时定义 uv workspace，把 `a_ext` 列为 workspace member，通过 path source 引入打过补丁的第三方代码，并用 entry point 暴露 CLI，而不是长期把 `scripts/*.py` 当作正式入口。`src` 布局和 entry point 都是标准的打包实践。

```toml
[build-system]
requires = ["setuptools>=80", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "my-project"
version = "0.1.0"
description = "Training and inference in one codebase"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
  "torch==2.6.0",
  "hydra-core>=1.3",
  "omegaconf>=2.3",
  "numpy>=1.26",
  "packaging>=24.0",
  "a-ext",
]

[project.optional-dependencies]
train = ["mlflow>=2.20", "tensorboard>=2.18"]
infer = ["fastapi>=0.115", "uvicorn>=0.34"]

[project.scripts]
my-train = "my_project.cli.train:main"
my-infer = "my_project.cli.infer:main"
my-export = "my_project.cli.export:main"

[tool.setuptools]
package-dir = {"" = "src"}

[tool.setuptools.packages.find]
where = ["src"]

[tool.uv.workspace]
members = ["packages/a_ext"]

[tool.uv.sources]
a-ext = { workspace = true }
some-patched-lib = { path = "third_party/some_patched_lib" }

[dependency-groups]
dev = [
  "pytest>=8.0",
  "pytest-cov>=6.0",
  "mypy>=1.14",
  "ruff>=0.11",
  "pre-commit>=4.0",
]

[tool.pytest.ini_options]
addopts = ["--import-mode=importlib", "--strict-markers"]
testpaths = ["tests", "packages/a_ext/tests"]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP"]

[tool.mypy]
python_version = "3.11"
warn_unused_configs = true
pretty = true
```

开发工具放在 `[dependency-groups]` 里，`uv sync` 默认会安装它们；不要再放一份 `dev` extra，那会进入发布出去的元数据。

## 3. `packages/a_ext/pyproject.toml`

这个文件只描述 `a_ext` 自己。`[build-system]` 一定要保留；没有它的包无法在隔离环境中构建。

```toml
[build-system]
requires = ["setuptools>=80", "wheel", "torch"]
build-backend = "setuptools.build_meta"

[project]
name = "a-ext"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = ["torch>=2.6,<2.7"]

[tool.setuptools]
package-dir = {"" = "src"}

[tool.setuptools.packages.find]
where = ["src"]
```

## 4. `packages/a_ext/setup.py`

走"最小 setup.py"路线：元数据放 `pyproject.toml`，构建逻辑放这里。

```python
from setuptools import setup
from torch.utils.cpp_extension import BuildExtension, CUDAExtension


def get_extensions() -> list[CUDAExtension]:
    """Describe the native extension module.

    Returns:
        A single CUDAExtension building the CPU and CUDA sources into a_ext._C.
    """
    sources = [
        "csrc/registration.cpp",
        "csrc/cpu_kernels.cpp",
        "csrc/kernels.cu",
    ]
    extra_compile_args = {
        "cxx": ["-O3", "-std=c++17"],
        "nvcc": ["-O3", "--use_fast_math", "-lineinfo"],
    }
    return [
        CUDAExtension(
            name="a_ext._C",
            sources=sources,
            extra_compile_args=extra_compile_args,
        )
    ]


setup(
    ext_modules=get_extensions(),
    cmdclass={"build_ext": BuildExtension},
)
```

## 5. `a_ext` 的 Python 分层

整个扩展设计里最重要的一条规则：**不要靠来回改 `__init__.py` 切换开发和生产行为。** 用环境变量选择模式，两条路径都保留在代码里。

### `src/a_ext/_loader.py`

```python
import os
from pathlib import Path

import torch


def load_prebuilt() -> None:
    """Load the shared library produced by ``setup.py build_ext``.

    setuptools names the artifact with the platform tag, for example
    ``_C.cpython-311-x86_64-linux-gnu.so``, so glob for it instead of
    hard-coding ``_C.so``.
    """
    pkg_dir = Path(__file__).resolve().parent
    candidates = sorted(pkg_dir.glob("_C*.so"))
    assert candidates, f"No prebuilt _C*.so in {pkg_dir}; build the wheel or set A_EXT_MODE=jit"
    torch.ops.load_library(str(candidates[0]))


def load_jit(verbose: bool = True) -> None:
    """Build the extension with the JIT toolchain and load it.

    Args:
        verbose: Forwarded to ``torch.utils.cpp_extension.load``.
    """
    from ._jit import build_and_load_jit

    build_and_load_jit(verbose=verbose)


def load_extension() -> None:
    """Load the extension according to ``A_EXT_MODE`` (``prebuilt`` or ``jit``)."""
    mode = os.getenv("A_EXT_MODE", "prebuilt").strip().lower()
    if mode == "prebuilt":
        load_prebuilt()
        return
    if mode == "jit":
        load_jit()
        return
    raise ValueError(f"Unsupported A_EXT_MODE: {mode}")
```

原始回答里写死了 `_C.so`；setuptools 生成的文件名带平台后缀，所以这里改成 glob。

### `src/a_ext/_jit.py`

```python
from pathlib import Path

from torch.utils.cpp_extension import load


def build_and_load_jit(verbose: bool = True) -> None:
    """Compile the csrc tree with ninja and load it into the process.

    Args:
        verbose: Print the compiler invocations.
    """
    root = Path(__file__).resolve().parents[2]  # packages/a_ext
    csrc = root / "csrc"
    sources = [
        str(csrc / "registration.cpp"),
        str(csrc / "cpu_kernels.cpp"),
        str(csrc / "kernels.cu"),
    ]
    load(
        name="a_ext_jit",
        sources=sources,
        extra_cflags=["-O3", "-std=c++17"],
        extra_cuda_cflags=["-O3", "--use_fast_math", "-lineinfo"],
        verbose=verbose,
        is_python_module=False,
    )
```

`is_python_module=False` 很关键。正式路径依赖的是 dispatcher 注册加 `torch.ops.load_library`，而不是导入一个 pybind 模块。带上这个参数后，JIT 路径以副作用的方式加载库并且不返回任何东西，尽可能贴近正式路径。PyTorch 的自定义算子教程对两种加载方式都有说明。

### `src/a_ext/__init__.py`

```python
from ._loader import load_extension

load_extension()

# The fake and autograd registrations must exist wherever the op is used, not
# only in the test suite; import them after the library is loaded.
from . import autograd as _autograd  # noqa: E402, F401
from . import fake as _fake  # noqa: E402, F401
```

原始回答只在测试里导入 `fake` 和 `autograd`，主项目跑起来时这些注册并不存在；这里改为在加载库之后统一导入。

## 6. C++ 注册结构

### `csrc/registration.cpp`

```cpp
#include <torch/library.h>

torch::Tensor a_ext_forward_cuda(torch::Tensor x, torch::Tensor y);
torch::Tensor a_ext_forward_cpu(torch::Tensor x, torch::Tensor y);

TORCH_LIBRARY(a_ext, m) {
  m.def("forward(Tensor x, Tensor y) -> Tensor");
}

TORCH_LIBRARY_IMPL(a_ext, CPU, m) {
  m.impl("forward", &a_ext_forward_cpu);
}

TORCH_LIBRARY_IMPL(a_ext, CUDA, m) {
  m.impl("forward", &a_ext_forward_cuda);
}
```

这就是 PyTorch 自定义算子教程推荐的注册方式。较新的 PyTorch 版本还提供了面向 ABI 稳定扩展的 `STABLE_TORCH_LIBRARY`，结构相同。

### `src/a_ext/ops.py`

```python
import torch


def forward(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    """Call the registered custom operator.

    Args:
        x: First operand.
        y: Second operand, same shape as ``x``.

    Returns:
        The operator output.
    """
    return torch.ops.a_ext.forward(x, y)
```

## 7. 给训练链路补上 fake 与 autograd

只做推理的小算子，很多人注册完 CUDA kernel 就结束了。但训练推理一体化的项目，应该从第一天就把训练相关接口接好。PyTorch 的指南说得很明确：要让算子和 `torch.compile`、FakeTensor、导出体系协作，需要 `register_fake`；接入 autograd 用 `register_autograd`；用 `opcheck` 验证注册是否正确。

### `src/a_ext/fake.py`

```python
import torch


@torch.library.register_fake("a_ext::forward")
def _fake_forward(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    """Shape and dtype propagation without running the kernel."""
    torch._check(x.shape == y.shape, lambda: "Input shapes must match.")
    return torch.empty_like(x)
```

### `src/a_ext/autograd.py`

```python
import torch


def _setup_context(ctx: torch.autograd.function.FunctionCtx, inputs, output) -> None:
    """Save what backward needs."""
    x, y = inputs
    ctx.save_for_backward(x, y)


def _backward(
    ctx: torch.autograd.function.FunctionCtx,
    grad_output: torch.Tensor,
) -> tuple[torch.Tensor, torch.Tensor]:
    """Backward formula for an elementwise sum."""
    return grad_output, grad_output


torch.library.register_autograd(
    "a_ext::forward",
    _backward,
    setup_context=_setup_context,
)
```

## 8. 扩展的测试组织

这是最容易被漏掉的部分。

### `packages/a_ext/tests/test_correctness.py`

```python
import torch

from a_ext.ops import forward


def test_forward_matches_reference() -> None:
    x = torch.randn(8, 16, device="cuda")
    y = torch.randn(8, 16, device="cuda")
    assert torch.allclose(forward(x, y), x + y, atol=1e-5, rtol=1e-5)
```

### `packages/a_ext/tests/test_opcheck.py`

```python
import torch

from a_ext.ops import forward


def test_opcheck() -> None:
    x = torch.randn(4, 8, device="cuda")
    y = torch.randn(4, 8, device="cuda")
    torch.library.opcheck(
        forward,
        (x, y),
        test_utils=("test_schema", "test_autograd_registration", "test_faketensor"),
    )
```

### `packages/a_ext/tests/test_gradcheck.py`

```python
import torch

from a_ext.ops import forward


def test_gradcheck() -> None:
    x = torch.randn(2, 3, device="cuda", dtype=torch.double, requires_grad=True)
    y = torch.randn(2, 3, device="cuda", dtype=torch.double, requires_grad=True)
    assert torch.autograd.gradcheck(forward, (x, y), eps=1e-6, atol=1e-4)
```

`opcheck` 是官方推荐测试流程的一部分；`gradcheck` 则是训练场景下验证反向公式的经典手段。

## 9. 主项目如何调用扩展

不要在代码库里到处散落 `torch.ops.a_ext.*`。在 `src/my_project/ops/` 下统一包一层。

```python
import torch

from a_ext.ops import forward as a_ext_forward

USE_CUSTOM_OP = True


def fused_add(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    """Project-level wrapper with a reference fallback.

    Args:
        x: First operand.
        y: Second operand.

    Returns:
        ``x + y`` computed by the custom kernel on CUDA, by PyTorch otherwise.
    """
    if USE_CUSTOM_OP and x.is_cuda:
        return a_ext_forward(x, y)
    return x + y
```

有了这一层，换实现、加 fallback、做 benchmark、做 A/B 测试都很便宜。不是每个环境都能装上扩展，而训练和推理在装不上时都得能继续跑。

## 10. Hydra 配置怎么组织

Hydra 的 defaults list 从各个 group 组装最终配置。不要把 train 和 infer 搅在一个文件里。

### `configs/config.yaml`

```yaml
defaults:
  - task: train
  - model: base
  - data: train
  - optimizer: adamw
  - trainer: single_gpu
  - runtime: local
  - paths: local
  - logging: default
  - experiment: null
  - _self_

project:
  name: my_project
  seed: 42

hydra:
  run:
    dir: outputs/${now:%Y-%m-%d}/${task.name}/${now:%H-%M-%S}
  sweep:
    dir: multirun/${now:%Y-%m-%d}/${task.name}
    subdir: ${hydra.job.num}
```

### `configs/runtime/local.yaml` 与 `configs/runtime/inference.yaml`

```yaml
# local.yaml
device: cuda
precision: bf16
num_workers: 4
compile: false
extension_mode: jit
```

```yaml
# inference.yaml
device: cuda
precision: fp16
num_workers: 2
compile: true
extension_mode: prebuilt
```

扩展的加载模式放在 runtime 配置里，作为一个运行模式开关；编译细节不放。实验文件在全局层面覆盖它需要的部分：

```yaml
# configs/experiment/train_base.yaml
# @package _global_
defaults:
  - override /model: base
  - override /trainer: ddp

trainer:
  max_steps: 100000
```

Hydra 还会按上面 `hydra.run.dir` 的模式为每次运行创建输出目录，保存日志和组合后配置的 YAML 快照。

## 11. CLI 入口

正式入口用 package entry point，不要长期靠 `scripts/xxx.py`。

```python
# src/my_project/cli/train.py
import os

import hydra
from omegaconf import DictConfig


@hydra.main(version_base=None, config_path="../../../configs", config_name="config")
def main(cfg: DictConfig) -> None:
    os.environ["A_EXT_MODE"] = cfg.runtime.extension_mode

    from my_project.training.runner import run_training

    run_training(cfg)


if __name__ == "__main__":
    main()
```

`infer.py` 除了调用 `run_inference` 以外完全一样。import 放在设置环境变量之后，这样 `a_ext` 加载时能看到模式。注意 `config_path` 是相对源文件的路径，只在可编辑安装下有效；部署到别处的 wheel 应当从环境变量读取配置目录，或者把配置打包进包里。

```bash
uv run my-train model=base runtime=local experiment=train_base
uv run my-infer task=infer runtime=inference experiment=infer_base
```

## 12. 什么进 `packages/`、什么进 `third_party/`、什么哪里都不进

这些规则最好在团队里写死。

**进 `packages/`**，满足任意一条即可：你们自己写的；要和主项目一起长期演化；训练和推理共享；你希望它作为独立的包被 import。first-party 的 CUDA 扩展就是教科书式的例子。

**进 `third_party/`**，需要同时满足：是第三方源码；你们确实改过；改动会存在超过一个下午。

**哪里都不进**（当作普通的 PyPI 或 git 依赖声明），如果：没改过；只是正常依赖；不需要一起开发。

## 13. uv 里依赖 torch 的包怎么处理

uv 对构建时需要 `torch` 的包有两类设置，应按顺序尝试。

1. **workspace member。** 用于你自己的 `a_ext`。
2. **`extra-build-dependencies`。** 用于构建时需要 `torch` 的包。`match-runtime = true` 让 uv 用项目环境里安装的同一个 `torch` 版本去构建它们。

   ```toml
   [tool.uv.extra-build-dependencies]
   some-patched-lib = [{ requirement = "torch", match-runtime = true }]
   ```

3. **`no-build-isolation-package`。** 只在上一种方式不够用时再上。uv 会做两阶段安装：先装所有能隔离构建的包，再装需要项目环境的包。

   ```toml
   [tool.uv]
   no-build-isolation-package = ["some-patched-lib"]
   ```

不要一上来就把所有 torch 相关的包扔进 `no-build-isolation-package`。先试更细粒度的 build dependency 约束，真不行再禁用隔离。

## 14. 开发机、CI、训练机、推理机

这一部分能避免"开发时能跑，上线不一致"。

- **开发机。** Python 层和 CUDA kernel 都在频繁改动。`uv sync`，`A_EXT_MODE=jit`，允许 JIT 编译，本地做 benchmark 和 correctness test。
- **CI。** 不要依赖在 runner 上现场 JIT。构建 `a_ext` 的 wheel，跑 `opcheck`，跑 `gradcheck`，跑 integration tests。
- **训练机。** 安装预编译的 wheel，`A_EXT_MODE=prebuilt`，不在任务启动时重新编译。
- **推理机。** 只用 prebuilt。不在线上 import 阶段 JIT。

这样训练和推理运行的是同一个 native artifact，只是上层配置不同。

## 15. 我不会做的几件事

1. 靠改 `__init__.py` 切换 JIT 和 prebuilt。容易误提交，环境会漂移。
2. 把 first-party 扩展放在 `submodules/`。语义不对，后期维护也乱。
3. 让业务代码直接到处写 `torch.ops.xxx`。替换实现、fallback 和测试都会很痛苦。
4. 训练和推理各维护一套模型代码。共用 model、ops、tokenizer 和 preprocess，只在 runner、service 和 batching policy 上分叉。
5. 每个实验复制一整份 YAML。defaults list 的存在就是为了不用这么做。

## 16. 迁移顺序

已有项目不建议重写，按下面的顺序改。

1. 保留现有 `src/<project>/` 不动。
2. 把 CUDA 扩展从 `submodules/A_ext` 挪到 `packages/a_ext`。
3. 给 `a_ext` 补上 `pyproject.toml`、`setup.py`、`_loader.py`、`_jit.py` 和 `ops.py`。
4. 把 JIT/prebuilt 的切换改成环境变量控制。
5. 补 `fake.py`，必要时补 `autograd.py`，再补 `opcheck` 和 `gradcheck`。
6. 把主项目的正式入口改成 `[project.scripts]`。
7. 把 `configs/base.yaml` 收敛成 `configs/config.yaml`，开始用 config group 加 experiment override。
8. 把打过补丁的第三方代码从杂乱的 `submodules/` 清理到 `third_party/`，并只对真正需要的包启用 uv 的特殊构建设置。

## 17. 总结

原先那套零散的布局并不是错的，只是差一层正式化。最值得改的不是 kernel 的写法，而是三条边界：

- **first-party 与 third-party。** 自己的扩展在 `packages/`，改过的外部代码在 `third_party/`，没改过的依赖来自 registry 或 git。
- **开发态与生产态。** 开发态允许 JIT，生产态只用 prebuilt，用环境变量切换而不是改源码。
- **业务逻辑与 native 实现。** 主项目依赖 `a_ext`；`a_ext` 自己管理构建与注册；业务层只走 wrapper，不直接碰 `torch.ops`。

参考文献见下文英文部分。

---

## English version

Provenance: this began as a ChatGPT answer to a question I asked about
restructuring one of my projects. I kept it because it was useful, then edited
it and fixed several details, noted inline, while turning it into this post.

Notes on a layout I settled on for research code that has to do all of the
following at once:

- training and inference share one core codebase
- a first-party CUDA extension
- a few patched third-party dependencies
- `uv` with `pyproject.toml`
- Hydra for config composition
- CI, packaging, deployment, and reproducibility later on

It is not the only reasonable answer. Each boundary below exists because I got
burned without it.

## 1. Directory layout

Keep code you wrote and third-party code you patched completely separate.

```text
repo/
├── pyproject.toml
├── uv.lock
├── README.md
├── configs/
│   ├── config.yaml
│   ├── task/          train.yaml, infer.yaml
│   ├── model/         base.yaml, large.yaml
│   ├── data/          train.yaml, infer.yaml
│   ├── optimizer/     adamw.yaml
│   ├── trainer/       single_gpu.yaml, ddp.yaml, fsdp.yaml
│   ├── runtime/       local.yaml, cluster.yaml, inference.yaml
│   ├── paths/         local.yaml, cluster.yaml
│   ├── logging/       default.yaml, mlflow.yaml
│   └── experiment/    train_base.yaml, infer_base.yaml
├── src/
│   └── my_project/
│       ├── cli/       train.py, infer.py, export.py
│       ├── config_schema/
│       ├── data/  models/  training/  inference/  serving/
│       ├── ops/       fused_ops.py, dispatch.py
│       └── utils/
├── packages/
│   └── a_ext/
│       ├── pyproject.toml
│       ├── setup.py
│       ├── csrc/      registration.cpp, kernels.cu, cpu_kernels.cpp, common.h
│       ├── src/a_ext/ __init__.py, _loader.py, _jit.py, ops.py, fake.py, autograd.py
│       └── tests/     test_correctness.py, test_opcheck.py, test_gradcheck.py
├── third_party/
│   └── some_patched_lib/
├── tests/             unit/, integration/, e2e/
├── scripts/           dev/, oneoff/
├── docker/            train.Dockerfile, infer.Dockerfile
└── outputs/
```

The boundaries that matter:

- `src/my_project/` is the main package. Training, inference, export, and
  serving all live here.
- `packages/a_ext/` is the first-party CUDA extension. It is a real package
  that the main project depends on, not a helper script. A uv workspace exists
  for exactly this several-packages-one-repo case.
- `third_party/` holds third-party code you have patched. Do not mix it with
  your own.
- `configs/` only composes configuration. Hydra's defaults list assembles a
  final config from groups, so you never copy a whole YAML per experiment.

## 2. Root `pyproject.toml`

The main project is itself a package, defines the uv workspace, lists `a_ext`
as a workspace member, pulls patched third-party code through a path source,
and exposes CLIs as entry points rather than relying on `scripts/*.py` as the
official way in. The `src` layout and entry points are both standard
packaging practice.

```toml
[build-system]
requires = ["setuptools>=80", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "my-project"
version = "0.1.0"
description = "Training and inference in one codebase"
readme = "README.md"
requires-python = ">=3.11"
dependencies = [
  "torch==2.6.0",
  "hydra-core>=1.3",
  "omegaconf>=2.3",
  "numpy>=1.26",
  "packaging>=24.0",
  "a-ext",
]

[project.optional-dependencies]
train = ["mlflow>=2.20", "tensorboard>=2.18"]
infer = ["fastapi>=0.115", "uvicorn>=0.34"]

[project.scripts]
my-train = "my_project.cli.train:main"
my-infer = "my_project.cli.infer:main"
my-export = "my_project.cli.export:main"

[tool.setuptools]
package-dir = {"" = "src"}

[tool.setuptools.packages.find]
where = ["src"]

[tool.uv.workspace]
members = ["packages/a_ext"]

[tool.uv.sources]
a-ext = { workspace = true }
some-patched-lib = { path = "third_party/some_patched_lib" }

[dependency-groups]
dev = [
  "pytest>=8.0",
  "pytest-cov>=6.0",
  "mypy>=1.14",
  "ruff>=0.11",
  "pre-commit>=4.0",
]

[tool.pytest.ini_options]
addopts = ["--import-mode=importlib", "--strict-markers"]
testpaths = ["tests", "packages/a_ext/tests"]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP"]

[tool.mypy]
python_version = "3.11"
warn_unused_configs = true
pretty = true
```

Development tools go in `[dependency-groups]`, which `uv sync` installs by
default, rather than in a `dev` extra that would end up in the published
metadata.

## 3. `packages/a_ext/pyproject.toml`

This file describes `a_ext` only. Keep the `[build-system]` table; a package
without one cannot be built in isolation.

```toml
[build-system]
requires = ["setuptools>=80", "wheel", "torch"]
build-backend = "setuptools.build_meta"

[project]
name = "a-ext"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = ["torch>=2.6,<2.7"]

[tool.setuptools]
package-dir = {"" = "src"}

[tool.setuptools.packages.find]
where = ["src"]
```

## 4. `packages/a_ext/setup.py`

A minimal `setup.py`: metadata lives in `pyproject.toml`, build logic here.

```python
from setuptools import setup
from torch.utils.cpp_extension import BuildExtension, CUDAExtension


def get_extensions() -> list[CUDAExtension]:
    """Describe the native extension module.

    Returns:
        A single CUDAExtension building the CPU and CUDA sources into a_ext._C.
    """
    sources = [
        "csrc/registration.cpp",
        "csrc/cpu_kernels.cpp",
        "csrc/kernels.cu",
    ]
    extra_compile_args = {
        "cxx": ["-O3", "-std=c++17"],
        "nvcc": ["-O3", "--use_fast_math", "-lineinfo"],
    }
    return [
        CUDAExtension(
            name="a_ext._C",
            sources=sources,
            extra_compile_args=extra_compile_args,
        )
    ]


setup(
    ext_modules=get_extensions(),
    cmdclass={"build_ext": BuildExtension},
)
```

## 5. Python layering inside `a_ext`

The most important rule in the whole extension: **do not switch between
development and production behavior by editing `__init__.py`.** Select the
mode with an environment variable and keep both paths in code.

### `src/a_ext/_loader.py`

```python
import os
from pathlib import Path

import torch


def load_prebuilt() -> None:
    """Load the shared library produced by ``setup.py build_ext``.

    setuptools names the artifact with the platform tag, for example
    ``_C.cpython-311-x86_64-linux-gnu.so``, so glob for it instead of
    hard-coding ``_C.so``.
    """
    pkg_dir = Path(__file__).resolve().parent
    candidates = sorted(pkg_dir.glob("_C*.so"))
    assert candidates, f"No prebuilt _C*.so in {pkg_dir}; build the wheel or set A_EXT_MODE=jit"
    torch.ops.load_library(str(candidates[0]))


def load_jit(verbose: bool = True) -> None:
    """Build the extension with the JIT toolchain and load it.

    Args:
        verbose: Forwarded to ``torch.utils.cpp_extension.load``.
    """
    from ._jit import build_and_load_jit

    build_and_load_jit(verbose=verbose)


def load_extension() -> None:
    """Load the extension according to ``A_EXT_MODE`` (``prebuilt`` or ``jit``)."""
    mode = os.getenv("A_EXT_MODE", "prebuilt").strip().lower()
    if mode == "prebuilt":
        load_prebuilt()
        return
    if mode == "jit":
        load_jit()
        return
    raise ValueError(f"Unsupported A_EXT_MODE: {mode}")
```

### `src/a_ext/_jit.py`

```python
from pathlib import Path

from torch.utils.cpp_extension import load


def build_and_load_jit(verbose: bool = True) -> None:
    """Compile the csrc tree with ninja and load it into the process.

    Args:
        verbose: Print the compiler invocations.
    """
    root = Path(__file__).resolve().parents[2]  # packages/a_ext
    csrc = root / "csrc"
    sources = [
        str(csrc / "registration.cpp"),
        str(csrc / "cpu_kernels.cpp"),
        str(csrc / "kernels.cu"),
    ]
    load(
        name="a_ext_jit",
        sources=sources,
        extra_cflags=["-O3", "-std=c++17"],
        extra_cuda_cflags=["-O3", "--use_fast_math", "-lineinfo"],
        verbose=verbose,
        is_python_module=False,
    )
```

`is_python_module=False` matters. The production path relies on dispatcher
registration plus `torch.ops.load_library`, not on importing a pybind module.
With this flag the JIT path loads the library as a side effect and returns
nothing, which keeps it as close to the production path as possible. The
PyTorch custom-ops tutorial describes both loading styles.

### `src/a_ext/__init__.py`

```python
from ._loader import load_extension

load_extension()

# The fake and autograd registrations must exist wherever the op is used, not
# only in the test suite; import them after the library is loaded.
from . import autograd as _autograd  # noqa: E402, F401
from . import fake as _fake  # noqa: E402, F401
```

## 6. C++ registration

### `csrc/registration.cpp`

```cpp
#include <torch/library.h>

torch::Tensor a_ext_forward_cuda(torch::Tensor x, torch::Tensor y);
torch::Tensor a_ext_forward_cpu(torch::Tensor x, torch::Tensor y);

TORCH_LIBRARY(a_ext, m) {
  m.def("forward(Tensor x, Tensor y) -> Tensor");
}

TORCH_LIBRARY_IMPL(a_ext, CPU, m) {
  m.impl("forward", &a_ext_forward_cpu);
}

TORCH_LIBRARY_IMPL(a_ext, CUDA, m) {
  m.impl("forward", &a_ext_forward_cuda);
}
```

This is the registration style the PyTorch custom-op tutorial recommends.
Newer PyTorch versions add `STABLE_TORCH_LIBRARY` for ABI-stable extensions;
the structure is the same.

### `src/a_ext/ops.py`

```python
import torch


def forward(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    """Call the registered custom operator.

    Args:
        x: First operand.
        y: Second operand, same shape as ``x``.

    Returns:
        The operator output.
    """
    return torch.ops.a_ext.forward(x, y)
```

## 7. Fake and autograd for the training path

For an inference-only kernel, many people register the CUDA implementation and
stop. For a training-and-inference project, wire the training interfaces from
day one. The PyTorch guide is explicit: `register_fake` is needed for
`torch.compile`, FakeTensor, and export; `register_autograd` is the way to add
a backward; and `opcheck` validates that the registrations are correct.

### `src/a_ext/fake.py`

```python
import torch


@torch.library.register_fake("a_ext::forward")
def _fake_forward(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    """Shape and dtype propagation without running the kernel."""
    torch._check(x.shape == y.shape, lambda: "Input shapes must match.")
    return torch.empty_like(x)
```

### `src/a_ext/autograd.py`

```python
import torch


def _setup_context(ctx: torch.autograd.function.FunctionCtx, inputs, output) -> None:
    """Save what backward needs."""
    x, y = inputs
    ctx.save_for_backward(x, y)


def _backward(
    ctx: torch.autograd.function.FunctionCtx,
    grad_output: torch.Tensor,
) -> tuple[torch.Tensor, torch.Tensor]:
    """Backward formula for an elementwise sum."""
    return grad_output, grad_output


torch.library.register_autograd(
    "a_ext::forward",
    _backward,
    setup_context=_setup_context,
)
```

## 8. Tests for the extension

The part teams most often skip.

### `packages/a_ext/tests/test_correctness.py`

```python
import torch

from a_ext.ops import forward


def test_forward_matches_reference() -> None:
    x = torch.randn(8, 16, device="cuda")
    y = torch.randn(8, 16, device="cuda")
    assert torch.allclose(forward(x, y), x + y, atol=1e-5, rtol=1e-5)
```

### `packages/a_ext/tests/test_opcheck.py`

```python
import torch

from a_ext.ops import forward


def test_opcheck() -> None:
    x = torch.randn(4, 8, device="cuda")
    y = torch.randn(4, 8, device="cuda")
    torch.library.opcheck(
        forward,
        (x, y),
        test_utils=("test_schema", "test_autograd_registration", "test_faketensor"),
    )
```

### `packages/a_ext/tests/test_gradcheck.py`

```python
import torch

from a_ext.ops import forward


def test_gradcheck() -> None:
    x = torch.randn(2, 3, device="cuda", dtype=torch.double, requires_grad=True)
    y = torch.randn(2, 3, device="cuda", dtype=torch.double, requires_grad=True)
    assert torch.autograd.gradcheck(forward, (x, y), eps=1e-6, atol=1e-4)
```

`opcheck` is part of the official recommended test flow; `gradcheck` is the
classic way to verify a backward formula in a training setting.

## 9. Calling the extension from the main project

Do not scatter `torch.ops.a_ext.*` through the codebase. Wrap it once under
`src/my_project/ops/`.

```python
import torch

from a_ext.ops import forward as a_ext_forward

USE_CUSTOM_OP = True


def fused_add(x: torch.Tensor, y: torch.Tensor) -> torch.Tensor:
    """Project-level wrapper with a reference fallback.

    Args:
        x: First operand.
        y: Second operand.

    Returns:
        ``x + y`` computed by the custom kernel on CUDA, by PyTorch otherwise.
    """
    if USE_CUSTOM_OP and x.is_cuda:
        return a_ext_forward(x, y)
    return x + y
```

One wrapper makes swapping the implementation, adding a fallback,
benchmarking, and A/B testing cheap. Not every environment can build the
extension, and both training and inference need to keep working when it
cannot.

## 10. Hydra layout

Hydra's defaults list assembles the final config from groups. Do not stir
train and infer into one file.

### `configs/config.yaml`

```yaml
defaults:
  - task: train
  - model: base
  - data: train
  - optimizer: adamw
  - trainer: single_gpu
  - runtime: local
  - paths: local
  - logging: default
  - experiment: null
  - _self_

project:
  name: my_project
  seed: 42

hydra:
  run:
    dir: outputs/${now:%Y-%m-%d}/${task.name}/${now:%H-%M-%S}
  sweep:
    dir: multirun/${now:%Y-%m-%d}/${task.name}
    subdir: ${hydra.job.num}
```

### `configs/runtime/local.yaml` and `configs/runtime/inference.yaml`

```yaml
# local.yaml
device: cuda
precision: bf16
num_workers: 4
compile: false
extension_mode: jit
```

```yaml
# inference.yaml
device: cuda
precision: fp16
num_workers: 2
compile: true
extension_mode: prebuilt
```

The extension's load mode belongs in the runtime config as a run-mode switch;
compile details do not. An experiment file overrides whatever it needs at the
global level:

```yaml
# configs/experiment/train_base.yaml
# @package _global_
defaults:
  - override /model: base
  - override /trainer: ddp

trainer:
  max_steps: 100000
```

Hydra also creates an output directory per run with the log and a YAML
snapshot of the composed config, under the `hydra.run.dir` pattern above.

## 11. CLI entry points

Official entry points are package entry points, not `scripts/xxx.py`.

```python
# src/my_project/cli/train.py
import os

import hydra
from omegaconf import DictConfig


@hydra.main(version_base=None, config_path="../../../configs", config_name="config")
def main(cfg: DictConfig) -> None:
    os.environ["A_EXT_MODE"] = cfg.runtime.extension_mode

    from my_project.training.runner import run_training

    run_training(cfg)


if __name__ == "__main__":
    main()
```

`infer.py` is identical with `run_inference`. The import happens after the
environment variable is set so that `a_ext` sees the mode when it loads. Note
that `config_path` is relative to the source file and only resolves in an
editable install; a wheel deployed elsewhere should get the config directory
from an environment variable or ship the configs inside the package.

```bash
uv run my-train model=base runtime=local experiment=train_base
uv run my-infer task=infer runtime=inference experiment=infer_base
```

## 12. What goes in `packages/`, `third_party/`, or nowhere

Write these rules down for the team.

**`packages/`**, if any of the following holds: you wrote it; it evolves
together with the main project; training and inference share it; you want to
import it as its own package. A first-party CUDA extension is the textbook
case.

**`third_party/`**, if all of the following hold: it is someone else's code;
you actually changed it; the change will live for more than an afternoon.

**Neither** (declare it as a normal PyPI or git dependency), if you have not
changed it, you only depend on it, and you do not develop it alongside.

## 13. Torch-dependent packages under uv

uv has two settings for packages whose build needs `torch`, and they should be
tried in order.

1. **Workspace member.** For your own `a_ext`.
2. **`extra-build-dependencies`.** For packages that need `torch` at build
   time. `match-runtime = true` makes uv build them against the same `torch`
   version that is installed in the project environment.

   ```toml
   [tool.uv.extra-build-dependencies]
   some-patched-lib = [{ requirement = "torch", match-runtime = true }]
   ```

3. **`no-build-isolation-package`.** Only when the previous option is not
   enough. uv then performs a two-phase install: everything that builds in
   isolation first, then the packages that need the project environment.

   ```toml
   [tool.uv]
   no-build-isolation-package = ["some-patched-lib"]
   ```

Do not reach for `no-build-isolation-package` first for every torch-related
package. Try the narrower build-dependency constraint, and disable isolation
only when that fails.

## 14. Dev, CI, training, inference

This is what prevents "works on my machine, differs in production".

- **Development box.** Python and CUDA both change often. `uv sync`,
  `A_EXT_MODE=jit`, JIT builds allowed, local benchmarks and correctness
  tests.
- **CI.** Never rely on JIT-compiling on the runner. Build the `a_ext` wheel,
  run `opcheck`, run `gradcheck`, run the integration tests.
- **Training machines.** Install the prebuilt wheel, `A_EXT_MODE=prebuilt`,
  never recompile at job start.
- **Inference machines.** Prebuilt only. No JIT at import time in production.

Training and inference then run the same native artifact and differ only in
the configuration above it.

## 15. Things I would not do

1. Toggling JIT and prebuilt by editing `__init__.py`. It gets committed by
   accident and environments drift.
2. Putting a first-party extension under `submodules/`. Wrong semantics, and
   it becomes a maintenance mess.
3. Calling `torch.ops.xxx` directly from business logic. Replacement,
   fallback, and testing all become painful.
4. Maintaining separate model code for training and inference. Share the
   model, ops, tokenizer, and preprocessing; fork only at the runner, the
   service, and the batching policy.
5. Copying an entire YAML per experiment. The defaults list exists to make
   that unnecessary.

## 16. Migration order

For an existing project, do not rewrite. Move in this order.

1. Leave the existing `src/<project>/` alone.
2. Move the CUDA extension from `submodules/A_ext` to `packages/a_ext`.
3. Give `a_ext` a `pyproject.toml`, `setup.py`, `_loader.py`, `_jit.py`, and
   `ops.py`.
4. Turn the JIT/prebuilt switch into an environment variable.
5. Add `fake.py`, `autograd.py` where needed, then `opcheck` and
   `gradcheck`.
6. Move the official entry points to `[project.scripts]`.
7. Collapse `configs/base.yaml` into `configs/config.yaml` and start using
   config groups plus experiment overrides.
8. Move patched third-party code out of `submodules/` into `third_party/`,
   enabling the special uv build settings only for packages that need them.

## 17. Summary

The original ad-hoc layout was not wrong; it was one step of formalization
short. What is worth changing is not the kernel code but three boundaries:

- **First-party versus third-party.** Your extensions in `packages/`, patched
  external code in `third_party/`, unmodified dependencies from the registry
  or git.
- **Development versus production.** JIT allowed in development, prebuilt only
  in production, switched by environment rather than by editing source.
- **Business logic versus native implementation.** The main project depends
  on `a_ext`; `a_ext` owns its build and registration; the business layer
  goes through a wrapper and never touches `torch.ops` directly.

## References

1. Astral, [Using workspaces](https://docs.astral.sh/uv/concepts/projects/workspaces/) and [Configuring projects](https://docs.astral.sh/uv/concepts/projects/config/), uv documentation.
2. Hydra, [The Defaults List](https://hydra.cc/docs/advanced/defaults_list/) and [Customizing working directory pattern](https://hydra.cc/docs/configure_hydra/workdir/).
3. Python Packaging User Guide, [Writing your pyproject.toml](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/) and [Entry points specification](https://packaging.python.org/en/latest/specifications/entry-points/).
4. PyTorch, [Custom C++ and CUDA Operators](https://docs.pytorch.org/tutorials/advanced/cpp_custom_ops.html) and [torch.library](https://docs.pytorch.org/docs/stable/library.html).
