# 规格书生成系统

基于 Next.js 16 的规格书画布编辑器，文档和版本数据保存在本地 SQLite 数据库中。

## 本地开发

```bash
npm ci
npm run dev
```

访问 <http://localhost:3000>。

## Docker 部署

### 1. 准备配置

```bash
cp .env.docker.example .env
```

Windows PowerShell：

```powershell
Copy-Item .env.docker.example .env
```

默认使用宿主机 `3000` 端口。如端口被占用，可在 `.env` 中修改 `APP_PORT`。

### 2. 构建并启动

```bash
docker compose up -d --build
```

查看状态和日志：

```bash
docker compose ps
docker compose logs -f app
```

停止服务：

```bash
docker compose down
```

更新项目后重新部署：

```bash
docker compose up -d --build
```

## 数据持久化

Compose 将宿主机的 `./data` 挂载到容器 `/app/data`。SQLite 数据库位于：

```text
data/datasheets.sqlite
```

升级或重建容器不会删除该文件。迁移到另一台主机时，需要一起复制项目和 `data/` 目录。

建议定期备份：

```bash
cp data/datasheets.sqlite data/datasheets.sqlite.bak
```

备份前先停止容器，避免复制到写入中的数据库：

```bash
docker compose stop app
docker compose start app
```

## 可选：同时运行 OnlyOffice

OnlyOffice Document Server 资源占用较高，不默认启动。需要时使用第二个 Compose 文件：

```bash
docker compose -f compose.yaml -f compose.onlyoffice.yaml up -d --build
```

如果从局域网其他设备访问，请把 `.env` 中的地址改成小主机实际 IP：

```dotenv
ONLYOFFICE_PUBLIC_URL=http://192.168.1.20:8080
```

应用地址为 `http://192.168.1.20:3000`，OnlyOffice 地址为
`http://192.168.1.20:8080`。

停止包含 OnlyOffice 的服务：

```bash
docker compose -f compose.yaml -f compose.onlyoffice.yaml down
```

OnlyOffice 的数据使用 Docker 命名卷保存。部分 ARM 小主机可能无法直接运行官方
OnlyOffice 镜像，此时可以只运行主应用，或将 OnlyOffice 部署在另一台 x86-64 主机上。

## 反向代理

需要从互联网访问时，建议在应用前配置 Nginx、Caddy 或其他反向代理并启用 HTTPS，
不要直接把 Next.js 和 OnlyOffice 端口暴露到公网。

