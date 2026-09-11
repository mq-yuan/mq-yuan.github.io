---
title: "Borrowing your laptop's proxy from a server"
date: 2025-09-07
description: "Point a server's proxy variables at your own machine: directly when the server can reach you, and through an SSH reverse tunnel when it cannot."
tags: ["ssh", "proxy", "linux"]
---

> 中文标题：让服务器借用笔记本上的代理。本文为中英双语，中文为原文，英文版本由 AI 翻译，见分隔线之后。
> An English version, translated from the Chinese original with AI
> assistance, follows after the divider.

实验室和云上的服务器经常需要代理，才能以可用的速度访问包索引、模型仓库或 GitHub；而同样经常发生的是，出于各种原因你不能或不愿在共享机器上安装和配置代理软件。自己的笔记本则不同：你可以在上面运行任何东西。所以办法是让服务器使用笔记本上已经在跑的代理。

分两种情况，取决于服务器能否主动连到你的笔记本。

## 情况一：服务器能找到笔记本

同一个局域网，或者笔记本有公网地址。这时服务器可以直接访问笔记本上的代理端口。需要满足两点。

1. 笔记本上的代理客户端要监听局域网可达的地址，而不只是 `127.0.0.1`。Clash 一类客户端里这是"Allow LAN"开关；默认的 mixed 端口同时支持 HTTP 和 SOCKS5，是 `7890`。
2. 要告诉服务器上的工具代理在哪。大多数命令行工具（`curl`、`git`、`pip`、`uv`、Hugging Face CLI，以及配置一行之后的 `apt`）都遵循标准环境变量：

```bash
export ALL_PROXY="socks5h://<laptop-ip>:7890"
export http_proxy="http://<laptop-ip>:7890"
export https_proxy="http://<laptop-ip>:7890"
```

scheme 很重要。`ALL_PROXY` 不带 `socks5h://` 或 `http://` 时，不同工具的解释不一样，所以要写全。`socks5h` 里的 `h` 表示让代理端解析域名；单纯的 `socks5://` 会先在服务器上解析，而少数工具只接受这种形式。这就是[代理环境下的 DNS](/writing/dns-under-a-proxy/)那篇里说的"系统代理"，只是按 shell 设置而不是在操作系统里设置。

## 情况二：服务器找不到笔记本

更常见的是服务器才有公网地址，笔记本在别处的 NAT 后面。但你能从笔记本 SSH 到服务器，而 SSH 可以把端口朝任一方向转发。所以把服务器上的一个端口反向转发回笔记本上的代理：

```bash
ssh -N -R 7890:localhost:7890 user@server
```

只要这个会话开着，服务器上任何连到 `localhost:7890` 的流量都会经由 SSH 连接送到笔记本的 `7890` 端口，也就是你的代理客户端。在服务器的另一个 shell 里：

```bash
export ALL_PROXY="socks5h://127.0.0.1:7890"
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"
```

用 keep-alive 让隧道在空闲时不断开，或者让 `autossh` 在断开后重启它：

```bash
ssh -N -R 7890:localhost:7890 -o ServerAliveInterval=60 -o ExitOnForwardFailure=yes user@server
autossh -M 0 -N -R 7890:localhost:7890 -o ServerAliveInterval=60 -o ExitOnForwardFailure=yes user@server
```

## Local 转发与 Remote 转发

这两个 SSH 选项在"正向代理"和"反向代理"的名字下困扰了我很久。把它们理解为 _local_ 和 _remote_ 转发更容易：选项名说的是新的监听端口出现在哪一侧。

**`-L`，local 转发。** 让本机的一个端口代表服务器上的一个端口：

```bash
ssh -N -L <local-port>:localhost:<server-port> user@server
```

`-N` 表示不开 shell，只做转发。在本机连 `localhost:<local-port>`，到达的是服务器上的 `<server-port>`。典型用法是链式跳转：机器 A 到不了 C，但 A 能到 B，B 能通过 22 端口到 C。在 A 上运行

```bash
ssh -N -L 3456:C:22 user@B
```

之后在 A 上 `ssh -p 3456 localhost` 就落到了 C。

**`-R`，remote 转发。** 让服务器上的一个端口代表本机的一个端口：

```bash
ssh -N -R <server-port>:localhost:<local-port> user@server
```

任何连到服务器 `<server-port>` 的流量都会被送到本机的 `<local-port>`。情况二用的就是它。同一条命令也能解决镜像问题：学校里一台没有公网地址的 GPU 机器上部署了一个模型，想让别人访问，就买一台有公网地址的小云主机，在 GPU 机器上运行 `ssh -N -R 8000:localhost:8000 user@cloud-vm`。谁访问云主机的 8000 端口，就到达了 GPU 机器。

## 两点注意

- **共享服务器上隧道也是共享的。** 转发的端口监听在服务器的 loopback 上，这台机器上的每个用户都能连 `127.0.0.1:7890`，也就是每个用户都能经由你的笔记本转发流量。在共享机器上，选一个不常见的端口，用完就关掉隧道，并且不要打开 `GatewayPorts`，否则端口会暴露给整个网络。
- **DNS 总要在某处发生。** 用 `socks5h` 时服务器把域名交给笔记本，解析在笔记本上进行；`http_proxy` 的 `CONNECT` 隧道也是如此。不遵循这些变量的工具则照常在服务器上解析和连接。

参考文献见下文英文部分。

---

## English version

Lab and cloud servers often need a proxy to reach package indexes, model
hubs, or GitHub at a usable speed, and just as often you are not allowed to,
or would rather not, install and configure proxy software on a shared
machine. Your own laptop is a different story: you can run whatever you want
there. So the trick is to make the server use the proxy that already runs on
your laptop.

There are two cases, depending on whether the server can open a connection to
your laptop.

## Case 1: the server can reach your laptop

Same LAN, or your laptop has a public address. Then the server can talk to the
proxy port on your laptop directly. Two things need to be true.

1. The proxy client on your laptop must listen on a LAN-reachable address,
   not only on `127.0.0.1`. In Clash-style clients this is the "Allow LAN"
   switch; the default mixed port, which speaks both HTTP and SOCKS5, is
   `7890`.
2. The server's tools have to be told where the proxy is. Most command-line
   tools (`curl`, `git`, `pip`, `uv`, the Hugging Face CLI, and `apt` with a
   line of configuration) honor the standard environment variables:

```bash
export ALL_PROXY="socks5h://<laptop-ip>:7890"
export http_proxy="http://<laptop-ip>:7890"
export https_proxy="http://<laptop-ip>:7890"
```

The scheme matters. `ALL_PROXY` without `socks5h://` or `http://` is
interpreted differently by different tools, so spell it out. The `h` in
`socks5h` asks the proxy to resolve names itself; plain `socks5://` resolves
on the server first, and a few tools accept only the plain form. This is the
"system proxy" idea from
[What happens to DNS under a proxy](/writing/dns-under-a-proxy/), set per
shell instead of in the OS.

## Case 2: the server cannot reach your laptop

Usually the server has the public address and your laptop is behind NAT
somewhere else. But you can SSH from the laptop to the server, and SSH can
carry a port in either direction. So forward a port on the server back to the
proxy on your laptop:

```bash
ssh -N -R 7890:localhost:7890 user@server
```

While that session is open, anything on the server that connects to
`localhost:7890` is carried through the SSH connection to port `7890` on your
laptop, which is your proxy client. On the server, in another shell:

```bash
export ALL_PROXY="socks5h://127.0.0.1:7890"
export http_proxy="http://127.0.0.1:7890"
export https_proxy="http://127.0.0.1:7890"
```

Keep the tunnel alive across idle periods with keep-alives, or let `autossh`
restart it when it drops:

```bash
ssh -N -R 7890:localhost:7890 -o ServerAliveInterval=60 -o ExitOnForwardFailure=yes user@server
autossh -M 0 -N -R 7890:localhost:7890 -o ServerAliveInterval=60 -o ExitOnForwardFailure=yes user@server
```

## Local and remote forwarding

The two SSH flags confused me for a long time under the names "forward proxy"
and "reverse proxy". Thinking of them as _local_ and _remote_ forwarding is
easier: the flag names the side on which the new listening port appears.

**`-L`, local forwarding.** A port on your machine stands in for a port on
the server:

```bash
ssh -N -L <local-port>:localhost:<server-port> user@server
```

`-N` says do not start a shell, only forward. Connecting to
`localhost:<local-port>` here reaches `<server-port>` there. The classic use
is chaining: machine A cannot reach C, but A can reach B, and B can reach C on
port 22. Run on A

```bash
ssh -N -L 3456:C:22 user@B
```

and `ssh -p 3456 localhost` from A lands on C.

**`-R`, remote forwarding.** A port on the server stands in for a port on
your machine:

```bash
ssh -N -R <server-port>:localhost:<local-port> user@server
```

Anything that connects to `<server-port>` on the server is delivered to
`<local-port>` here. This is what case 2 uses. The same command solves the
mirror-image problem: a model served on a lab GPU box with no public address
can be exposed on a small cloud VM that has one, by running
`ssh -N -R 8000:localhost:8000 user@cloud-vm` from the lab box. Anyone who
reaches the VM's port 8000 gets the lab box.

## Two cautions

- **A shared server shares the tunnel.** The forwarded port listens on the
  server's loopback, and every user on that machine can connect to
  `127.0.0.1:7890`, which means every user can route traffic through your
  laptop. On a shared box, pick an unusual port, close the tunnel when you are
  done, and leave `GatewayPorts` off, since turning it on would expose the port
  to the whole network.
- **DNS still happens somewhere.** With `socks5h` the server hands the domain
  to your laptop and resolution happens there; with `http_proxy` the same is
  true for `CONNECT` tunnels. Tools that ignore the variables resolve and
  connect on the server as usual.

## References

1. OpenSSH, [ssh(1)](https://man.openbsd.org/ssh), the `-L`, `-R`, and `-N` options.
2. OpenSSH, [ssh_config(5)](https://man.openbsd.org/ssh_config), for `ServerAliveInterval`, `ExitOnForwardFailure`, and `GatewayPorts`.
3. [autossh](https://www.harding.motd.ca/autossh/), a wrapper that restarts an SSH tunnel when it drops.
